create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create unique index profiles_username_key
  on public.profiles (lower(username));


create table public.invite_settings (
  id boolean primary key default true check (id),
  code text not null
);

insert into public.invite_settings (code) values ('r65Z8u22yhXgfyz3');

alter table public.invite_settings enable row level security;


create or replace function public.check_invite(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.invite_settings where code = p_code
  );
$$;


create or replace function public.create_profile(p_username text, p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'already_registered';
  end if;
  if not public.check_invite(p_code) then
    raise exception 'invalid_invite';
  end if;

  insert into public.profiles (id, username) values (auth.uid(), p_username);
exception
  when unique_violation then
    raise exception 'username_taken';
end;
$$;

revoke execute on function public.create_profile(text, text) from public, anon;
grant execute on function public.create_profile(text, text) to authenticated;


create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid())
  );
$$;


alter table public.profiles enable row level security;

create policy "Mitglieder lesen Profile"
  on public.profiles for select
  to authenticated
  using (public.is_member());

grant select on public.profiles to authenticated;
