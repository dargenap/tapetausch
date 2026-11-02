create table public.comments (
  id uuid primary key default gen_random_uuid(),
  pick_id uuid not null references public.picks (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_pick_idx on public.comments (pick_id, created_at);

grant select, insert, delete on public.comments to authenticated;
alter table public.comments enable row level security;

create policy "Mitglieder lesen Kommentare"
  on public.comments for select
  to authenticated
  using (public.is_member());

create policy "Mitglieder kommentieren"
  on public.comments for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.is_member());

create policy "Eigene Kommentare löschen"
  on public.comments for delete
  to authenticated
  using (user_id = (select auth.uid()));
