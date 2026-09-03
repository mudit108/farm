-- Atomic certificate numbering via the sequence created alongside the
-- certificates table — avoids a "read last number, add 1" race between
-- two concurrent approvals. service_role only.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create or replace function public.khet_club_next_certificate_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'MK-' || extract(year from now())::int || '-' || lpad(nextval('khet_club_certificate_seq')::text, 4, '0');
$$;

revoke all on function public.khet_club_next_certificate_number() from public;
revoke execute on function public.khet_club_next_certificate_number() from anon, authenticated;
grant execute on function public.khet_club_next_certificate_number() to service_role;
