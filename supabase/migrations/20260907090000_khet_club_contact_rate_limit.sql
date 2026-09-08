-- Rate limiting the contact form needs to identify repeat submitters,
-- and there's no login to key off since it's anonymous — so the
-- submitting IP is recorded. Nullable: if IP can't be determined for
-- some reason, the message still saves rather than being blocked.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_contact_messages
  add column if not exists ip_address text;
