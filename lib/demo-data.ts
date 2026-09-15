// Static site content — the current crop, plan sizes/pricing, harvest
// fulfillment options, and FAQ copy. Business config, not per-user data,
// so it's fine to keep as static config here rather than a DB table.

// Mera Khet currently grows a single crop per season. The upcoming
// season is Gehu (wheat), sown around Diwali.
export const currentCrop = {
  id: "gehu",
  name: "Gehu",
  localName: "Wheat",
  variety: "RAJ 1482",
  season: "Rabi — sowing begins near Diwali",
  description:
    "Our upcoming season crop. Wheat is sown just after Diwali and grown through the cooler Rabi months, well suited to Sujangarh's soil and winter climate.",
  varietyDescription:
    "We're growing the RAJ 1482 variety this season — developed at the Rajasthan Agricultural Research Institute, Durgapura, and specifically recognized among Indian wheat researchers for its grain quality rather than yield alone. It's a variety commonly sought out for roti and chapati making.",
  varietyBenefits: [
    {
      title: "Bred for Rajasthan's conditions",
      description: "Developed at Durgapura specifically for local soil and climate, not adapted from elsewhere.",
    },
    {
      title: "Known for roti & chapati quality",
      description: "A variety millers and households specifically seek out for soft, pliable chapatis — not just a general-purpose wheat.",
    },
    {
      title: "Whole wheat, milled whole",
      description: "Milled with the bran and germ intact, so it naturally retains more fiber, iron, and B-vitamins than refined flour.",
    },
    {
      title: "Soil-tested, not guessed",
      description: "We've sent our soil for laboratory testing so future crop and nutrient decisions are based on what our land actually needs — not assumption.",
    },
  ],
  stages: [
    "Field Preparation",
    "Sowing",
    "Germination",
    "Tillering",
    "Flowering",
    "Grain Filling",
    "Harvest",
  ],
  durationDays: 140,
  processedProduct: "Wheat Flour (Atta)",
};

// A transparency comparison, not a quality one — every "known" claim
// here is something already stated and true elsewhere on the site
// (variety, storage, camera access), just reframed as "you'd normally
// never know this." Deliberately doesn't name a specific individual
// farmer, since the founder story is intentionally unsigned for now.
export const wheatComparisonRows = [
  { label: "Where it's grown", unknown: "Could be anywhere", known: "Sujangarh, Rajasthan — your exact plot" },
  { label: "Who grew it", unknown: "You'll never meet them", known: "Our team — and you can visit" },
  { label: "What variety it is", unknown: "Usually unlabeled", known: "RAJ 1482, bred for Rajasthan's soil" },
  { label: "What's used on it", unknown: "No way to ask", known: "Soil-tested — fertilizer applied to actual crop need" },
  { label: "How old it is", unknown: "Could be months, or seasons", known: "This season's harvest, delivered in 2–3 weeks" },
  { label: "How it's milled", unknown: "Often refined", known: "Milled whole — bran and germ intact" },
  { label: "Where it's stored", unknown: "Changes hands, unrecorded", known: "Our own 30-tonne on-site warehouse" },
  { label: "Can you watch it grow", unknown: "No", known: "Yes — farm updates & camera access" },
];

// Kept as an array so components that expect a crop list keep working —
// Mera Khet grows only this one crop for now.
export const demoCrops = [currentCrop];

export const membershipPlans = [
  {
    id: "1-plot",
    name: "Kothi",
    label: "1 Plot",
    plots: 1,
    areaSqFt: 7260,
    approxAcre: "~0.167 acre",
    wheatMinKg: 250,
    wheatMaxKg: 300,
    priceInr: 20000,
    tagline: "Feed Your Family",
  },
  {
    id: "3-plots",
    name: "Annakosh",
    label: "3 Plots",
    plots: 3,
    areaSqFt: 21780,
    approxAcre: "~0.50 acre",
    wheatMinKg: 750,
    wheatMaxKg: 900,
    priceInr: 50000,
    tagline: "Stock Up for the Year",
  },
  {
    id: "6-plots",
    name: "Mahabhandar",
    label: "6 Plots",
    plots: 6,
    areaSqFt: 43560,
    approxAcre: "1 acre",
    wheatMinKg: 1500,
    wheatMaxKg: 1800,
    priceInr: 100000,
    tagline: "Farm a Full Acre",
  },
];

/**
 * A customer can now own plots from more than one plan purchase (buying
 * more before the registration deadline). This summarizes their total
 * holdings across all of them, scaling per-plot figures from the 1-plot
 * plan's base rate rather than assuming a single plan_id applies to
 * everything.
 */
export function summarizePlotHoldings(plots: { plan_id: string | null }[]) {
  const totalPlots = plots.length;
  const uniquePlanIds = Array.from(new Set(plots.map((p) => p.plan_id).filter(Boolean)));
  const singlePlan =
    uniquePlanIds.length === 1 ? membershipPlans.find((p) => p.id === uniquePlanIds[0]) ?? null : null;
  const basePlan = membershipPlans.find((p) => p.id === "1-plot")!;

  return {
    totalPlots,
    label: totalPlots === 0 ? null : singlePlan ? singlePlan.name : `${totalPlots} Plots`,
    areaSqFt: totalPlots * basePlan.areaSqFt,
    wheatMinKg: totalPlots * basePlan.wheatMinKg,
    wheatMaxKg: totalPlots * basePlan.wheatMaxKg,
    isMixedPlans: uniquePlanIds.length > 1,
  };
}

// Shared by every plan size — every plan includes the same set of benefits.
export const planIncludes = [
  "Dedicated farm plot allocation",
  "Wheat cultivation with soil-tested, responsible fertilizer use",
  "Farm management by our team",
  "24×7 CCTV access*",
  "Farm progress updates",
  "Crop cycle tracking",
  "Farm photos & videos",
  "Harvest updates",
  "Choice of harvest delivery, processing, or market sale",
  "On-site storage until your harvest is dispatched",
  "Farm visit eligibility",
  "₹1,000 per plot toward the Feeding Families Fund",
];

// Earmarked from the plan price itself, not an add-on charge — see the
// Feeding Families Fund note wherever pricing is shown.
export const FEEDING_FAMILIES_PER_PLOT = 1000;

// Single source of truth for expense categories — the DB value (must
// match khet_club_expenses' CHECK constraint exactly) paired with a
// human-readable label. Both the admin form and the validation logic
// import this, so they can never drift out of sync with each other.
export const EXPENSE_CATEGORIES = [
  { value: "seed", label: "Seeds" },
  { value: "labor", label: "Labor" },
  { value: "irrigation", label: "Irrigation" },
  { value: "fertilizer", label: "Fertilizer & Manure" },
  { value: "equipment", label: "Equipment" },
  { value: "transport", label: "Transportation" },
  { value: "processing", label: "Processing & Milling" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "customer_exp", label: "Customer Experience" },
  { value: "technology", label: "Technology & CCTV" },
  { value: "admin", label: "Admin & Office" },
  { value: "feeding_families", label: "Feeding Families Donation" },
  { value: "other", label: "Other" },
] as const;

/**
 * Maps each granular expense category to a budget bucket.
 *
 * The expense list stays detailed (seeds vs labor vs irrigation is
 * useful for actually running a farm) while the budget tracks the nine
 * higher-level allocations. Without this mapping the budget page could
 * never show real spend against most categories.
 *
 * `feeding_families` is deliberately absent: FFF is funded from the
 * \u20b91,000/plot earmark taken off revenue BEFORE the budget is
 * allocated, so counting a donation against a budget bucket would
 * double-count it. Those expenses are excluded from budget spend.
 */
export const EXPENSE_TO_BUDGET: Record<string, string> = {
  seed: "farming",
  labor: "farming",
  irrigation: "farming",
  fertilizer: "farming",
  equipment: "farming",
  processing: "processing",
  transport: "delivery",
  customer_exp: "customer_exp",
  technology: "technology",
  marketing: "marketing",
  admin: "operations",
  other: "operations",
};

export const harvestOptions = [
  {
    id: "home-delivery",
    title: "Deliver to My Home",
    tagline: "Raw Harvest",
    description:
      "We deliver your harvest straight to your doorstep, exactly as it came off your plot — all at once, or split into monthly installments if you'd rather receive it gradually. Packed in 15 kg, 30 kg or 50 kg bags.",
    note: "Typically reaches you 2–3 weeks after harvest, depending on your location. Delivery charges are billed separately based on distance.",
  },
  {
    id: "processed",
    title: "Process & Deliver",
    tagline: "Flour / Oil",
    description:
      "We process your harvest into flour or oil — for example, wheat milled into fresh atta — then deliver it to you, either as a single delivery or in monthly installments. Packed in the same 15 kg, 30 kg or 50 kg bags.",
    note: "Typically reaches you 2–3 weeks after harvest, depending on your location. Processing is done in small batches per crop.",
  },
  {
    id: "sell-to-market",
    title: "Sell to the Market",
    tagline: "We Handle the Sale",
    description:
      "We sell your harvest to the market on your behalf and send the proceeds to you.",
    note: "Amount depends on prevailing market rates at the time of sale — not guaranteed in advance.",
  },
];

export const demoFaqs = [
  {
    q: "What crop is being grown this season?",
    a: "Gehu (wheat) — currently the only crop we're growing at Mera Khet. Sowing begins near Diwali and the season runs through the Rabi (winter) months.",
  },
  {
    q: "What wheat variety do you grow?",
    a: "RAJ 1482 — a variety developed at the Rajasthan Agricultural Research Institute, Durgapura, specifically for local soil and climate. It's recognized among Indian wheat researchers for its grain quality, and is a variety millers and households specifically seek out for roti and chapati making, not just a general-purpose wheat. Since we mill it into whole wheat atta with the bran and germ intact, it also retains more fiber, iron, and B-vitamins than refined flour.",
  },
  {
    q: "How do you know what's right for your soil?",
    a: "We've sent samples from our fields for laboratory soil testing. Until those results come back, this season's wheat is RAJ 1482 — a variety developed at Durgapura specifically for Rajasthan's soil and climate, so it's a well-matched choice for this region rather than a guess. Once the lab results arrive, they'll guide our crop and nutrient decisions with data about our specific land, and we'll share what we learn with members.",
  },
  {
    q: "Is the farm organic?",
    a: "Not yet, and we won't claim otherwise. Fertilizer is applied based on soil testing and each crop's actual needs — not indiscriminate use. This is our first season, and we're actively working toward certified organic farming, which we're aiming to reach next season. We'll update this the moment certification is achieved.",
  },
  {
    q: "What are my options for the harvest?",
    a: "You can choose to (1) have us deliver the raw harvest to your home (delivery charges not included), (2) have us process it into flour — wheat milled into fresh atta — and deliver that to you, or (3) have us sell it to the market on your behalf and send you the proceeds. For either delivery option, you can also choose to receive it in monthly installments of a custom size (e.g. 40 kg/month) instead of all at once — set this from your dashboard's Harvest Preference.",
  },
  {
    q: "What do I receive with my membership?",
    a: "A dedicated allocation of farm plots within Mera Khet (1, 3, or 6 plots), wheat cultivation with soil-tested, responsible fertilizer management by our team, 24×7 CCTV access to your plots, regular farm updates, crop-cycle tracking, and eligibility to visit the farm.",
  },
  {
    q: "What plan sizes are available?",
    a: "Three seasonal plans, each made up of 7,260 sq ft plots: Kothi — 1 Plot (~0.167 acre, 250–300 kg wheat, ₹20,000/season — Feed Your Family), Annakosh — 3 Plots (~0.5 acre, 750–900 kg wheat, ₹50,000/season — Stock Up for the Year), and Mahabhandar — 6 Plots (exactly 1 acre, 1,500–1,800 kg wheat, ₹100,000/season — Farm a Full Acre). All plans include the same set of benefits.",
  },
  {
    q: "How much does a membership cost?",
    a: "₹20,000 per season for Kothi (1 Plot), ₹50,000 for Annakosh (3 Plots), or ₹1,00,000 for Mahabhandar (6 Plots / 1 acre). These are current season prices and may be adjusted by Mera Khet over time.",
  },
  {
    q: "Are annual memberships available?",
    a: "Not currently — only seasonal plans are offered. Your membership covers one full crop season (this season: Gehu/wheat, sown near Diwali through harvest).",
  },
  {
    q: "Is the wheat amount guaranteed?",
    a: "No — the wheat figures shown for each plan (250–300 kg, 750–900 kg, or 1,500–1,800 kg) are estimated targets based on typical yields per plot, not guarantees. Actual harvest depends on weather, soil conditions, pests, and other natural factors.",
  },
  {
    q: "Is my plot legally owned by me?",
    a: "No. Your membership gives you a contractual allocation and participation in a designated farm area under the terms of your membership agreement — it does not transfer legal ownership of agricultural land unless explicitly stated in that agreement.",
  },
  {
    q: "Where is the farm located?",
    a: "Sujangarh, Rajasthan, India. An exact plot map is shared with members after allocation; we don't publish a private residential address.",
  },
  {
    q: "Can I choose my crop?",
    a: "Not at the moment — Mera Khet is growing a single crop (Gehu/wheat) this season. We may introduce other seasonal crops in future seasons.",
  },
  {
    q: "How does the CCTV work?",
    a: "Each plot is covered by one or more field cameras. We're rolling out live streaming to member dashboards — until it's fully live for your plot, you'll see recent photos there instead, clearly labeled as such rather than presented as a live feed. Camera infrastructure is managed by our team; credentials are never exposed to customers.",
  },
  {
    q: "Can I watch the farm anytime?",
    a: "Your dashboard is accessible 24×7, and shows a recent photo from your plot's camera whenever you check it. Full live video streaming is being rolled out — we'll update this as it becomes available for your plot.",
  },
  {
    q: "Can I visit my farm?",
    a: "Yes, subject to prior scheduling, farm conditions, safety requirements and operational availability. Requests can be raised from your dashboard — your exact plot number is shown there, so you'll know precisely which plots are yours when you visit.",
  },
  {
    q: "What happens if the crop fails?",
    a: "Agriculture is seasonal and subject to weather, soil, pests, water availability and other natural factors. We do not guarantee yield or returns — our team follows agronomic best practices to manage risk, and any crop-loss handling is governed by your membership agreement.",
  },
  {
    q: "How long is the membership?",
    a: "One full seasonal cycle — this season runs from sowing near Diwali through the wheat harvest in spring. There is no annual commitment; you can join again each new season.",
  },
  {
    q: "Have you run previous seasons?",
    a: "No — this is Mera Khet's first season. We're not going to show you photos of a harvest that didn't happen. What we can offer instead: full operational transparency from day one — camera access, farm updates, and a real dashboard tracking your specific plots — so you can see the season unfold as it actually happens, rather than take our word for a past one. Early members are effectively founding members of Mera Khet.",
  },
  {
    q: "Is my share taken from my own specific plots?",
    a: "Not exactly — and this works in your favour. At harvest, the whole farm's wheat is brought together and divided equally across every plot, so a 1-plot member receives one share, a 3-plot member three, and so on. Your plots are genuinely yours to follow, visit and watch all season. But when it comes to the harvest itself, nobody is left carrying a weaker patch of the field alone, and nobody quietly benefits at someone else's expense. One farm, one season, shared fairly. Full details are in our Membership Agreement.",
  },
  {
    q: "What happens after harvest?",
    a: "Your crop is harvested and weighed at the field, and your confirmed total is recorded against your membership. It's then quality-checked before moving to whichever option you've chosen: home delivery, processing into flour, or sale to market with proceeds sent to you. Every delivery is logged on your dashboard with date and quantity, with a running progress bar against your confirmed total — so you can see exactly what's been delivered and what's remaining.",
  },
  {
    q: "How will I know when my delivery is coming?",
    a: "You'll be notified on WhatsApp and your dashboard once your harvest total is confirmed, and again each time a delivery is logged. Exact timing depends on your chosen fulfillment method and delivery logistics, but you'll always be notified as it happens, not left to check in and ask.",
  },
  {
    q: "How long after harvest will I receive my wheat, and how is it packed?",
    a: "Typically 2–3 weeks after harvest, depending on your location. It's packed in 15 kg, 30 kg or 50 kg bags — so if you've chosen monthly installments, you can pick a bag size that suits how much you use. Delivery charges depend on distance and are billed separately from your membership.",
  },
  {
    q: "Where is my wheat kept between harvest and delivery?",
    a: "In our own {WAREHOUSE_TONNES}-tonne storage warehouse at the farm. It isn't left in the field or handed over to a third-party facility while it waits. This also means you can choose monthly installments without worrying about where the rest of your harvest is sitting — it stays with us, at the farm, until it's dispatched to you.",
  },
  {
    q: "How is my harvest weighed and verified?",
    a: "Your harvest is weighed at the field once it's brought in, and that confirmed total — not the earlier estimate — becomes the number your delivery progress is tracked against on your dashboard. If you're delivering in monthly installments, each individual delivery is also logged separately with its own date and weight, so the full record stays visible to you throughout, not just a single final number.",
  },
  {
    q: "Can I renew my membership?",
    a: "Yes — since plans are seasonal, you can renew for the next season from the Membership section of your dashboard once this season concludes.",
  },
  {
    q: "What is the Feeding Families Fund?",
    a: "₹1,000 from every plot's price — not an extra charge on top — is earmarked toward donating wheat to families in need. It comes out of the price you already see, so a 3-plot Annakosh membership sets aside ₹3,000, and a 6-plot Mahabhandar sets aside ₹6,000, funded from what you've already paid.",
  },
  {
    q: "Can I gift a farm membership?",
    a: "Yes — reach out to our team via the contact form and we'll help set up a gifted membership.",
  },
  {
    q: "How are farm updates provided?",
    a: "Our field team publishes periodic updates — photos, notes and crop-stage changes — directly to your dashboard timeline.",
  },
];
