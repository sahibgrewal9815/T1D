-- T1DTMD database. Paste ALL of this into Supabase → SQL Editor → Run.

create table if not exists public.profiles (
  id text primary key,                 -- user ID, e.g. gurpreet
  name text not null,
  dob date,
  mobile text,
  address text,
  fee numeric,
  active boolean default true,
  paid_until date,
  created_at date default current_date
);

create table if not exists public.app_state (
  id text primary key references public.profiles(id) on delete cascade,
  data jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.payments (
  pid bigint generated always as identity primary key,
  id text references public.profiles(id) on delete cascade,
  date date,
  amount numeric,
  months int,
  method text,
  note text
);

create table if not exists public.config (
  k int primary key default 1,
  data jsonb
);
insert into public.config (k, data) values (1, '{"fee":199,"grace":7,"upi":"","payee":""}')
on conflict (k) do nothing;

-- who is logged in?
create or replace function public.my_id() returns text
language sql stable as $$ select split_part(coalesce(auth.jwt()->>'email',''), '@', 1) $$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select coalesce(auth.jwt()->>'email','') = 'admin@t1dtmd.app' $$;

-- lock everything down
alter table public.profiles  enable row level security;
alter table public.app_state enable row level security;
alter table public.payments  enable row level security;
alter table public.config    enable row level security;

drop policy if exists p_read  on public.profiles;
drop policy if exists p_admin on public.profiles;
create policy p_read  on public.profiles for select to authenticated using (public.is_admin() or id = public.my_id());
create policy p_admin on public.profiles for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists s_own on public.app_state;
create policy s_own on public.app_state for all to authenticated
  using (public.is_admin() or id = public.my_id()) with check (public.is_admin() or id = public.my_id());

drop policy if exists pay_read  on public.payments;
drop policy if exists pay_admin on public.payments;
create policy pay_read  on public.payments for select to authenticated using (public.is_admin() or id = public.my_id());
create policy pay_admin on public.payments for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists c_read  on public.config;
drop policy if exists c_admin on public.config;
create policy c_read  on public.config for select to authenticated using (true);
create policy c_admin on public.config for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- lets the admin set a new password for a user from the dashboard
create or replace function public.admin_set_password(p_id text, p_password text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if length(p_password) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where email = lower(p_id) || '@t1dtmd.app';
  if not found then raise exception 'No login found for %', p_id; end if;
end $$;
revoke all on function public.admin_set_password(text, text) from public, anon;
grant execute on function public.admin_set_password(text, text) to authenticated;
