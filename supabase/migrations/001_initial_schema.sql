-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'driver')),
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trucks table
create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  license_plate text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Locations table
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('field', 'elevator', 'bin_site', 'processing', 'other')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Crop types table
create table public.crop_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true
);

-- Sessions table (one per driver shift)
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id),
  truck_id uuid not null references public.trucks(id),
  crop_type_id uuid references public.crop_types(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- Activity logs table (every button press)
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id),
  driver_id uuid not null references public.profiles(id),
  truck_id uuid not null references public.trucks(id),
  activity_type text not null check (activity_type in (
    'shift_start', 'arrived_at_field', 'loading', 'loaded_leaving',
    'arrived_at_destination', 'unloading', 'finished_unloading',
    'return_trip', 'shift_end'
  )),
  location_id uuid references public.locations(id),
  timestamp timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_activity_logs_session_time on public.activity_logs(session_id, timestamp);
create index idx_activity_logs_driver_time on public.activity_logs(driver_id, timestamp);
create index idx_activity_logs_timestamp on public.activity_logs(timestamp);
create index idx_sessions_driver_start on public.sessions(driver_id, started_at);

-- Auto-update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'driver')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.trucks enable row level security;
alter table public.locations enable row level security;
alter table public.crop_types enable row level security;
alter table public.sessions enable row level security;
alter table public.activity_logs enable row level security;

-- RLS Policies

-- Profiles: users can read own, admins can read/update all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Trucks: all authenticated can read, admins can manage
create policy "Authenticated users can view trucks"
  on public.trucks for select
  to authenticated
  using (true);

create policy "Admins can manage trucks"
  on public.trucks for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Locations: all authenticated can read, admins can manage
create policy "Authenticated users can view locations"
  on public.locations for select
  to authenticated
  using (true);

create policy "Admins can manage locations"
  on public.locations for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Crop types: all authenticated can read, admins can manage
create policy "Authenticated users can view crop types"
  on public.crop_types for select
  to authenticated
  using (true);

create policy "Admins can manage crop types"
  on public.crop_types for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Sessions: drivers can insert/read own, admins can read all
create policy "Drivers can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = driver_id);

create policy "Drivers can view own sessions"
  on public.sessions for select
  using (auth.uid() = driver_id);

create policy "Drivers can update own sessions"
  on public.sessions for update
  using (auth.uid() = driver_id);

create policy "Admins can view all sessions"
  on public.sessions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Activity logs: drivers can insert for own sessions, admins can read all
create policy "Drivers can insert own activity logs"
  on public.activity_logs for insert
  with check (auth.uid() = driver_id);

create policy "Drivers can view own activity logs"
  on public.activity_logs for select
  using (auth.uid() = driver_id);

create policy "Admins can view all activity logs"
  on public.activity_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
