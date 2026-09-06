-- Payment receipts are generated immediately when a payment is
-- verified and plots are claimed — unlike certificates, which stay
-- gated behind admin approval. A receipt is proof of payment; a
-- certificate is a reviewed, formal allocation document. Different
-- purposes, different timing, deliberately.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create sequence if not exists khet_club_receipt_seq start 1;

create table public.khet_club_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_id uuid not null references public.khet_club_payments(id),
  claim_batch_id uuid not null unique,
  plan_id text not null,
  plot_numbers int[] not null,
  full_name text not null,
  amount_paise int not null,
  feeding_families_inr int not null default 0,
  issued_at timestamptz not null default now(),
  email_sent boolean not null default false
);

alter table public.khet_club_receipts enable row level security;

create policy "users read own receipts" on public.khet_club_receipts
  for select to authenticated using (user_id = auth.uid());

-- Insert-only via service_role (the payment verification action) —
-- verified via live exploit attempt before shipping. Also verified
-- live that RLS correctly isolates receipts per-owner.
revoke all on public.khet_club_receipts from anon, authenticated;
grant select on public.khet_club_receipts to authenticated;
grant all on public.khet_club_receipts to service_role;

-- Atomic numbering, same pattern as khet_club_next_certificate_number().
create or replace function public.khet_club_next_receipt_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'RCT-' || extract(year from now())::int || '-' || lpad(nextval('khet_club_receipt_seq')::text, 4, '0');
$$;

revoke all on function public.khet_club_next_receipt_number() from public;
revoke execute on function public.khet_club_next_receipt_number() from anon, authenticated;
grant execute on function public.khet_club_next_receipt_number() to service_role;
