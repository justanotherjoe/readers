-- Find friends by name (opt in), add people from your clubs, recommend books to friends
alter table public.profiles add column discoverable boolean not null default false;
alter table public.profiles add column username text;
alter table public.profiles add constraint profiles_username_fmt check (username is null or username ~ '^[a-zA-Z0-9_]{3,20}$');
create unique index profiles_username_key on public.profiles (lower(username)) where username is not null;

create function public.find_readers(p_q text) returns table (code text, name text, username text)
language sql stable security definer set search_path = public as $$
  select p.code, p.name, p.username from public.profiles p
  where auth.uid() is not null and p.discoverable and p.user_id <> auth.uid()
    and length(trim(p_q)) >= 2
    and (position(lower(trim(p_q)) in lower(p.name)) > 0
      or position(lower(ltrim(trim(p_q), '@')) in lower(coalesce(p.username, ''))) > 0)
  order by p.name limit 10
$$;

create function public.request_friend_user(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t public.profiles;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if not exists (select 1 from public.club_members a join public.club_members b on a.club_id = b.club_id
                 where a.user_id = auth.uid() and b.user_id = p_user) then
    raise exception 'You can only add people from your clubs this way';
  end if;
  select * into t from public.profiles where user_id = p_user;
  if not found then raise exception 'That reader has not finished setting up friends yet'; end if;
  return public.request_friend(t.code);
end $$;

create function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() in (a, b) and exists (
    select 1 from public.friendships f where f.status = 'accepted'
      and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a)))
$$;

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  from_name text not null default 'A friend',
  title text not null check (length(title) <= 200),
  author text not null check (length(author) <= 200),
  tags jsonb not null default '[]'::jsonb,
  pages int not null default 0,
  note text not null default '' check (length(note) <= 200),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index recommendations_to_idx on public.recommendations (to_user);
create index recommendations_from_idx on public.recommendations (from_user);
alter table public.recommendations enable row level security;
create policy "send to friends" on public.recommendations for insert to authenticated
  with check (from_user = (select auth.uid()) and public.are_friends(from_user, to_user));
create policy "see mine" on public.recommendations for select to authenticated
  using (to_user = (select auth.uid()) or from_user = (select auth.uid()));
create policy "delete mine" on public.recommendations for delete to authenticated
  using (to_user = (select auth.uid()) or from_user = (select auth.uid()));

revoke all on function public.find_readers(text), public.request_friend_user(uuid), public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.find_readers(text), public.request_friend_user(uuid), public.are_friends(uuid, uuid) to authenticated;
