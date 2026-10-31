-- Travel OC · Supabase schema (for when persistence moves off localStorage)
-- Run in the Supabase SQL editor. Uses auth.uid() as the owner for RLS.

create table if not exists public.ocs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  original_image_url text not null,
  styled_image_url text,
  active_style text not null default 'original' check (active_style in ('original', 'cartoon')),
  description text,
  palette text[],
  personality jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  oc_id uuid not null references public.ocs (id) on delete cascade,
  oc_name text,
  started_at timestamptz not null,
  expected_end_at timestamptz not null,
  completed_at timestamptz,
  duration_minutes int not null check (duration_minutes between 1 and 180),
  actual_duration_minutes int,
  food text not null,
  status text not null check (status in ('traveling', 'completed', 'interrupted')),
  paused_at timestamptz,
  paused_total_ms bigint not null default 0,
  destination jsonb,
  diary text,
  souvenir jsonb,
  travel_image_url text,
  travel_image_includes_oc boolean,
  image_prompt text,
  conditions jsonb,
  composition jsonb,
  events jsonb,
  seed text not null,
  saved_to_album boolean not null default false
);

create index if not exists journeys_owner_started_idx on public.journeys (owner_id, started_at desc);

alter table public.ocs enable row level security;
alter table public.journeys enable row level security;

create policy "own ocs" on public.ocs for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own journeys" on public.journeys for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Storage buckets: oc-images, travel-photos (private; serve via signed URLs)
insert into storage.buckets (id, name, public) values ('oc-images', 'oc-images', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('travel-photos', 'travel-photos', false) on conflict do nothing;
