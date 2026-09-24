import Image from "next/image";
import Link from "next/link";
import { Check } from "@/components/site/marks";
import { CountUp } from "@/components/site/motion";
import { getCurrentMember } from "@/lib/current-member";
import { getPlanCards, getPlotStatuses } from "@/lib/public-data";
import { FEEDING_FAMILIES_PER_PLOT, membershipPlans } from "@/lib/demo-data";
import { inr } from "@/lib/site-content";
import mainField from "@/public/images/cctv/cam-main-field.jpg";
import type { StaticImageData } from "next/image";

/* ------------------------------------------------------------------ */
/* Live plot map — straight from khet_club_all_plot_statuses           */
/* ------------------------------------------------------------------ */

export async function PlotMapGrid() {
  const [plots, member] = await Promise.all([getPlotStatuses(), getCurrentMember()]);
  const mine = new Set(member.plotNumbers);
  if (plots.length === 0) return <p className="map-empty">Plot data is temporarily unavailable — please check back shortly.</p>;
  return (
    <div className="map-grid" role="img" aria-label={`${plots.filter((p) => p.status === "filled").length} of ${plots.length} plots reserved`}>
      {plots.map((p, i) => (
        <div
          key={p.plot_number}
          className={["plot", p.status === "filled" && "taken", mine.has(p.plot_number) && "mine"].filter(Boolean).join(" ")}
          style={{ transitionDelay: `${((i % 10) * 0.03 + Math.floor(i / 10) * 0.055).toFixed(3)}s` }}
          title={`Plot ${p.plot_number} — ${mine.has(p.plot_number) ? "yours" : p.status === "filled" ? "reserved" : "available"}`}
        >
          {p.plot_number}
        </div>
      ))}
    </div>
  );
}

export async function PlotMapLegend() {
  const [plots, member] = await Promise.all([getPlotStatuses(), getCurrentMember()]);
  const filled = plots.filter((p) => p.status === "filled").length;
  const open = plots.length - filled;
  const myPlan = membershipPlans.find((p) => p.id === member.planId);
  return (
    <>
      <div className="map-legend fade d6">
        <div className="legend-row">
          <span className="legend-chip taken" />
          <span>
            <strong>{filled} reserved</strong> — allocated to members
          </span>
        </div>
        <div className="legend-row">
          <span className="legend-chip" />
          <span>
            <strong>{open} available</strong> — open this season
          </span>
        </div>
        {member.plotNumbers.length > 0 && (
          <div className="legend-row">
            <span className="legend-chip mine" />
            <span>
              <strong>Yours</strong> — highlighted in gold
            </span>
          </div>
        )}
      </div>
      {member.plotNumbers.length > 0 && (
        <div className="member-card fade d7">
          <p className="mc-label">{member.firstName ? `Welcome back, ${member.firstName}` : "Welcome back"}</p>
          <p className="mc-plots">
            {member.plotNumbers.length > 1 ? "Plots " : "Plot "}
            {member.plotNumbers.map((n) => `#${n}`).join(", ")}
          </p>
          {myPlan && (
            <p className="mc-sub">
              {myPlan.name} · {inr(member.plotNumbers.length * FEEDING_FAMILIES_PER_PLOT)} to the Feeding Families Fund
            </p>
          )}
          <div className="mc-actions">
            <Link href="/dashboard/my-farm">My Farm</Link>
            <Link href="/dashboard/select-plot">Add more plots</Link>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Plan cards — live prices from khet_club_plan_prices                 */
/* ------------------------------------------------------------------ */

const taglines: Record<string, string> = { "1-plot": "Feed your family", "3-plots": "Stock up for the year", "6-plots": "Farm a full acre" };

export async function PlanCards({ detailed = false }: { detailed?: boolean }) {
  const [plans, member] = await Promise.all([getPlanCards(), getCurrentMember()]);
  const href = member.isLoggedIn ? "/dashboard/select-plot" : "/auth/signup";
  return (
    <div className="plans-grid">
      {plans.map((p, i) => {
        const featured = p.id === "3-plots";
        return (
          <div key={p.id} className={`card plan-card${featured ? " featured" : ""} fade d${i * 2 + 1}`}>
            {featured && <span className="plan-badge">Most Chosen</span>}
            <p className="plan-name">{p.name}</p>
            {detailed ? (
              <>
                <p className="plan-tagline">{taglines[p.id]}</p>
                <p className="plan-price">
                  <CountUp to={p.priceInr} format="inr" delay={150 + i * 130} />
                  <span className="per"> / season</span>
                </p>
                <p className="per-plot">
                  {p.plots} {p.plots === 1 ? "plot" : "plots"} · {inr(p.perPlotInr)} per plot{p.savings > 0 && ` · save ${inr(p.savings)}`}
                </p>
                <div className="plan-stats" style={{ marginTop: 22 }}>
                  <div className="plan-stat">
                    <b>{p.areaSqFt.toLocaleString("en-IN")}</b>
                    <span>sq ft · {p.id === "6-plots" ? "exactly 1 acre" : p.approxAcre}</span>
                  </div>
                  <div className="plan-stat">
                    <b>
                      {p.wheatMinKg.toLocaleString("en-IN")}–{p.wheatMaxKg.toLocaleString("en-IN")}
                    </b>
                    <span>kg wheat, estimated</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="plan-sub">
                  {p.label} · {p.areaSqFt.toLocaleString("en-IN")} sq ft{p.id === "6-plots" ? " (1 acre)" : p.id === "3-plots" ? " (½ acre)" : ""}
                </p>
                <p className="plan-price">
                  <CountUp to={p.priceInr} format="inr" delay={150 + i * 130} />
                  <span className="per"> / season</span>
                </p>
                <p className="plan-save">
                  {p.wheatMinKg.toLocaleString("en-IN")}–{p.wheatMaxKg.toLocaleString("en-IN")} kg wheat (est.){p.savings > 0 && ` · save ${inr(p.savings)}`}
                </p>
              </>
            )}
            <ul className="plan-features">
              {!detailed && <li>Dedicated plot allocation</li>}
              {!detailed && <li>Live 24×7 camera from sowing</li>}
              <li>{inr(p.plots * FEEDING_FAMILIES_PER_PLOT)} to the Feeding Families Fund</li>
              {detailed ? <li>Everything in the list below</li> : <li>Milling &amp; packing included</li>}
            </ul>
            <Link href={href} className={`btn-plan${featured ? " btn-plan-featured" : ""}`}>
              <span>Reserve {p.name}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small shared sections                                               */
/* ------------------------------------------------------------------ */

const tickerItems = ["Sujangarh, Rajasthan", "RAJ 1482 Wheat", "24×7 Camera Coverage", "Soil-Tested Farming", "Milled Whole", "#MyMeraKhet"];

export function Ticker() {
  const set = (k: string) => (
    <div className="ticker-set" key={k} aria-hidden={k === "b" || undefined}>
      {tickerItems.map((t) => (
        <span className="ticker-item" key={t}>
          {t}
          <span className="tick-dot" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker">
      <div className="ticker-track">{[set("a"), set("b")]}</div>
    </div>
  );
}

export function FieldBand({
  caption = "The farm · Sujangarh, Rajasthan",
  photo = mainField,
  alt = "Drip irrigation lines across the main field at the Mera Khet farm",
  objectPosition = "center 58%",
}: {
  caption?: string;
  photo?: StaticImageData;
  alt?: string;
  objectPosition?: string;
}) {
  return (
    <div className="photo-slot band filled">
      <Image src={photo} alt={alt} fill sizes="100vw" placeholder="blur" style={{ objectPosition }} />
      <span className="band-cap">{caption}</span>
    </div>
  );
}

export function IncludesList({ items }: { items: string[] }) {
  return (
    <ul className="incl">
      {items.map((t, i) => (
        <li key={t} className="fade" style={{ transitionDelay: `${(0.05 + (i % 2) * 0.08 + Math.floor(i / 2) * 0.06).toFixed(2)}s` }}>
          <Check />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/* Harvest option illustrations (line art, no stock photos). */
export function HarvestIcon({ kind }: { kind: "raw" | "flour" | "market" }) {
  const s = { stroke: "#B4872E", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <div className="harvest-icon" aria-hidden="true">
      {kind === "raw" && (
        <svg width="84" height="96" viewBox="0 0 84 96">
          <path {...s} d="M22 30 C 14 50, 12 78, 18 88 L 66 88 C 72 78, 70 50, 62 30 Z" />
          <path {...s} d="M24 30 L 60 30 M 30 30 C 30 20, 38 16, 42 22 C 46 16, 54 20, 54 30" />
          <path {...s} d="M42 44 L 42 76 M 42 50 L 34 45 M 42 50 L 50 45 M 42 60 L 34 55 M 42 60 L 50 55 M 42 70 L 35 65 M 42 70 L 49 65" />
        </svg>
      )}
      {kind === "flour" && (
        <svg width="100" height="90" viewBox="0 0 100 90">
          <path {...s} d="M10 44 L 90 44 C 88 66, 72 80, 50 80 C 28 80, 12 66, 10 44 Z" />
          <path {...s} d="M20 44 C 26 30, 40 24, 50 24 C 60 24, 74 30, 80 44" />
          <path {...s} d="M40 30 C 44 26, 52 26, 56 30" opacity=".6" />
          <path {...s} d="M36 84 L 64 84" />
        </svg>
      )}
      {kind === "market" && (
        <svg width="96" height="90" viewBox="0 0 96 90">
          <path {...s} d="M12 34 L 84 34 L 78 18 L 18 18 Z" />
          <path {...s} d="M18 34 L 18 80 L 78 80 L 78 34" />
          <path {...s} d="M40 80 L 40 56 L 56 56 L 56 80" />
          <path {...s} d="M30 44 L 66 44" opacity=".6" />
        </svg>
      )}
    </div>
  );
}
