-- The homepage "Talk to us" contact form was previously fake (client-side
-- only, never sent anywhere). This gives it a real backend. Unlike every
-- other table in this app, the submitter is NOT logged in — so this is
-- the first table that needs an INSERT policy for `anon`, not just
-- `authenticated`. Following the privilege-hardening lesson: the grant
-- is scoped to exactly the columns a visitor should set, nothing else.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

alter table public.khet_club_contact_messages enable row level security;

create policy "anyone can submit a contact message" on public.khet_club_contact_messages
  for insert to anon, authenticated with check (true);

revoke all on public.khet_club_contact_messages from anon, authenticated;
grant insert (name, phone, email, message) on public.khet_club_contact_messages to anon, authenticated;
grant all on public.khet_club_contact_messages to service_role;
