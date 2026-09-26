-- Applied live on 2026-09-26 as: referral_program, reminder_log,
-- member_delivery_payout_details, my_camera_with_stream. Idempotent.

-- Referral program -------------------------------------------------------
create table if not exists public.khet_club_referral_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  friend_discount_inr integer not null default 1000 check (friend_discount_inr >= 0),
  referrer_reward_inr integer not null default 1000 check (referrer_reward_inr >= 0),
  updated_at timestamptz not null default now()
);
insert into public.khet_club_referral_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.khet_club_referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.khet_club_referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referee_user_id uuid not null unique references auth.users(id) on delete cascade,
  payment_id uuid not null references public.khet_club_payments(id) on delete cascade,
  reward_inr integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  paid_note text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.khet_club_payments
  add column if not exists referrer_user_id uuid references auth.users(id),
  add column if not exists referral_discount_inr integer not null default 0;

alter table public.khet_club_referral_settings enable row level security;
alter table public.khet_club_referral_codes enable row level security;
alter table public.khet_club_referral_rewards enable row level security;
drop policy if exists "anyone reads referral settings" on public.khet_club_referral_settings;
create policy "anyone reads referral settings" on public.khet_club_referral_settings
  for select to anon, authenticated using (true);
drop policy if exists "members read own referral code" on public.khet_club_referral_codes;
create policy "members read own referral code" on public.khet_club_referral_codes
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "members read own referral rewards" on public.khet_club_referral_rewards;
create policy "members read own referral rewards" on public.khet_club_referral_rewards
  for select to authenticated using (referrer_user_id = auth.uid());
grant select on public.khet_club_referral_settings to anon, authenticated;
grant select on public.khet_club_referral_codes to authenticated;
grant select on public.khet_club_referral_rewards to authenticated;
grant all on public.khet_club_referral_settings, public.khet_club_referral_codes, public.khet_club_referral_rewards to service_role;

-- Automated reminder log ---------------------------------------------------
create table if not exists public.khet_club_reminder_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  ref_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  email_sent boolean not null default false,
  whatsapp_sent boolean not null default false,
  sent_at timestamptz not null default now(),
  unique (kind, ref_id)
);
alter table public.khet_club_reminder_log enable row level security;
revoke all on public.khet_club_reminder_log from anon, authenticated;
grant all on public.khet_club_reminder_log to service_role;

-- Member delivery preferences + payout details -----------------------------
create table if not exists public.khet_club_member_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  delivery_time_pref text check (delivery_time_pref in ('any', 'morning', 'afternoon', 'evening')),
  delivery_days_note text,
  delivery_instructions text,
  payout_upi text,
  payout_account_name text,
  payout_account_number text,
  payout_ifsc text,
  updated_at timestamptz not null default now()
);
alter table public.khet_club_member_details enable row level security;
drop policy if exists "members read own details" on public.khet_club_member_details;
create policy "members read own details" on public.khet_club_member_details
  for select to authenticated using (user_id = auth.uid());
grant select on public.khet_club_member_details to authenticated;
revoke insert, update, delete on public.khet_club_member_details from authenticated, anon;
grant all on public.khet_club_member_details to service_role;

-- Member camera now returns the stream link, with a farm-wide fallback ------
drop function if exists public.khet_club_my_camera();
create function public.khet_club_my_camera()
returns table(camera_name text, status text, stream_url text)
language sql
security definer
stable
set search_path = public
as $$
  select name, status, stream_url from (
    select c.name, c.status, c.stream_url, 0 as rank
    from public.khet_club_cameras c
    join public.khet_club_plots p on p.plot_number = c.plot_number
    where p.user_id = auth.uid()
    union all
    select c.name, c.status, c.stream_url, 1 as rank
    from public.khet_club_cameras c
    where c.plot_number is null and c.status = 'online'
      and exists (select 1 from public.khet_club_plots p where p.user_id = auth.uid())
  ) x
  order by rank
  limit 1;
$$;
revoke all on function public.khet_club_my_camera() from public;
revoke execute on function public.khet_club_my_camera() from anon;
grant execute on function public.khet_club_my_camera() to authenticated;
