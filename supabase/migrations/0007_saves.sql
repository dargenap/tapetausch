create table public.saves (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  pick_id uuid not null references public.picks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pick_id)
);

create index saves_pick_idx on public.saves (pick_id);

grant select, insert, delete on public.saves to authenticated;
alter table public.saves enable row level security;

create policy "Mitglieder sehen Speicherungen"
  on public.saves for select
  to authenticated
  using (public.is_member());

create policy "Fremde Picks speichern"
  on public.saves for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_member()
    and not exists (
      select 1 from public.picks p
      where p.id = saves.pick_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "Eigene Speicherungen entfernen"
  on public.saves for delete
  to authenticated
  using (user_id = (select auth.uid()));