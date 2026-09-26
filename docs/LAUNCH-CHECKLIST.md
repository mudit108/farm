# Mera Khet — go-live checklist

Work through this once, top to bottom, before announcing the season.

## 1. Settings to add in Vercel (Project → Settings → Environment Variables)

| Variable | Why |
|---|---|
| `CRON_SECRET` | Any long random string. Stops strangers triggering the daily jobs. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Bot check on signup, login and contact form (Cloudflare → Turnstile → Add site, free). |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Emails (receipts, reminders, alerts). Check they're set in Production. |
| `WHATSAPP_*` | WhatsApp messages. Template must be approved in Meta. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **Live** keys, not test keys. |
| `ADMIN_EMAILS` | Your admin login email(s). |

Then in **Supabase → Authentication → Attack Protection**: turn on CAPTCHA, choose Turnstile, paste the same Turnstile *secret* key. (Do this only after the site key is live on the website, or logins will fail.)

In **Razorpay → Webhooks**: URL `https://www.merakhet.in/api/webhooks/razorpay`, event `payment.captured`, same secret as `RAZORPAY_WEBHOOK_SECRET`.

## 2. One real payment test (with live keys)

Use your own phone number and email, Kothi plan.

1. Full payment → check: plots assigned, receipt email arrives, WhatsApp confirmation arrives, payment shows in Admin → Finance with a receipt link.
2. 50/50 payment → check: deposit receipt says "balance due", balance card on My Farm, pay the balance → second receipt arrives, balance disappears from Finance.
3. Close the browser right after paying once (webhook test) → plots and receipt should still appear within a minute.
4. Refund both test payments in Razorpay, then **Mark refunded** in Finance and **Free Up** the plots in Members.

## 3. Admin tidy-up

- [ ] Change the admin password (`admin123` is too easy to guess).
- [ ] Deactivate test discount codes (AKSHITA10, TAKKU1, FIRST100 if not real).
- [ ] Check Finance → Needs review (two old test payments).
- [ ] Decide referral amounts in Crops & Season → Referral Program, then switch it on.
- [ ] Legal pages: fill the `[City, State]`, grievance officer, refund days and "last updated" date, and have a lawyer review (incl. the SEBI collective-investment question).

## 4. Before sowing (5 Nov)

- [ ] Camera: stream the farm camera to an unlisted YouTube Live, paste the link in Admin → CCTV, set it **online**.
- [ ] Daily reminder job: open `https://www.merakhet.in/api/cron/member-reminders?dryRun=1` with the `Authorization: Bearer <CRON_SECRET>` header (or check Vercel → Cron Jobs logs) to see what would be sent.
