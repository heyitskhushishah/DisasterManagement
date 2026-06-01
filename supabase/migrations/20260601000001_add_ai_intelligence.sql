-- AI-powered risk analysis results per authenticated user
create table public.ai_intelligence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  disaster_type text,
  severity integer,
  population_affected integer,

  flood_risk integer not null,
  hospital_overload_risk integer not null,
  infrastructure_damage_risk integer not null,
  response_delay_risk integer not null,

  weather_snapshot jsonb,
  facilities_summary jsonb,

  created_at timestamptz not null default now()
);

create index ai_intelligence_user_id_idx on public.ai_intelligence (user_id);
create index ai_intelligence_created_at_idx on public.ai_intelligence (created_at desc);

comment on table public.ai_intelligence is 'AI-generated risk analysis results for disaster response planning';

alter table public.ai_intelligence enable row level security;

create policy "Users can view their own AI intelligence"
on public.ai_intelligence
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own AI intelligence"
on public.ai_intelligence
for insert
to authenticated
with check (auth.uid() = user_id);
