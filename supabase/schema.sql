create table if not exists public.cube_club_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
    created_at timestamptz not null default now()
);

create unique index if not exists cube_club_profiles_username_case_insensitive_unique
    on public.cube_club_profiles (lower(username));

alter table public.cube_club_profiles enable row level security;

drop policy if exists "Cube Club users can read their own profile" on public.cube_club_profiles;
create policy "Cube Club users can read their own profile"
    on public.cube_club_profiles
    for select
    to authenticated
    using ((select auth.uid()) = id);

grant select on table public.cube_club_profiles to authenticated;

create or replace function public.cube_club_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    requested_username text;
begin
    requested_username := new.raw_user_meta_data ->> 'cube_club_username';
    if requested_username is null then
        return new;
    end if;
    insert into public.cube_club_profiles (id, username)
    values (new.id, requested_username);
    return new;
end;
$$;

drop trigger if exists cube_club_on_auth_user_created on auth.users;
create trigger cube_club_on_auth_user_created
    after insert on auth.users
    for each row execute function public.cube_club_handle_new_user();

create table if not exists public.cube_club_progress (
    user_id uuid primary key references auth.users (id) on delete cascade,
    learning_statuses jsonb not null default '{}'::jsonb check (jsonb_typeof(learning_statuses) = 'object'),
    custom_algorithms jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_algorithms) = 'object'),
    updated_at timestamptz not null default now()
);

alter table public.cube_club_progress enable row level security;

drop policy if exists "Cube Club users can read their own progress" on public.cube_club_progress;
create policy "Cube Club users can read their own progress"
    on public.cube_club_progress
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Cube Club users can insert their own progress" on public.cube_club_progress;
create policy "Cube Club users can insert their own progress"
    on public.cube_club_progress
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Cube Club users can update their own progress" on public.cube_club_progress;
create policy "Cube Club users can update their own progress"
    on public.cube_club_progress
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.cube_club_progress to authenticated;
