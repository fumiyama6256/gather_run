-- Enable PostGIS extension for geographic data
create extension if not exists postgis;

-- Runs table
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  location geography(point, 4326) not null,
  location_name text,
  datetime timestamp with time zone not null,
  description text not null,
  note text,
  thanks_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Create spatial index for fast location queries
create index idx_runs_location on public.runs using gist (location);

-- Create index for datetime queries
create index idx_runs_datetime on public.runs (datetime);

-- Function to find nearby runs
create or replace function public.nearby_runs(
  lat double precision,
  lng double precision,
  radius_km integer default 5
)
returns setof public.runs
language sql
stable
as $$
  select *
  from public.runs
  where st_dwithin(
    location,
    st_makepoint(lng, lat)::geography,
    radius_km * 1000
  )
  and datetime > now()
  order by datetime;
$$;

-- Enable Row Level Security (RLS)
alter table public.runs enable row level security;

-- Policy: Anyone can read runs
create policy "Anyone can view runs"
  on public.runs
  for select
  using (true);

-- Policy: Anyone can insert runs (anonymous posting)
create policy "Anyone can create runs"
  on public.runs
  for insert
  with check (true);

-- Policy: Anyone can update thanks_count
create policy "Anyone can update runs"
  on public.runs
  for update
  using (true)
  with check (true);
