create table public.picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null
    default (date_trunc('week', now() at time zone 'Europe/Berlin'))::date,
  itunes_track_id bigint not null,
  title text not null,
  artist text not null,
  artwork_url text,
  track_url text,
  note text check (char_length(note) <= 1000),
  photo_path text,
  created_at timestamptz not null default now()
);

create unique index picks_one_per_week on public.picks (user_id, week_start);


create table public.ratings (
  pick_id uuid not null references public.picks (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  quality integer not null check (quality between 1 and 10),
  emotion integer not null check (emotion between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (pick_id, user_id)
);


create or replace function public.has_rated(p_pick_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ratings
    where pick_id = p_pick_id and user_id = (select auth.uid())
  );
$$;


create or replace function public.create_pick(
  p_itunes_track_id bigint,
  p_title text,
  p_artist text,
  p_artwork_url text,
  p_track_url text,
  p_note text,
  p_photo_path text,
  p_quality integer,
  p_emotion integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pick_id uuid;
begin
  if not public.is_member() then
    raise exception 'not_member';
  end if;

  insert into public.picks
    (user_id, itunes_track_id, title, artist, artwork_url, track_url, note, photo_path)
  values
    (auth.uid(), p_itunes_track_id, p_title, p_artist, p_artwork_url, p_track_url, p_note, p_photo_path)
  returning id into v_pick_id;

  insert into public.ratings (pick_id, user_id, quality, emotion)
  values (v_pick_id, auth.uid(), p_quality, p_emotion);

  return v_pick_id;
exception
  when unique_violation then
    raise exception 'already_picked_this_week';
end;
$$;


revoke execute on function public.create_pick(bigint, text, text, text, text, text, text, integer, integer) from public, anon;
grant execute on function public.create_pick(bigint, text, text, text, text, text, text, integer, integer) to authenticated;


grant select, delete on public.picks to authenticated;
alter table public.picks enable row level security;

create policy "Mitglieder lesen Picks"
  on public.picks for select
  to authenticated
  using (public.is_member());

create policy "Eigene Picks löschen"
  on public.picks for delete
  to authenticated
  using (user_id = (select auth.uid()));


grant select, insert on public.ratings to authenticated;
alter table public.ratings enable row level security;

create policy "Wertungen lesen nach eigener Wertung"
  on public.ratings for select
  to authenticated
  using (user_id = (select auth.uid()) or public.has_rated(pick_id));

create policy "Eigene Wertung abgeben"
  on public.ratings for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.is_member());