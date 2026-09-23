/**
 * Editorial copy for the public site (2026 redesign), kept in one place
 * so wording can be changed without touching layout code.
 *
 * FAQ answers that mention money or capacity use {TOKENS} that are filled
 * from live data at render time (see buildFaqs) — so a price change made in
 * the admin panel is reflected in the FAQ automatically and can never drift
 * out of step with the pricing cards again.
 */
import { INSTALLMENT_DUE_DAYS, installmentFeeInr, balanceLateFeeInr, BALANCE_GRACE_DAYS } from "@/lib/demo-data";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** What happens at each crop stage, and what a member sees from home. Timings are approximate. */
export const stageDetails: Record<string, { when: string; desc: string; see: string }> = {
  "Field Preparation": {
    when: "The weeks before Diwali",
    desc: "The land is cleared, ploughed and levelled, the drip lines are checked, and nutrients are planned from the soil-test results — so the crop starts on ground prepared for what it actually needs.",
    see: "Stage updates on your dashboard as the field is readied. Your plot numbers are already assigned.",
  },
  Sowing: {
    when: "Near Diwali · day 0",
    desc: "RAJ 1482 seed goes into the ground across every plot. This is the start of the roughly 140-day clock.",
    see: "Camera access for members begins, so you can check on the field from anywhere.",
  },
  Germination: {
    when: "Roughly the first one to two weeks",
    desc: "Seedlings break the surface and the rows begin to turn green. Early irrigation matters most here, while the roots are shallow.",
    see: "The first green showing in straight lines on camera.",
  },
  Tillering: {
    when: "Roughly weeks three to six",
    desc: "Each plant sends up extra shoots, which largely decides how many ears it will carry. Water and nutrition are managed closely through this stretch.",
    see: "The field filling in and thickening — the gaps between rows close up.",
  },
  Flowering: {
    when: "Around the middle of the season",
    desc: "The ears emerge and flower. This is when the crop is most sensitive to heat and water stress, so it is the most closely watched stage.",
    see: "Ears visible across the field, and a crop-stage update marking the turn.",
  },
  "Grain Filling": {
    when: "The final weeks",
    desc: "The grain swells and hardens, and the field slowly turns from green to gold as it dries toward harvest.",
    see: "The colour change from green to gold, week by week.",
  },
  Harvest: {
    when: "Around day 140, in spring",
    desc: "The crop is cut and threshed, the farm's total is weighed, and every plot's share is confirmed before storage and dispatch.",
    see: "Your confirmed share on the dashboard, and your harvest choice put into action.",
  },
};

export const harvestFlow = [
  { title: "Weighed & confirmed", body: "The farm's total harvest is weighed and your share is confirmed." },
  { title: "Quality checked", body: "Grain is checked before anything is stored or dispatched." },
  { title: "Stored on-site", body: "Kept in our own warehouse until you're ready for it." },
  { title: "Your choice applied", body: "Delivered raw, or milled and packed in-house — or the surplus sold for you." },
  { title: "Delivered", body: "In 15, 30 or 50 kg bags — all at once, or spread monthly." },
];

export const faqCategories = [
  { id: "season", title: "The season & the crop", short: "The season" },
  { id: "plot", title: "Your plot & membership", short: "Your plot" },
  { id: "harvest", title: "Harvest & delivery", short: "Harvest" },
  { id: "money", title: "Plans & payment", short: "Plans" },
  { id: "trust", title: "Cameras & transparency", short: "Cameras" },
] as const;

export type FaqCategoryId = (typeof faqCategories)[number]["id"];
export type Faq = { id: number; cat: FaqCategoryId; q: string; a: string };

const rawFaqs: Omit<Faq, "id">[] = [
  { cat: "season", q: "What crop is being grown this season?", a: "Gehu (wheat) — currently the only crop we grow at Mera Khet. Sowing begins near Diwali and the season runs through the Rabi (winter) months." },
  { cat: "season", q: "What wheat variety do you grow?", a: "RAJ 1482 — developed at the Rajasthan Agricultural Research Institute, Durgapura, specifically for local soil and climate. It is recognised among Indian wheat researchers for its grain quality, and it is a variety millers and households seek out for roti and chapati. Because we mill it whole, with the bran and germ intact, it keeps more fibre, iron and B-vitamins than refined flour." },
  { cat: "season", q: "Who farms the land?", a: "A team of experienced farmers from our own village. They do the ploughing, sowing, irrigation, care and harvest all season — so every membership also means steady work in the village, close to home." },
  { cat: "season", q: "How do you know what's right for your soil?", a: "We have sent samples from our fields for laboratory soil testing, and the results guide our crop and nutrient decisions. We will keep testing through the season and share the farm's test results with every member, every month, on the dashboard." },
  { cat: "season", q: "Is the farm organic?", a: "Not yet, and we won't claim otherwise. This season we use no harmful chemicals just to push the yield, and fertiliser follows the soil test results. For the next wheat season, we plan to farm 100% organically — and we will only call it certified organic once we actually hold the certificate." },
  { cat: "season", q: "Can I choose my crop?", a: "Not at the moment — Mera Khet is growing a single crop, Gehu (wheat), this season. We may introduce other seasonal crops in future seasons." },
  { cat: "season", q: "How long is the membership?", a: "One full seasonal cycle — from sowing near Diwali through the wheat harvest in spring. There is no annual commitment; you can join again each new season." },
  { cat: "season", q: "What happens if the crop fails?", a: "Farming depends on weather, water, pests and other conditions nobody controls, so we can't guarantee the yield. If the crop is damaged or fails, every member receives their equal share of whatever the farm harvests; membership fees aren't refunded for a low or failed harvest. What we do promise is how we farm: experienced farmers from our village, no harmful chemicals used to push the yield, farm test results every month, and a live camera so you can see it all for yourself." },

  { cat: "plot", q: "What do I receive with my membership?", a: "A dedicated allocation of farm plots (1, 3 or 6), farmed for the season by experienced farmers from our village; an equal per-plot share of the farm's harvest; a live 24×7 camera on your dashboard from sowing; farm test results every month; regular updates; in-house milling and packing; on-site storage; and eligibility to visit the farm." },
  { cat: "plot", q: "Is my plot legally owned by me?", a: "No. Your membership gives you a contractual allocation of, and participation in, a designated farm area under the terms of your membership agreement. It does not transfer legal ownership of agricultural land unless that agreement explicitly says so." },
  { cat: "plot", q: "Is my share taken from my own specific plots?", a: "Not exactly — and this works in your favour. At harvest, the whole farm's wheat is brought together and divided equally across every plot: a 1-plot member receives one share, a 3-plot member three, and so on. Your plots are genuinely yours to follow, visit and watch all season, but nobody is left carrying a weaker patch of the field alone. One farm, one season, shared fairly. Full details are in the Membership Agreement." },
  { cat: "plot", q: "Where is the farm located?", a: "Sujangarh, Rajasthan, India. An exact plot map is shared with members after allocation; we don't publish a private residential address." },
  { cat: "plot", q: "Can I visit my farm?", a: "Yes, subject to prior scheduling, farm conditions, safety requirements and operational availability. Requests are raised from your dashboard, which shows your plot numbers — so you can walk straight to them when you arrive." },
  { cat: "plot", q: "Are annual memberships available?", a: "Not currently — only seasonal plans are offered. Your membership covers one full crop season." },
  { cat: "plot", q: "Can I renew my membership?", a: "Yes. Since plans are seasonal, you can renew for the next season from the Membership section of your dashboard once this season ends." },
  { cat: "plot", q: "Can I gift a farm membership?", a: "Yes — reach out to our team through the contact form and we will help set up a gifted membership." },

  { cat: "harvest", q: "What are my options for the harvest?", a: "Three: (1) we deliver the raw harvest to your home, with delivery charged separately; (2) we mill it into fresh atta and pack it in-house at the farm — included in your plan — and deliver that; or (3) we sell it at the day's market rate and send you what it fetches. Market rates for wheat are far below the membership price, so this suits surplus you won't use; it isn't a return on what you paid. For either delivery option, you can also receive it in monthly instalments of a size you choose — for example 40 kg a month — set from your dashboard's Harvest Preference." },
  { cat: "harvest", q: "What happens after harvest?", a: "Your crop is harvested and weighed at the field, and the confirmed total is recorded against your membership. It is quality-checked, then handled the way you chose. Every delivery is logged on your dashboard with its date and quantity, against a running progress bar of your confirmed total." },
  { cat: "harvest", q: "How long until I receive it, and how is it packed?", a: "Typically 2–3 weeks after harvest, depending on your location. It is packed in 15 kg, 30 kg or 50 kg bags. Delivery charges depend on distance and are billed separately from your membership." },
  { cat: "harvest", q: "Is milling included?", a: "Yes. Milling your wheat into whole atta and packing it are done in-house at the farm and are included in your plan. The only extra charge is delivery, which depends on distance." },
  { cat: "harvest", q: "Where is my wheat kept between harvest and delivery?", a: "In our own {WAREHOUSE_TONNES}-tonne storage warehouse at the farm — not left in the field or handed to a third-party facility. That is also why monthly instalments work: the rest of your harvest stays with us until it is dispatched." },
  { cat: "harvest", q: "How is my harvest weighed and verified?", a: "It is weighed at the field once brought in, and that confirmed total — not the earlier estimate — is what your delivery progress is tracked against. If you take monthly instalments, each delivery is logged separately with its own date and weight." },
  { cat: "harvest", q: "How will I know when my delivery is coming?", a: "You will be notified on WhatsApp and on your dashboard once your harvest total is confirmed, and again each time a delivery is logged." },

  { cat: "money", q: "What plan sizes are available?", a: "Three seasonal plans, each made of 7,260 sq ft plots. Kothi — 1 plot (~0.17 acre, 250–300 kg wheat, {P1}). Annakosh — 3 plots (~0.5 acre, 750–900 kg, {P3}). Mahabhandar — 6 plots (exactly 1 acre, 1,500–1,800 kg, {P6}). Every plan includes the same benefits." },
  { cat: "money", q: "How much does a membership cost?", a: "{P1} per season for Kothi (1 plot), {P3} for Annakosh (3 plots), or {P6} for Mahabhandar (6 plots / 1 acre). These are current season prices and may be adjusted over time." },
  { cat: "money", q: "Can I pay in two parts?", a: "Yes, on all three plans. Pay 50% to reserve and your plots are locked immediately, exactly as with a full payment. The remaining 50% is due {DUE_DAYS} days later. A small convenience fee applies to the deposit: {FEE1} for Kothi, {FEE3} for Annakosh or Mahabhandar. If the balance is late, a late fee applies (see below)." },
  { cat: "money", q: "What if I pay the balance late?", a: "The balance is due {DUE_DAYS} days after your deposit. After that a late fee is added — {LATE1} for Kothi, {LATE3} for Annakosh, {LATE6} for Mahabhandar — and your dashboard shows the new total. If the balance is still unpaid {GRACE} days after the due date (day 55), your plots are released and your deposit is handled under the Refund & Cancellation policy." },
  { cat: "money", q: "Is the wheat amount guaranteed?", a: "No. The wheat figures for each plan are estimated targets based on typical yields per plot, not guarantees. The actual harvest depends on weather, soil conditions, pests and other natural factors." },
  { cat: "money", q: "Can I cancel?", a: "A 50% refund applies if you cancel more than 14 days before the season's sowing date. Within 14 days of sowing, or once sowing has begun, the membership is non-refundable. Full terms are in the Refund & Cancellation policy." },
  { cat: "money", q: "What is the Feeding Families Fund?", a: "₹1,000 from every plot's price — not an extra charge on top — is set aside to donate wheat to families in need. A 3-plot Annakosh membership sets aside ₹3,000, and a 6-plot Mahabhandar ₹6,000, from what you have already paid." },

  { cat: "trust", q: "How does the CCTV work?", a: "Field cameras cover the plots. From sowing, members watch them live, 24×7, on their dashboard. Live video depends on the weather and the network at the farm — if it drops, you'll see the latest photo instead, clearly labelled as a photo, never passed off as live. The camera system is run by our team, and its credentials are never shared with members." },
  { cat: "trust", q: "Can I watch the farm any time?", a: "Yes. From sowing, your dashboard shows the live camera 24×7, whenever the weather and the farm's network allow. If the stream is down, you'll see the most recent photo instead." },
  { cat: "trust", q: "Have you run previous seasons?", a: "No — this is Mera Khet's first season, and we won't show you photos of a harvest that didn't happen. What we offer instead is full transparency from day one: camera access, farm updates and a real dashboard tracking your plots, so you can watch this season unfold. Early members are effectively founding members." },
  { cat: "trust", q: "How are farm updates provided?", a: "Our field team publishes periodic updates — photos, notes and crop-stage changes — directly to your dashboard timeline." },
  { cat: "trust", q: "Will I see the farm's test results?", a: "Yes. Every member gets the farm's test results every month on their dashboard, so you can see for yourself what is going into the field." },
];

/** Fills live prices / capacity into the FAQ copy. */
export function buildFaqs(opts: { prices: Record<string, number>; warehouseTonnes: number }): Faq[] {
  const tokens: Record<string, string> = {
    P1: inr(opts.prices["1-plot"]),
    P3: inr(opts.prices["3-plots"]),
    P6: inr(opts.prices["6-plots"]),
    WAREHOUSE_TONNES: String(opts.warehouseTonnes),
    DUE_DAYS: String(INSTALLMENT_DUE_DAYS),
    FEE1: inr(installmentFeeInr("1-plot")),
    FEE3: inr(installmentFeeInr("3-plots")),
    LATE1: inr(balanceLateFeeInr("1-plot")),
    LATE3: inr(balanceLateFeeInr("3-plots")),
    LATE6: inr(balanceLateFeeInr("6-plots")),
    GRACE: String(BALANCE_GRACE_DAYS),
  };
  return rawFaqs.map((f, id) => ({
    ...f,
    id,
    a: f.a.replace(/\{(\w+)\}/g, (m, k: string) => tokens[k] ?? m),
  }));
}
