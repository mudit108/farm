-- Admin replies to member support messages, shown in the member dashboard.
-- Applied live as support_message_replies.
alter table public.khet_club_support_messages
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz;
