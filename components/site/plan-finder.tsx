"use client";

import { useState } from "react";

type Plan = { id: string; name: string; plots: number; priceInr: number; wheatMinKg: number; wheatMaxKg: number };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Cheapest mix of plans that covers `plots` plots (largest plans first — they're cheaper per plot). */
function recommend(plots: number, plans: Plan[]) {
  const sorted = [...plans].sort((a, b) => b.plots - a.plots);
  let left = plots;
  let price = 0;
  const parts: string[] = [];
  for (const p of sorted) {
    const n = Math.floor(left / p.plots);
    if (n > 0) {
      parts.push(`${n > 1 ? `${n} × ` : ""}${p.name}`);
      price += n * p.priceInr;
      left -= n * p.plots;
    }
  }
  return { name: parts.join(" + "), price };
}

/** "Start from your kitchen" — monthly wheat use → recommended plots and price, using live prices. */
export function PlanFinder({ plans }: { plans: Plan[] }) {
  const [kg, setKg] = useState(20);
  const single = plans.find((p) => p.plots === 1) ?? plans[0];
  const three = plans.find((p) => p.plots === 3);
  const six = plans.find((p) => p.plots === 6);
  const perPlotMid = (single.wheatMinKg + single.wheatMaxKg) / 2;

  const annual = kg * 12;
  const plots = Math.max(1, Math.ceil(annual / perPlotMid));
  const rec = recommend(plots, plans);
  let tip = "";
  if (plots === 2 && three && three.priceInr > rec.price) tip = `For ${inr(three.priceInr - rec.price)} more, Annakosh gives you a third plot.`;
  if (plots === 5 && six && six.priceInr > rec.price) tip = `For ${inr(six.priceInr - rec.price)} more, Mahabhandar gives you a sixth plot — a full acre.`;

  return (
    <div className="card finder fade d3">
      <div>
        <label htmlFor="kg">Wheat your home uses per month</label>
        <p className="finder-help">A rough guess is fine. Check your last few atta purchases if you&apos;re unsure.</p>
        <p className="finder-val">
          {kg}
          <span>kg / month</span>
        </p>
        <input className="range" type="range" id="kg" min={10} max={150} step={5} value={kg} onChange={(e) => setKg(Number(e.target.value))} />
        <div className="range-ends">
          <span>10 kg</span>
          <span>150 kg</span>
        </div>
      </div>
      <div className="finder-out" aria-live="polite">
        <p className="fo-label">
          About {annual.toLocaleString("en-IN")} kg a year · {plots === 1 ? "1 plot" : `${plots} plots`}
        </p>
        <p className="fo-rec">{rec.name}</p>
        <p className="fo-price">{inr(rec.price)} for the season</p>
        <p className="fo-line">
          That&apos;s {(plots * single.wheatMinKg).toLocaleString("en-IN")}–{(plots * single.wheatMaxKg).toLocaleString("en-IN")} kg of wheat, estimated.
          Anything you won&apos;t use can be sold to the market on your behalf.
        </p>
        {tip && <p className="fo-tip">{tip}</p>}
      </div>
    </div>
  );
}
