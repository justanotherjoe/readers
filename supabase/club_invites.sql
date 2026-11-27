-- Club invites sent to friends (applied as migration club_invites)
create table public.club_invites (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  from_name text not null default 'A friend',
  club_name text not null check (length(club_name) <= 120),
  book_title text not null default '' check (length(book_title) <= 200),
  code text not null check (code ~ '^[a-z0-9]{4,12}$'),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index club_invites_to_idx on public.club_invites (to_user);
create unique index club_invites_once on public.club_invites (from_user, to_user, code);
alter table public.club_invites enable row level security;
create policy "invite friends" on public.club_invites for insert to authenticated with check (from_user = (select auth.uid()) and public.are_friends(from_user, to_user));
create policy "see mine" on public.club_invites for select to authenticated using (to_user = (select auth.uid()) or from_user = (select auth.uid()));
create policy "delete mine" on public.club_invites for delete to authenticated using (to_user = (select auth.uid()) or from_user = (select auth.uid()));
