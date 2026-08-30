# Khet Club

A front-end build of a farm-membership platform in Sandwa, Rajasthan —
½-acre farm allocations, seasonal crop tracking, and 24×7 CCTV farm
monitoring. Built with Next.js (App Router), TypeScript, and Tailwind CSS.

**No backend is wired up right now.** Auth forms, dashboard, and admin
panel are all real, working UI running on demo data
(`lib/demo-data.ts`) — sign-in/sign-up just navigate you in without
checking credentials, and there's no database yet. That's intentional:
add whichever backend you'd like (Supabase, another Postgres host,
Firebase, a custom API, etc.) when you're ready.

## What's here

- **Marketing site** (`/`) — hero, how it works, ½-acre plot visual,
  seasonal crops with a crop-cycle modal, 24×7 live-farm section, dashboard
  preview, farm updates, transparency, visit/location, pricing, legal/trust
  copy, FAQ, contact form.
- **Auth pages** (`/auth/login`, `/auth/signup`, `/auth/forgot-password`) —
  full UI and form handling, not yet wired to a real auth provider.
- **Customer dashboard** (`/dashboard/*`) — overview, my farm, live camera,
  crop cycle, farm updates, documents, farm visit request, membership,
  profile, support. Not yet route-protected (no auth provider to check
  against).
- **Admin panel** (`/admin/*`) — overview, farm & plot management, customer
  management, CCTV management, crop management, farm-update publishing,
  visit-request approval. Not yet route-protected.
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

## 2. Run locally

```bash
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`. Everything works on demo data out of the
box — no setup required to click through the site, dashboard, and admin
panel.

## 3. Add a backend (when you're ready)

This app was built with a clean seam for adding a backend later:

- **Data layer**: `lib/demo-data.ts` is the single source of demo content.
  Replace its usages in each page with real queries once you have a
  database.
- **Auth**: `app/auth/*/page.tsx` currently just navigate to `/dashboard`
  on submit. Swap in your provider's sign-in/sign-up calls there, and add
  route protection (e.g. Next.js middleware) for `/dashboard` and `/admin`.
- **Suggested schema**: users, farms, plots, memberships, crops,
  crop_cycles, crop_updates, cameras, farm_visits, payments, documents —
  matching the fields already used throughout `lib/demo-data.ts` and the
  dashboard/admin pages.
- **CCTV**: store camera stream URLs server-side only; never send them
  directly to the browser. Resolve a short-lived signed playback URL from
  a server route instead.

## 4. Configure payments

`lib/payments/payment-service.ts` exports a single `PaymentService` used
everywhere in the app. By default it's "unconfigured" and throws rather
than faking a successful payment. To enable Razorpay:

1. `npm install razorpay`
2. Implement the commented-out `RazorpayPaymentProvider` class (create
   order + verify signature) using `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET`.
3. Set `PAYMENT_PROVIDER=razorpay` and the `RAZORPAY_*` env vars.
4. Verify payments **server-side only**, using the webhook/signature —
   never trust a `status` field sent from the browser.

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add any variables from `.env.example` you're using under Project →
   Settings → Environment Variables.
4. Deploy. Vercel's build environment has open internet access, so
   `next/font` (Fraunces, Inter, JetBrains Mono) will fetch normally.

## Notes on this build

- **Current season**: the site is configured for a single active crop —
  Gehu (wheat), sown near Diwali — and three plot-based seasonal plans (1,
  3, and 6 plots, each plot = 7,260 sq ft / ⅙ acre) defined in
  `lib/demo-data.ts` (`currentCrop`, `membershipPlans`). 6 plots = exactly
  1 acre. Only seasonal plans are offered; there's no annual membership
  tier. Swap `currentCrop` for a different crop next season, or extend it
  back into an array if the farm grows more than one crop again later.

- **Photography**: the brief calls for real Rajasthan farmland photography.
  This build intentionally uses a code-drawn plot-map/field-texture visual
  system instead of stock photos, to avoid using unlicensed images. Drop
  real, licensed photography into the `Hero`, `VisitAndLocation`, and crop
  card components before launch.
- **Legal copy**: the "½-acre allocation" language throughout the site is
  deliberately non-committal about land ownership and yield/return
  guarantees, per the brief. Have this reviewed by counsel before launch —
  it is not a substitute for a real membership agreement.
