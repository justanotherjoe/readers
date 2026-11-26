-- Friends: profiles (shared finished books) and friendships, all access through functions
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Reader',
  code text not null unique default substr(md5(gen_random_uuid()::text), 1, 8),
  shared jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  unique (requester, addressee),
  check (requester <> addressee)
);
create index friendships_addressee_idx on public.friendships (addressee);
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
create policy "own profile" on public.profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create function public.request_friend(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t public.profiles; f public.friendships;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into t from public.profiles where code = lower(trim(p_code));
  if not found then raise exception 'No reader found for that friend code'; end if;
  if t.user_id = auth.uid() then raise exception 'That is your own friend code'; end if;
  select * into f from public.friendships
    where (requester = auth.uid() and addressee = t.user_id) or (requester = t.user_id and addressee = auth.uid());
  if found then
    if f.status = 'pending' and f.addressee = auth.uid() then
      update public.friendships set status = 'accepted' where id = f.id;
      return jsonb_build_object('name', t.name, 'status', 'accepted');
    end if;
    return jsonb_build_object('name', t.name, 'status', f.status);
  end if;
  insert into public.friendships (requester, addressee) values (auth.uid(), t.user_id);
  return jsonb_build_object('name', t.name, 'status', 'pending');
end $$;

create function public.respond_friend(p_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if p_accept then
    update public.friendships set status = 'accepted' where id = p_id and addressee = auth.uid() and status = 'pending';
  else
    delete from public.friendships where id = p_id and addressee = auth.uid() and status = 'pending';
  end if;
end $$;

create function public.remove_friend(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  delete from public.friendships where id = p_id and (requester = auth.uid() or addressee = auth.uid());
end $$;

create function public.my_friends()
returns table (id uuid, other uuid, name text, status text, incoming boolean, shared jsonb)
language sql stable security definer set search_path = public as $$
  select f.id, p.user_id, p.name, f.status, (f.addressee = auth.uid()),
         case when f.status = 'accepted' then p.shared else '[]'::jsonb end
  from public.friendships f
  join public.profiles p on p.user_id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() is not null and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by f.created_at
$$;

revoke all on function public.request_friend(text), public.respond_friend(uuid, boolean), public.remove_friend(uuid), public.my_friends() from public, anon;
grant execute on function public.request_friend(text), public.respond_friend(uuid, boolean), public.remove_friend(uuid), public.my_friends() to authenticated;
