// Static site content — the current crop, plan sizes/pricing, harvest
// fulfillment options, and FAQ copy. Business config, not per-user data,
// so it's fine to keep as static config here rather than a DB table.

// Mera Khet currently grows a single crop per season. The upcoming
// season is Gehu (wheat), sown around Diwali.
export const currentCrop = {
  id: "gehu",
  name: "Gehu",
  localName: "Wheat",
  season: "Rabi — sowing begins near Diwali",
  description:
    "Our upcoming season crop. Wheat is sown just after Diwali and grown through the cooler Rabi months, well suited to Sandwa's soil and winter climate.",
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
    tagline: "Own an Entire Acre",
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
  "100% organic wheat cultivation for the season",
  "Farm management by our team",
  "24×7 CCTV access*",
  "Farm progress updates",
  "Crop cycle tracking",
  "Farm photos & videos",
  "Harvest updates",
  "Choice of harvest delivery, processing, or market sale",
  "Farm visit eligibility",
];

export const harvestOptions = [
  {
    id: "home-delivery",
    title: "Deliver to My Home",
    tagline: "Raw Harvest",
    description:
      "We deliver your harvest straight to your doorstep, exactly as it came off your plot — all at once, or split into monthly installments of a custom size (e.g. 40 kg/month) if you'd rather receive it gradually.",
    note: "Delivery charges are not included and are billed separately based on your location.",
  },
  {
    id: "processed",
    title: "Process & Deliver",
    tagline: "Flour / Oil",
    description:
      "We process your harvest into flour or oil — for example, wheat milled into fresh atta — then deliver it to you, either as a single delivery or in monthly installments of a custom size, just like raw harvest.",
    note: "Processing is done in small batches per crop; available conversions vary by crop (see each crop's processed product).",
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
    q: "Is the farm organic?",
    a: "Yes — everything grown at Mera Khet is 100% organic, with no synthetic pesticides or chemical fertilizers used on any plot.",
  },
  {
    q: "What are my options for the harvest?",
    a: "You can choose to (1) have us deliver the raw harvest to your home (delivery charges not included), (2) have us process it into flour — wheat milled into fresh atta — and deliver that to you, or (3) have us sell it to the market on your behalf and send you the proceeds. For either delivery option, you can also choose to receive it in monthly installments of a custom size (e.g. 40 kg/month) instead of all at once — set this from your dashboard's Harvest Preference.",
  },
  {
    q: "What do I receive with my membership?",
    a: "A dedicated allocation of farm plots within Mera Khet (1, 3, or 6 plots), 100% organic wheat cultivation managed by our team, 24×7 CCTV access to your plots, regular farm updates, crop-cycle tracking, and eligibility to visit the farm.",
  },
  {
    q: "What plan sizes are available?",
    a: "Three seasonal plans, each made up of 7,260 sq ft plots: Kothi — 1 Plot (~0.167 acre, 250–300 kg wheat, ₹20,000/season — Feed Your Family), Annakosh — 3 Plots (~0.5 acre, 750–900 kg wheat, ₹50,000/season — Stock Up for the Year), and Mahabhandar — 6 Plots (exactly 1 acre, 1,500–1,800 kg wheat, ₹100,000/season — Own an Entire Acre). All plans include the same set of benefits.",
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
    a: "Sandwa, Rajasthan, India. An exact plot map is shared with members after allocation; we don't publish a private residential address.",
  },
  {
    q: "Can I choose my crop?",
    a: "Not at the moment — Mera Khet is growing a single crop (Gehu/wheat) this season. We may introduce other seasonal crops in future seasons.",
  },
  {
    q: "How does the CCTV work?",
    a: "Each plot is covered by one or more field cameras streamed to your dashboard. Camera infrastructure is managed by our team; credentials are never exposed to customers.",
  },
  {
    q: "Can I watch the farm anytime?",
    a: "Yes — live camera access is available 24×7 through your dashboard, subject to normal connectivity and maintenance windows.",
  },
  {
    q: "Can I visit my farm?",
    a: "Yes, subject to prior scheduling, farm conditions, safety requirements and operational availability. Requests can be raised from your dashboard.",
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
    q: "What happens after harvest?",
    a: "You'll receive a harvest update on your dashboard, and can choose how you'd like to receive it: home delivery, processing into flour, or sale to the market with proceeds sent to you.",
  },
  {
    q: "Can I renew my membership?",
    a: "Yes — since plans are seasonal, you can renew for the next season from the Membership section of your dashboard once this season concludes.",
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
