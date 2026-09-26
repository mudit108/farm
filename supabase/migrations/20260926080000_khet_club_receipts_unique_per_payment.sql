-- One receipt per payment, so the browser callback and the Razorpay webhook
-- can both try to issue it without creating a duplicate.
-- Applied live as receipts_unique_per_payment.
create unique index if not exists khet_club_receipts_payment_id_key on public.khet_club_receipts (payment_id);
