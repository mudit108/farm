-- WhatsApp message log — admin-initiated (individual + broadcast) and
-- automated (plot confirmation, farm update broadcast). Admin-only
-- feature: no customer-facing UI reads this, so RLS just locks it to
-- service_role entirely (no anon/authenticated policies at all).
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  phone text not null,
  message text not null,
  kind text not null default 'individual' check (kind in ('individual', 'broadcast', 'automated')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.khet_club_whatsapp_messages enable row level security;
grant all on public.khet_club_whatsapp_messages to service_role;

create index khet_club_whatsapp_messages_created_at_idx
  on public.khet_club_whatsapp_messages(created_at desc);
