-- Real, persisted harvest fulfillment preference per member — replaces
-- what was previously just local UI state with no backing storage.
-- Supports splitting home-delivery or processed (flour) harvest into
-- monthly installments of a custom size, instead of one lump delivery.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_harvest_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  method text not null default 'home-delivery' check (method in ('home-delivery', 'processed', 'sell-to-market')),
  schedule text not null default 'one-time' check (schedule in ('one-time', 'monthly')),
  installment_kg int check (installment_kg is null or installment_kg > 0),
  updated_at timestamptz not null default now()
);

alter table public.khet_club_harvest_preferences enable row level security;

create policy "users manage own harvest preference" on public.khet_club_harvest_preferences
  for select to authenticated using (user_id = auth.uid());
create policy "users insert own harvest preference" on public.khet_club_harvest_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy "users update own harvest preference" on public.khet_club_harvest_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.khet_club_harvest_preferences to authenticated;
grant all on public.khet_club_harvest_preferences to service_role;

create or replace function public.khet_club_set_harvest_pref_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger khet_club_harvest_preferences_updated_at
  before update on public.khet_club_harvest_preferences
  for each row execute function public.khet_club_set_harvest_pref_updated_at();
