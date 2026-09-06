# Mera Khet

A farm-membership platform in Sujangarh, Rajasthan — organic wheat plots,
seasonal crop tracking, 24×7 CCTV farm monitoring, and a live, account-gated
plot registration system (admin-configurable farm size, no fixed cap).
Built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase
(Postgres + Auth).

## Before accepting real customers

The legal pages (`/terms`, `/privacy`, `/membership-agreement`,
`/refund-policy`, `/disclaimer`) are solid drafts covering what a careful
customer would look for, but they are **not ready to rely on as-is**:

1. The business legal name (**MK Farms**) and the confirmed
   cancellation policy (**50% refund if canceled more than 14 days
   before sowing; non-refundable within 14 days of sowing or after
   sowing begins**) are filled in. What's still a `[bracketed
   placeholder]`: registered address, jurisdiction (for the governing-law
   clauses), and — separately from the cancellation policy above — any
   compensation policy for actual crop failure (Membership Agreement,
   Section 8).
2. Have an actual lawyer review all five before they're relied on as
   binding documents — I drafted these to be genuinely useful and
   accurate to how the product works, but I'm not a lawyer and this
   isn't a substitute for real legal review, especially since real
   payments are involved.
3. Public contact email/phone are admin-editable at `/admin/crops` →
   "Public Contact Info" (stored on `khet_club_season`, not env
   vars) — change them there any time without a redeploy. Until
   they're set, the footer shows "use the contact form" instead of a
   fake placeholder, and the WhatsApp button hides itself rather than
   being a dead click.

## What's live — the whole app runs on real data now

Every page under `/dashboard/*` and `/admin/*`, plus the homepage's public
sections, read and write real Supabase tables. `lib/demo-data.ts` still
exists, but now only holds genuine static site content — the current
crop's name/stages, the three plan sizes and their prices, harvest
fulfillment options, and FAQ copy — not per-user or per-farm state.

- **Plot registration & plans**: sign up (`/auth/signup`) → confirm email
  → log in (`/auth/login`) → pick a plan (1/3/6 plots) at
  `/dashboard/select-plot` → **pay via Razorpay** → plots are assigned the
  moment payment is verified server-side (never on selection alone).
  Customers can buy **more than one plan** — upgrade or stack additional
  plots — any time up to the admin-set registration deadline
  (`/admin/crops`); each purchase is atomic (`FOR UPDATE SKIP LOCKED`),
  runs as the authenticated user via RLS, and auto-refunds if a payment
  succeeds but the claim itself somehow fails (deadline just passed,
  plots just sold out, etc). Confirmation email via Resend. Real payment
  history at `/dashboard/membership`.
- **Season state**: current crop stage, progress %, health, sowing date,
  and estimated harvest are a real, singleton row (`khet_club_season`),
  editable from `/admin/crops` and shown live on Overview, Crop Cycle, and
  the homepage dashboard preview.
- **Farm updates**: published from `/admin/updates`, shown on the
  homepage, `/dashboard/updates`, and Overview's "Latest Update" — and
  broadcast to every current-season member on WhatsApp automatically.
- **Harvest preference**: `khet_club_harvest_preferences` — real, saved
  per member (`/dashboard/membership`), not just local UI state. Choose
  home delivery, processing into flour/oil, or market sale — and for
  either delivery option, split it into monthly installments of a custom
  size (e.g. 40 kg/month) instead of one lump delivery. Visible to admins
  per-customer at `/admin/customers` for logistics planning. **The first
  save is direct; any change after that goes through an admin-approved
  request** (`khet_club_harvest_preference_requests`, reviewed at
  `/admin/harvest`) — enforced by the database itself (the preference
  table's primary key rejects a second direct save), not just hidden in
  the UI.
- **Choose your own plots**: `/dashboard/select-plot` — a customer can
  either auto-assign (next available, unchanged default) or pick exactly
  where their plan's plots start on the live plot grid. The chosen
  range must be contiguous and fully available — re-validated
  server-side with real row locks at claim time, not just trusted from
  the UI. Members can also set an optional nickname for their plot(s)
  (e.g. "Sharma Family Farm"), shown on `/dashboard/my-farm` and
  `/dashboard/select-plot`.
- **Configurable farm size**: the farm no longer has a hardcoded 80-plot
  cap — `/admin/crops` has a "Farm Size" control that grows or shrinks
  the total any time (`khet_club_resize_farm`), and every page that shows
  a plot count or grid (homepage, select-plot, admin registrations/cctv)
  reflects it automatically, since they all read the actual row count
  rather than a fixed number. Growing just adds new available plots;
  shrinking is refused by the database itself if any plot above the new
  total is already claimed, rather than silently deleting a real
  member's plot.
- **Admin-editable plan pricing**: prices for all 3 plans are set at
  `/admin/crops` → "Plan Pricing" (`khet_club_plan_prices`), not hardcoded.
  This is the actual price charged at checkout, not just a display
  number — `createPlanOrder` reads it live at payment time. The 3-plot
  and 6-plot plans now also show their real savings versus the 1-plot
  per-plot rate (₹10,000 / ₹20,000 at current prices) on both the
  homepage and the dashboard purchase flow — computed live from
  whatever the admin has actually set, not a fixed claim.
- **Feeding Families Fund**: ₹1,000 per plot is earmarked from each
  plan's existing price (not an add-on charge) toward donating wheat to
  families in need — shown on the homepage pricing cards, the checkout
  breakdown, the Membership Agreement, and a FAQ entry. The running
  total is computed live from real paid transactions, not tracked
  separately, so it can never drift out of sync with actual payments —
  visible on both `/admin` (quick stat) and the full `/admin/income`
  breakdown below.
- **Admin Finance page** (`/admin/income` — URL kept for continuity):
  now two tabs, Income and Expenses. Income covers every payment — paid,
  pending, failed, refunded — with summary stats and a filterable
  transaction table. "Pending" means a Razorpay order was created but
  the customer never completed checkout — no plot was ever assigned for
  these, so they're informational, not a liability. Expenses has no
  automatic data source the way income does (it's not connected to
  anything like Razorpay) — admin logs real costs manually
  (`khet_club_expenses`, 9 categories including a dedicated "Feeding
  Families Donation" one to track actual spend against the fund),
  purely internal data with zero anon/authenticated access at any
  level, verified via live exploit attempt before shipping. Both tabs
  share a live Net Position card (income minus expenses).
- **Real contact form + legal pages**: the homepage "Talk to us" form used
  to be entirely fake (client-side only, never sent anywhere) — it now
  saves to `khet_club_contact_messages` and emails every address in
  `ADMIN_EMAILS`, with a new "Contact Messages" tab at
  `/admin/communications` to view and mark them replied. Every footer
  link now goes somewhere real, including five new legal pages — Terms,
  Privacy, Membership Agreement, Refund & Cancellation, Disclaimer — all
  clearly marked as drafts pending real legal review and business-specific
  details (see "Before accepting real customers" below). "Own Your Farm"
  language was also removed site-wide (hero, nav, pricing, signup, even
  the SEO title tags) since it directly contradicted the site's own legal
  section, which explicitly says membership does *not* transfer land
  ownership — replaced with "Reserve"/"Choose" throughout.
- **Harvest delivery tracking**: `/admin/harvest` — once harvest is
  weighed, admin sets a member's real confirmed total (kg) — separate
  from the pre-harvest wheatMinKg/wheatMaxKg estimate — then logs each
  delivery against it. Every recorded delivery sends the member a
  WhatsApp update with their running progress. Members see their own
  progress bar and delivery history at `/dashboard/membership`.
- **Live weather**: `/dashboard/crop-cycle` shows real current conditions
  and a 5-day outlook for the farm's actual coordinates (Sujangarh, Churu
  district, Rajasthan — 27.70°N, 74.47°E), via Open-Meteo
  (`lib/weather.ts`). No API key needed — genuinely zero-config. Cached
  30 minutes; shows an honest "unavailable" message rather than fake
  numbers if the request fails. Running on Open-Meteo's free
  non-commercial tier for now — see "Configure weather" below for when
  to revisit that.
- **Membership certificates**: payment still assigns plots immediately
  (unchanged, proven flow) — but the official certificate is gated
  behind explicit admin approval at `/admin/registrations`. Approving a
  batch generates a designed PDF (`lib/certificate.tsx`), records it in
  `khet_club_certificates` with an atomically-numbered ID (`MK-2026-0001`,
  etc.), and sends it as an email attachment (Resend) and a WhatsApp
  document (Meta Cloud API — **needs a second, separate approved
  template with a Document header**, distinct from the plain-text update
  template; see "Configure WhatsApp certificates" below). Members can
  also download their own certificate any time from `/dashboard/my-farm`,
  and admin can re-send from `/admin/registrations` if a send failed.
  Single page (A4 landscape); a random English or Hindi tagline (from 30
  built in) appears above the signature lines each time, alongside a
  fixed "Mera Khet — Growing a connection between people and the soil."
  brand line. Hindi renders in a bundled Noto Sans Devanagari font
  (`lib/fonts/`, OFL-licensed, license text included) — the PDF standard
  Helvetica font used everywhere else can't render Devanagari at all.
- **WhatsApp**: `/admin/whatsapp` — broadcast to every current-season
  member or message an individual, both real (Meta WhatsApp Cloud API).
  Plot confirmations and every published farm update also go out on
  WhatsApp automatically. Every send is logged with its outcome.
- **Farm visits**: customers submit real requests from
  `/dashboard/farm-visit`; admins approve/decline/complete them from
  `/admin/visits`.
- **Support messages**: customers submit from `/dashboard/support`,
  stored for admin follow-up (no admin inbox UI yet — see "Add a backend").
- **Cameras**: admin manages real camera records (name, assigned plot,
  status) from `/admin/cctv`. Customers see their own camera's name/status
  via a function that never exposes the stream URL. Actual video streaming
  infrastructure still isn't connected — that page is honest about it.
- **Documents**: admin attaches document links (customer-specific or
  shared) from `/admin/customers`; customers see them at
  `/dashboard/documents`. This is link-based, not a file upload system.
- **Profile**: customers edit their real name/phone
  (`supabase.auth.updateUser`).
- **Admin**: `/admin/registrations` (plots), `/admin/customers` (real
  user list + documents), `/admin/whatsapp`, `/admin/cctv`, `/admin/crops`
  (season), `/admin/updates`, `/admin/visits` — all real. The old
  `/admin/farms` page (a leftover 30-unit sq-ft grid from before the
  80-plot system existed) has been removed as redundant.

**What's still not wired up**: actual video streaming (camera *status* is
real, the video feed isn't), and an admin inbox for support messages
(they're stored, just not yet surfaced in `/admin`). Payments and
WhatsApp are both fully implemented — they just need your own Razorpay
and Meta credentials to actually process money / send messages; see
"Configure payments" and "Configure WhatsApp" below.

## ⚠️ A security issue was found and fixed here — worth reading

While building the "choose your own plot" feature, direct testing caught
something that had been silently true since the very first migration:
**Supabase grants broad INSERT/UPDATE privileges to `anon` and
`authenticated` by default on every new table**, the same auto-grant
behavior already discovered and fixed for *functions* early in this
project — but never checked for *tables* until now. It had been harmless
everywhere RLS had no policy for a given operation (default-deny
regardless of the underlying grant), which is exactly why it went
unnoticed for so long — right up until the plot-nickname UPDATE policy
was added, at which point a plot owner could have set `status`,
`plan_id`, or any other column on their own row, not just the intended
`custom_name`. Verified exploitable, then verified fixed, via direct SQL
testing against the live database (see
`supabase/migrations/20260902173500_khet_club_privilege_hardening.sql`
for the full fix and a precise account of what was affected).

**The practical upshot**: if you fork this schema or add your own tables,
know that a fresh `CREATE TABLE` in the `public` schema is not
locked-down by default the way you'd probably assume — pair any new
INSERT or UPDATE policy with an explicit check of
`information_schema.column_privileges` for that table, not just a passing
Supabase security-advisor result. **The advisor does not catch this
class of issue** — it flags missing RLS policies and public
`SECURITY DEFINER` functions, but not excess table/column grants
sitting underneath a policy that looks correct on its own.

## What's here

- **Marketing site** (`/`) — hero, how it works, plot visual, seasonal crop
  feature, 24×7 live-farm section, dashboard preview, farm updates,
  transparency, visit/location, pricing, **live plot registration grid**,
  legal/trust copy, FAQ, contact form.
- **Plot registration** (`#register` on the homepage) — a live plot grid
  (public, read-only, size set by admin — see "Configurable farm size"
  above) with an account-gated CTA: signed-out visitors are
  invited to create an account; signed-in visitors without a plan yet are
  sent to `/dashboard/select-plot`; visitors who already have plot(s) see
  them highlighted directly in the grid.
- **Customer auth** (`/auth/login`, `/auth/signup`, `/auth/forgot-password`,
  `/auth/callback`) — real Supabase Auth with required email confirmation.
  Name/phone captured at signup are stored as verified user metadata and
  used later at plan-claim time (never re-trusted from client input).
- **Select Plan** (`/dashboard/select-plot`) — where a confirmed customer
  picks one of the three plans (1/3/6 plots, from `membershipPlans` in
  `lib/demo-data.ts`), pays via Razorpay checkout, and gets that many plot
  numbers assigned together atomically the moment payment is verified (or
  sees the plot(s) they already have). See `app/actions/payment.ts`.
- **Admin panel** (`/admin/*`) — overview, **plot registrations** (real
  data: grouped members view + flat table + manual plan assignment), farm
  & plot management, customer management, CCTV management, crop
  management, farm-update publishing, visit-request approval. Protected by
  real Supabase Auth + the `ADMIN_EMAILS` allowlist (see below) — login at
  `/auth/admin-login`.
- **Customer dashboard** (`/dashboard/*`) — overview, select plan, my farm,
  live camera, crop cycle, farm updates, documents, farm visit request,
  membership, profile, support. All of `/dashboard/*` requires a signed-in,
  confirmed account (`proxy.ts`); Overview, Select Plan, My Farm, and
  Membership use real plot/plan data, the rest is demo content.
- **Payment abstraction** (`lib/payments/payment-service.ts`) — a
  `PaymentService` interface so Razorpay (or another provider) can be
  plugged in without touching UI code. Ships in a safe "unconfigured" state
  that refuses to fake a successful payment.
- **CCTV UI** — `components/farm/live-farm.tsx` and
  `app/dashboard/live-camera/page.tsx` render an honest "not connected yet"
  state until a real stream is wired up.

## 1. Install

```bash
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are already
filled in with a live project — anon keys are meant to be public/client-safe,
so that's fine to use as-is. You still need to fill in, at minimum:

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → your project →
  Project Settings → API → `service_role` key. **Required** for plot
  signup and the admin panel to work at all (both bypass RLS server-side
  with this key). Never expose it to the browser or commit it.
- `ADMIN_EMAILS` — protects `/admin/*` behind real Supabase Auth
  (email + password) plus this allowlist. Create each admin's login in
  the Supabase Dashboard → Authentication → Users → Add user, then list
  their email(s) here (comma-separated). Without any emails listed,
  nobody can reach `/admin` — it fails closed.
- `RESEND_API_KEY` — get one at resend.com/api-keys. Optional: signups
  still succeed and the plot still gets assigned without it, the
  confirmation email is just skipped (logged as a warning).

## 3. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. The plot registration section reads and
writes the real database immediately once `SUPABASE_SERVICE_ROLE_KEY` is
set. Everything else still runs on demo data — no further setup needed to
click through the rest of the site, dashboard, and admin panel.

## 4. Database schema

The plot registration table, RLS policies, and the customer/admin
data-access functions all live in `supabase/migrations/`. They're already
applied to the live project referenced in `.env.example`. To apply them to
a *different* Supabase project (e.g. your own), run all twenty-two files in
order through the Supabase SQL Editor, or `supabase db push` if you use
the CLI:

1. `20260831140100_khet_club_plot_registration.sql` — table, the 80-row
   seed (30 filled / 50 available), and an anonymous claim RPC that's no
   longer used by the app (superseded by migration 5) but left in place.
2. `20260831140200_khet_club_security_hardening.sql` — early advisor
   fixes for migration 1 (view privilege mode, function search_path,
   explicit role revokes).
3. `20260831165900_khet_club_real_customer_auth.sql` — moves from
   anonymous to account-gated claiming: a `user_id` column linking each
   plot to its owner, RLS so a signed-in customer can only ever read their
   *own* row(s), a public `khet_club_all_plot_statuses()` function for the
   homepage grid (plot_number + status only, no PII), and a single-plot
   `khet_club_claim_my_plot()` RPC — since superseded by migration 5's
   plan-based version, but left in place.
4. `20260831165901_khet_club_revoke_anon_claim_my_plot.sql` — Supabase
   auto-grants EXECUTE to `anon`/`authenticated` on new public-schema
   functions by default (separate from `revoke ... from public`); this
   explicitly revokes `anon`'s accidental grant from migration 3's claim
   function.
5. `20260901061800_khet_club_plan_based_claiming.sql` — the current model:
   drops the one-plot-per-user constraint (a plan can be up to 6 plots),
   adds `plan_id` and `claim_batch_id` columns, and adds
   `khet_club_claim_my_plan(plan_id)` — assigns 1/3/6 plot numbers to the
   authenticated user in one atomic transaction (`FOR UPDATE SKIP LOCKED`),
   explicitly revoking `anon` execute in the same migration this time.
6. `20260901081900_khet_club_complete_backend.sql` — six more tables:
   `mera_khet_updates` (public farm-update feed), `khet_club_farm_visits`
   (customer-submitted, admin-managed), `khet_club_cameras` (stream URLs
   locked to service_role; a `khet_club_my_camera()` function gives
   customers name/status only, never the URL), `khet_club_documents`
   (admin-attached links, per-customer or shared), `khet_club_support_
   messages`, and `khet_club_season` (the singleton current-stage/
   progress/health/date row, exposed via `khet_club_get_season()`). Also
   seeds the season row and three real farm updates.
7. `20260901083900_khet_club_payments.sql` — `khet_club_payments` table
   tracking every Razorpay order (user, plan, order/payment IDs, amount,
   status, and which `claim_batch_id` it produced), with RLS so customers
   only see their own history.
8. `20260901084100_khet_club_claim_my_plan_as_service.sql` —
   `khet_club_claim_my_plan_as(user_id, plan_id)`, a service-role-only
   variant of the claim function for the Razorpay webhook, which has no
   end-user session to derive `auth.uid()` from.
9. `20260901134100_khet_club_add_registration_deadline_column.sql` — adds
   `khet_club_season.registration_deadline`, defaulted to a placeholder
   date so the feature works immediately; change it from `/admin/crops`.
10. `20260901134200_khet_club_allow_plan_upgrades.sql` — relaxes both
    claim functions to allow a customer to buy more than one plan
    (upgrade/stack) as long as today is on/before the deadline, instead
    of blocking any second claim outright.
11. `20260902024100_khet_club_whatsapp.sql` — `khet_club_whatsapp_
    messages`, a log of every WhatsApp send (admin or automated) with its
    outcome. No customer-facing policies at all — admin-only, via
    service_role.
12. `20260902145100_khet_club_harvest_preferences.sql` —
    `khet_club_harvest_preferences`, one row per member: fulfillment
    method (delivery/processed/market) plus an optional monthly
    installment schedule with a custom kg size. Customers manage their
    own row via RLS; admins see everyone's at `/admin/customers`.
13. `20260902173000_khet_club_custom_plot_selection.sql` — adds
    `custom_name` to `khet_club_plots` (member-settable nickname) and
    `start_plot` to `khet_club_payments`; both claim functions
    (`khet_club_claim_my_plan` / `_as`) gain an optional `p_start_plot`
    parameter — null still means auto-assign (unchanged), a value means
    "claim exactly this contiguous block, re-validated with real row
    locks, not just trusted from the request."
14. `20260902173500_khet_club_privilege_hardening.sql` — **critical
    fix**, see the callout near the top of this README. Revokes the
    broad default INSERT/UPDATE grants Supabase silently applies to
    every new table and replaces them with precise, minimal grants
    matching each table's actual RLS policies.
15. `20260903030000_khet_club_harvest_delivery_tracking.sql` — adds
    `confirmed_total_kg` to `khet_club_harvest_preferences` (the real,
    admin-set harvest amount once weighed — separate from the pre-harvest
    estimate) and a new `khet_club_harvest_deliveries` log table.
    Grants were scoped minimally from the start this time — verified via
    a live exploit attempt before any app code was written against it,
    per the lesson from migration 14.
16. `20260903041500_khet_club_certificates.sql` — adds `approved_at` /
    `approved_by` to `khet_club_plots` (the certificate approval gate)
    and a new `khet_club_certificates` table, one row per issued
    certificate. Grants scoped minimally from the start; verified via
    live exploit attempt before shipping.
17. `20260903041600_khet_club_next_certificate_number.sql` —
    `khet_club_next_certificate_number()`, a service-role-only function
    that atomically generates `MK-{year}-{0001}`-style numbers from the
    sequence created in migration 16 — avoids a "read the last number,
    add 1" race between two concurrent approvals.
18. `20260903083000_khet_club_harvest_preference_change_requests.sql` —
    `khet_club_harvest_preference_requests`: a member's first harvest
    preference save stays direct, but any change after that is a request
    row here, only applied to the real preference once an admin
    approves it at `/admin/harvest`. A partial unique index allows only
    one pending request per member at a time. Grants scoped minimally
    from the start; verified via live exploit attempt before shipping.
19. `20260903144500_khet_club_configurable_farm_size.sql` — removes the
    hardcoded 80-plot upper bound, adds `total_plots` to
    `khet_club_season`, and adds `khet_club_resize_farm()` — grows or
    shrinks the farm from `/admin/crops`, refusing to shrink past any
    already-claimed plot.
20. `20260905123000_khet_club_contact_messages.sql` — the homepage
    contact form's real backend (`khet_club_contact_messages`). The
    first table in this app that needs an `anon` insert policy, since
    the submitter isn't logged in — grants scoped to exactly the columns
    a visitor should set, verified via live exploit attempt.
21. `20260905170000_khet_club_contact_settings.sql` — adds
    `contact_email` / `contact_phone` to `khet_club_season`, editable
    from `/admin/crops` → "Public Contact Info," so the footer and
    WhatsApp Us button can change without a redeploy.
22. `20260906051200_khet_club_plan_prices.sql` — `khet_club_plan_prices`:
    admin-editable pricing for all 3 plans at `/admin/crops` → "Plan
    Pricing." This is the actual price the payment flow charges at
    checkout, not just a display number — read-only for anon and
    authenticated, verified via live exploit attempt for both before
    shipping, given this table controls real money.

The farm's total plot count is no longer fixed by these migrations —
migration 19 (`khet_club_configurable_farm_size.sql`) makes it a live
setting. To resize the farm after initial setup, use `/admin/crops`
("Farm Size") rather than editing any migration — that's the actual
supported way now, and it handles growing/shrinking safely (refusing to
remove already-claimed plots). The `generate_series(1, 80)` seed in
migration 1 only sets the *initial* count when first applying these
migrations to a fresh project; adjust it there only if you want a
different starting size, not as an ongoing resize mechanism. If you
change the plan sizes, update both `membershipPlans` in
`lib/demo-data.ts` and the `case p_plan_id when ...` mapping inside
`khet_club_claim_my_plan` / `khet_club_claim_my_plan_as` (migrations 5,
10, and 19 — they need to stay in sync).

## 5. Customer accounts

Customers sign up at `/auth/signup` (full name, email, phone, password).
Supabase sends a confirmation email; the link lands on `/auth/callback`,
which exchanges it for a session and redirects to `/dashboard/select-plot`.
There, the customer picks one of three plans — 1, 3, or 6 plots
(`membershipPlans` in `lib/demo-data.ts`), pays via Razorpay, and
`verifyPaymentAndClaim` (`app/actions/payment.ts`) runs the claim as that
user via the **session client** (`lib/supabase/session.ts`, anon key +
their cookies) — not the service-role client — so the database itself
enforces that a user can only ever claim plots as themselves, not on
someone else's behalf. Name and phone come from the verified metadata
captured at signup, not from a form field at claim time, so they can't be
spoofed. All plots from one purchase are assigned together, atomically,
and share a `claim_batch_id`.

Customers can buy **more than one plan** — upgrade or stack additional
plots onto what they already have — any time up to
`khet_club_season.registration_deadline`, set from `/admin/crops`. Once
that date passes, `khet_club_claim_my_plan` rejects new claims with
`REGISTRATION_CLOSED` (and any payment already taken for a claim that
fails is refunded automatically — see "Configure payments" below).
`lib/demo-data.ts`'s `summarizePlotHoldings()` aggregates a customer's
total plots/area/wheat target across however many separate purchases
they've made, since they may no longer share a single `plan_id`.

All of `/dashboard/*` requires a signed-in, confirmed account (`proxy.ts`).
There's no separate customer "profile" table yet — `auth.users` plus
however many `khet_club_plots` rows share the user's `user_id` (once
claimed) is the whole of it for now.

## 6. Admin panel access

`/admin/*` is protected by real Supabase Auth (email + password) plus the
`ADMIN_EMAILS` allowlist — see `proxy.ts`, `lib/admin-auth.ts`, and the
login page at `/auth/admin-login`. There's no separate "admin" role or
table: any Supabase user can sign in, but `proxy.ts` only lets requests
through to `/admin/*` if the signed-in user's email is on the allowlist.
Unlike the customer claim flow, admin reads/writes in `/admin/registrations`
use the **service-role client** (`lib/supabase/service.ts`) since admins
need to see and edit every plot, not just their own.

To add an admin:

1. Supabase Dashboard → your project → Authentication → Users → Add user.
   Set their email and a password (or send an invite, depending on your
   Supabase plan).
2. Add their email to `ADMIN_EMAILS` in your environment (comma-separated
   for multiple admins).
3. They sign in at `/auth/admin-login`.

Removing an admin is just deleting their email from `ADMIN_EMAILS` (their
Supabase account can stay — they just won't pass the allowlist check
anymore).

`/admin/registrations` is the live view into `khet_club_plots`:

- A **Members** section — one card per claimed plan (grouped by
  `claim_batch_id`), showing the plan name, all plot numbers in that plan,
  and the member's details, with a "Free Up All" action that releases the
  whole plan at once.
- A **manual plan-assignment** form — pick a plan (1/3/6 plots) and enter
  a name/phone/email/city, for offline or walk-in reservations. It grabs
  that many available plot numbers and assigns them together, exactly
  like a customer's own claim.
- A **flat table** of every plot individually (with its plan, if any) for
  fine-grained control — per-row "Free Up" or "Quick Fill" (a single plot,
  no plan attached).

All actions write through the service-role client and reflect on the
homepage's plot grid immediately (`revalidatePath`).

## 7. What's left to wire up

Almost everything now runs on real data (see "What's live" up top). Two
gaps remain, by design — each is a deliberate scope boundary, not an
oversight:

- **Support inbox**: `khet_club_support_messages` stores every message a
  customer sends, but there's no `/admin` page to read them yet — pull
  from that table the same way `/admin/visits` reads
  `khet_club_farm_visits`.
- **Real video streaming**: `khet_club_cameras` and `khet_club_my_camera()`
  are real; the video itself isn't. Point `stream_url` at an actual
  RTSP→HLS/WebRTC gateway, then resolve a short-lived *signed* playback
  URL server-side (never send the raw URL to the browser) and wire that
  into `/dashboard/live-camera`.

## 8. Configure payments (Razorpay)

Payments are fully implemented — `PaymentService`
(`lib/payments/payment-service.ts`) has a working `RazorpayPaymentProvider`
(order creation, signature verification, webhook verification), and
`/dashboard/select-plot` uses it for real: **plots are only assigned after
a verified payment**, not on selection. What's left is just supplying
your own Razorpay credentials:

1. Sign up at razorpay.com and grab **test-mode** keys from Dashboard →
   Settings → API Keys.
2. Set `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, and
   `RAZORPAY_KEY_SECRET` in your environment. Without these, Select Plan
   shows a friendly "payments aren't configured" message instead of
   processing anything — it never fakes a successful payment.
3. (Recommended) Dashboard → Settings → Webhooks → add
   `https://<your-domain>/api/webhooks/razorpay`, subscribed to
   `payment.captured`, and put its signing secret in
   `RAZORPAY_WEBHOOK_SECRET`.

**How the flow works** (`app/actions/payment.ts`):

1. Customer clicks a plan → `createPlanOrder` creates a Razorpay order
   (amount from the server's own `membershipPlans`, never trusted from
   the client) and records a `khet_club_payments` row with
   `status: 'created'`.
2. The Razorpay Checkout modal opens client-side
   (`components/dashboard/plan-selection-form.tsx`).
3. On success, `verifyPaymentAndClaim` verifies the payment signature
   **server-side** (HMAC-SHA256, constant-time comparison), marks the
   payment `paid`, then calls `khet_club_claim_my_plan` — same
   RLS-enforced, atomic claim used everywhere else in the app.
4. **If the claim fails after payment succeeds** (e.g. the last plot for
   that plan just sold out in a race), the payment is refunded
   automatically via the Razorpay API and marked `refunded` — customers
   are never charged with nothing to show for it.
5. `app/api/webhooks/razorpay/route.ts` is a safety net: if the browser
   closes or the network drops right after payment, the webhook still
   confirms it and claims the plan via `khet_club_claim_my_plan_as` (a
   service-role-only variant that takes an explicit user id, since a
   webhook has no end-user session). Idempotent — a duplicate delivery,
   or one that arrives after the client-side path already succeeded, is a
   no-op.

`/dashboard/membership` shows real payment history per customer, pulled
straight from `khet_club_payments`. Admin's manual "Assign a Plan" flow
(`/admin/registrations`) intentionally bypasses payments entirely — it's
for offline reservations (cash, bank transfer, etc.) where the admin is
vouching that payment happened through another channel.

## 9. Configure WhatsApp (Meta Cloud API)

Also fully implemented — `lib/whatsapp/whatsapp-service.ts` sends real
messages via Meta's official WhatsApp Cloud API. What's left is your own
Meta setup:

1. Create a Meta Business App with the WhatsApp product
   (developers.facebook.com) → get a phone number and its
   `WHATSAPP_PHONE_NUMBER_ID`.
2. Generate an access token. The default dev-console token expires in
   24h — for real use, create a System User in Meta Business Settings
   and generate a **permanent** token for it (`whatsapp_business_
   messaging` permission).
3. **Create and get approval for exactly one message template** in
   WhatsApp Manager → Message Templates: category "Utility", body =
   just one variable, e.g. `Mera Khet Update: {{1}}`. This is not
   optional — WhatsApp requires an approved template for any
   business-initiated message sent outside a 24-hour window since the
   customer last messaged you, which covers essentially every broadcast
   and automated notification this app sends. Whatever an admin types
   into the message box becomes that template's `{{1}}` — there's no
   way to send truly free-form text for broadcasts.
4. Set `WHATSAPP_TEMPLATE_NAME` to that template's exact name and
   `WHATSAPP_TEMPLATE_LANG` to the language code you picked when
   creating it (commonly `en_US`).

Without these set, `sendWhatsAppMessage` logs `not_configured` and
returns a clean failure — nothing else in the app breaks, and
`/admin/whatsapp` shows a banner saying so.

**Where messages are sent from:**

- **Admin broadcast** (`/admin/whatsapp`) — sends to every "current
  season member" (anyone holding at least one filled plot).
- **Admin individual** (`/admin/whatsapp`) — pick a customer from a
  dropdown (their phone comes from the same signup metadata used
  everywhere else), write a message, send.
- **Automated: plot confirmation** — the moment a payment is verified
  and a plan is claimed (`app/actions/payment.ts` and the Razorpay
  webhook), the member gets a WhatsApp message with their plot number(s)
  alongside the confirmation email.
- **Automated: farm updates** — publishing an update from
  `/admin/updates` also broadcasts it to every current-season member via
  `broadcastWhatsAppToCurrentMembers` (`lib/whatsapp/broadcast.ts`).

Every send — admin or automated, successful or failed — is logged to
`khet_club_whatsapp_messages` and shown in `/admin/whatsapp`'s message
table, including the specific failure reason (e.g. `not_configured`,
`no_phone_on_file`, or whatever Meta's API returned).

The broadcast helper sends **sequentially, one member at a time**. Fine
at the member counts this app is built for; if you ever need to broadcast
to hundreds of people, move it to a background job/queue instead of
running it inline in a Server Action (which has a request time limit on
most hosts, including Vercel).

### Configure WhatsApp certificates (separate template)

Sending a certificate PDF over WhatsApp uses a **second** approved
template — `WHATSAPP_CERTIFICATE_TEMPLATE_NAME` (default
`mera_khet_certificate`) — distinct from the plain-text update template
above, because it needs a **Document header component**, which the
generic utility template doesn't have. Create it the same way, in
WhatsApp Manager → Message Templates:

- Category: Utility
- Header type: Document
- Body: two variables, e.g. `Congratulations {{1}}! Your Mera Khet
  membership certificate for plot(s) {{2}} is attached.`

Until this second template is approved, `sendWhatsAppDocument`
(`lib/whatsapp/whatsapp-service.ts`) will fail and log the reason —
**the certificate email (with the PDF attached) and the website download
at `/dashboard/my-farm` both work regardless**, since neither depends on
this template. Only the WhatsApp document send needs it.

## 10. Configure weather

`/dashboard/crop-cycle` shows live weather for the farm's real coordinates
via [Open-Meteo](https://open-meteo.com/en/docs), using plain HTTP `fetch`
in `lib/weather.ts` — no SDK, no environment variable, no API key. It
works immediately, out of the box.

**Decision made**: running on Open-Meteo's key-free tier for now — it's
licensed for non-commercial use, and Mera Khet is a business, but at
current traffic levels this is accepted as a reasonable way to start.
**Revisit this once usage grows**: check
[open-meteo.com/en/pricing](https://open-meteo.com/en/pricing) for a
commercial plan before this app is generating real production-scale
traffic, rather than letting the free tier ride indefinitely by default.

If you resize the farm's location later (different plot, different
village), update `FARM_LAT` / `FARM_LON` at the top of `lib/weather.ts`
— they're currently set to Sujangarh, Churu district, Rajasthan
(27.70°N, 74.47°E).

## 11. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add every variable from `.env.example` you're using under Project →
   Settings → Environment Variables — especially `SUPABASE_SERVICE_ROLE_KEY`,
   `ADMIN_EMAILS`, `RESEND_API_KEY`, (if enabling real payments)
   `PAYMENT_PROVIDER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`, and (if enabling WhatsApp)
   `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`,
   `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` — none of which have
   safe defaults.
4. Deploy. Vercel's build environment has open internet access, so
   `next/font` (Fraunces, Inter, JetBrains Mono) will fetch normally.

**One thing that would otherwise fail silently only in production**:
`lib/certificate.tsx` loads the Devanagari font via a *dynamic*
`path.join()` call, which Next's file tracer can't discover through
static analysis. Without the `outputFileTracingIncludes` entries already
set in `next.config.ts`, the font file would work fine in local dev
(the whole project is on disk) but be missing from the deployed
serverless function bundle — Hindi certificate taglines specifically
would break, with nothing else indicating why. If you move
`lib/certificate.tsx` or `lib/fonts/`, or add new routes that call
`generateCertificatePdf`, update those tracing paths to match.

## Notes on this build

- **Current season**: the site is configured for a single active crop —
  Gehu (wheat), sown near Diwali — and three plot-based seasonal plans (1,
  3, and 6 plots, each plot = 7,260 sq ft / ⅙ acre) defined in
  `lib/demo-data.ts` (`currentCrop`, `membershipPlans`). 6 plots = exactly
  1 acre. Only seasonal plans are offered; there's no annual membership
  tier. The plot registration pool and the 1/3/6-plot plans are the
  *same* system — picking a plan at `/dashboard/select-plot` assigns that
  many real plot numbers out of the farm's current total (admin-
  configurable, see "Configurable farm size" above). Customers can buy
  more than one plan (upgrade/stack) up to the registration deadline —
  see "Customer accounts" above — there's just no downgrade/refund-a-
  plan-for-a-smaller-one flow (a customer can only ever add plots, not
  remove them, short of
  an admin manually freeing some via `/admin/registrations`).

- **Email sender**: `RESEND_FROM_EMAIL` defaults to Resend's shared test
  sender (`onboarding@resend.dev`) if unset — fine for development, but
  you'll want a verified domain sender (e.g. `Mera Khet
  <hello@merakhet.com>`) for real production email.

- **Photography**: `public/images/` holds five wheat/harvest photos supplied
  for this project, wired into `Hero`, `HowItWorks`, `SeasonalCrops`,
  `HarvestOptions`, and `VisitAndLocation` via `next/image`. Confirm you
  have the rights to use these images in a live commercial deployment
  before launch, and swap in your own farm photography as it becomes
  available — a couple of original SVG illustrations
  (`components/farm/illustrations/`) are still in the repo, unused, if you
  ever want a code-drawn fallback instead of a photo.

- **Legal copy**: the plot/plan allocation language throughout the site is
  deliberately non-committal about land ownership and yield/return
  guarantees, per the brief. Have this reviewed by counsel before launch —
  it is not a substitute for a real membership agreement.
