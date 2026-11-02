-- Bugs, Feedback und Feature-Wünsche der Mitglieder.
-- Mitglieder dürfen nur schreiben. Lesen geht über das Supabase-Dashboard (Table Editor).

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('bug', 'feedback', 'feature')),
  text text not null check (char_length(text) between 1 and 2000),
  page text,
  user_agent text,
  created_at timestamptz not null default now()
);

grant insert on public.feedback to authenticated;
alter table public.feedback enable row level security;

create policy "Mitglieder senden Feedback"
  on public.feedback for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.is_member());
