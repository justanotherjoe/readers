-- Readers: run this once in Supabase (SQL Editor, New query, paste, Run).

-- Each person's library, ratings and notes, saved as one document.
create table public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 60),
  book_title text not null,
  book_author text not null,
  pages int not null default 0,
  chapters jsonb not null,
  sched jsonb not null default '[]',
  code text not null unique default substr(md5(random()::text || clock_timestamp()::text), 1, 6),
  owner uuid not null default auth.uid() references auth.users,
  created_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  ch int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  ch int not null check (ch >= 1),
  text text not null check (char_length(text) <= 400),
  created_at timestamptz not null default now()
);
create index on public.club_posts (club_id, ch);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  text text not null check (char_length(text) <= 2000),
  page text,
  created_at timestamptz not null default now()
);

-- Helpers (security definer avoids recursive row level security checks)
create function public.is_member(cid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.club_members where club_id = cid and user_id = auth.uid())
$$;

create function public.my_ch(cid uuid) returns int
language sql security definer set search_path = public stable as $$
  select coalesce((select ch from public.club_members where club_id = cid and user_id = auth.uid()), -1)
$$;

-- Join a club with its invite code
create function public.join_club(p_code text, p_name text) returns public.clubs
language plpgsql security definer set search_path = public as $$
declare c public.clubs;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into c from public.clubs where code = lower(trim(p_code));
  if not found then raise exception 'No club found for that code'; end if;
  insert into public.club_members (club_id, user_id, name, ch)
  values (c.id, auth.uid(), coalesce(nullif(trim(p_name), ''), 'Reader'), 0)
  on conflict do nothing;
  return c;
end $$;
revoke all on function public.join_club(text, text) from public, anon;
grant execute on function public.join_club(text, text) to authenticated;

-- Row level security: everyone only sees what belongs to them or their clubs
alter table public.user_data enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_posts enable row level security;
alter table public.feedback enable row level security;

create policy "own data" on public.user_data for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "see my clubs" on public.clubs for select to authenticated
  using (public.is_member(id) or owner = auth.uid());
create policy "create club" on public.clubs for insert to authenticated
  with check (owner = auth.uid());
create policy "owner edits club" on public.clubs for update to authenticated
  using (owner = auth.uid()) with check (true);
create policy "owner deletes club" on public.clubs for delete to authenticated
  using (owner = auth.uid());

create policy "see club members" on public.club_members for select to authenticated
  using (public.is_member(club_id));
create policy "owner adds self" on public.club_members for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.clubs where id = club_id and owner = auth.uid()));
create policy "update my progress" on public.club_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "leave club" on public.club_members for delete to authenticated
  using (user_id = auth.uid());

-- Spoiler protection is enforced here: you can only read chapters you have finished (plus your own posts)
create policy "read unlocked posts" on public.club_posts for select to authenticated
  using (public.is_member(club_id) and (user_id = auth.uid() or ch <= public.my_ch(club_id)));
create policy "post in unlocked chapter" on public.club_posts for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(club_id) and ch <= public.my_ch(club_id));
create policy "delete my posts" on public.club_posts for delete to authenticated
  using (user_id = auth.uid());

create policy "send feedback" on public.feedback for insert to authenticated
  with check (user_id = auth.uid());
