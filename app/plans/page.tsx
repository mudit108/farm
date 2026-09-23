import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { PageHero, SectionHead } from "@/components/site/heads";
import { Rule, Section } from "@/components/site/motion";
import { PlanFinder } from "@/components/site/plan-finder";
import { IncludesList, PlanCards, PlotMapGrid, PlotMapLegend } from "@/components/site/blocks";
import { getCurrentMember } from "@/lib/current-member";
import { getPlanCards, getPlotCounts, getSeason } from "@/lib/public-data";
import { INSTALLMENT_DUE_DAYS, installmentFeeInr, planIncludes } from "@/lib/demo-data";
import { inr } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plans & Pricing | Mera Khet — 1, 3 or 6 Wheat Plots in Rajasthan",
  description:
    "Kothi, Annakosh and Mahabhandar: one season, three sizes, the same benefits. Live prices, a plan finder, the 50-50 split payment option and the live plot map.",
  alternates: { canonical: "/plans" },
};

export default async function PlansPage() {
  const [plans, counts, member, season] = await Promise.all([getPlanCards(), getPlotCounts(), getCurrentMember(), getSeason()]);
  const open = Math.max(counts.total - counts.filled, 0);
  const reserveHref = member.isLoggedIn ? "/dashboard/select-plot" : "/auth/signup";
  const finderPlans = plans.map(({ id, name, plots, priceInr, wheatMinKg, wheatMaxKg }) => ({ id, name, plots, priceInr, wheatMinKg, wheatMaxKg }));

  return (
    <SiteFrame>
      <PageHero
        crumb="Plans & Pricing"
        lines={["One season.", "Three sizes."]}
        lead="Every plan includes exactly the same benefits — the only difference is how much land, and how much wheat. A single payment for the season, or two halves if you prefer. Never a subscription."
        jumps={[
          { href: "#plans", label: "The three plans" },
          { href: "#finder", label: "Which size fits?" },
          { href: "#includes", label: "What's included" },
          { href: "#split", label: "Pay in two parts" },
          { href: "#map", label: "Pick your plot" },
        ]}
      />

      <Section id="plans" className="section" style={{ paddingTop: 30 }}>
        <div className="mk-wrap">
          <PlanCards detailed />
        </div>
      </Section>

      <Section id="finder" className="section" style={{ paddingTop: 0 }}>
        <div className="mk-wrap">
          <SectionHead
            center
            num="01 — Which Size Fits?"
            title={["Start from your kitchen."]}
            lead="Tell us roughly how much wheat or atta your home goes through in a month, and we'll show you the plots that would cover a year."
          />
          <PlanFinder plans={finderPlans} />
          <p className="incl-note fade d5">Yield figures are estimated targets, not guarantees — weather, soil and pests all play a part.</p>
        </div>
      </Section>

      <Rule />

      <Section id="includes" className="section">
        <div className="mk-wrap">
          <SectionHead center num="02 — What's Included" title={[`${planIncludes.length} things,`, "on every plan."]} />
          <IncludesList items={planIncludes} />
          <p className="incl-note fade d6">*Camera access depends on connectivity at the farm.</p>
        </div>
      </Section>

      <Rule />

      <Section id="split" className="section">
        <div className="mk-wrap">
          <div className="split">
            <div className="split-copy">
              <SectionHead num="03 — Pay in Two Parts" title={["Half now.", `Half in ${INSTALLMENT_DUE_DAYS} days.`]} style={{ marginBottom: 0 }} />
              <p className="fade d4">
                Pay 50% to reserve and your plots are locked immediately — exactly as if you&apos;d paid in full. The remaining 50% is due{" "}
                {INSTALLMENT_DUE_DAYS} days later. Available on all three plans; choose it at checkout.
              </p>
              <div className="split-flow fade d5">
                <div className="sf-box">
                  <b>50%</b>
                  <span>Today · plots locked</span>
                </div>
                <div className="sf-arrow" />
                <div className="sf-box">
                  <b>50%</b>
                  <span>Day {INSTALLMENT_DUE_DAYS} · balance</span>
                </div>
              </div>
            </div>
            <div className="card split-table fade d3">
              <div className="st-row head">
                <span>Plan</span>
                <span>Today</span>
                <span>Day {INSTALLMENT_DUE_DAYS}</span>
              </div>
              {plans.map((p) => {
                const half = Math.round(p.priceInr / 2);
                return (
                  <div className="st-row" key={p.id}>
                    <span className="st-name">{p.name}</span>
                    <span>
                      {inr(half)}
                      <span className="fee">+ {inr(installmentFeeInr(p.id))} convenience fee</span>
                    </span>
                    <span>{inr(p.priceInr - half)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="map" className="section">
        <div className="mk-wrap">
          <div className="map-wrap">
            <div>
              <SectionHead
                num="04 — Pick Your Plot"
                title={["Choose your", "plot numbers."]}
                lead="Let us assign the next available plots, or pick your exact numbers from the live map when you reserve. They're yours all season, and printed on your certificate."
                style={{ marginBottom: 0 }}
              />
              <PlotMapLegend />
            </div>
            <PlotMapGrid />
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="fine" className="section">
        <div className="mk-wrap">
          <SectionHead center num="05 — The Fine Print" title={["Said plainly, up front."]} />
          <div className="fine">
            <div className="card fine-card fade d1">
              <h3>Estimates, not guarantees</h3>
              <p>The wheat figures for each plan are targets based on typical yields. The actual harvest depends on weather, soil, pests and other natural factors.</p>
            </div>
            <div className="card fine-card fade d3">
              <h3>Not land ownership</h3>
              <p>
                Membership is a contractual allocation of designated plots for the season. It doesn&apos;t transfer legal ownership of agricultural land unless
                your <Link href="/membership-agreement">agreement</Link> explicitly says so.
              </p>
            </div>
            <div className="card fine-card fade d5">
              <h3>Cancellation</h3>
              <p>
                A 50% refund applies if you cancel more than 14 days before the season&apos;s sowing date. Within 14 days of sowing, or after it begins,
                it&apos;s non-refundable. <Link href="/refund-policy">Full policy</Link>.
              </p>
            </div>
          </div>
          <p className="incl-note fade d6">
            The Feeding Families Fund amount is set aside from the price shown, not charged on top. Final pricing is confirmed at checkout.
          </p>
        </div>
      </Section>

      <Section className="section cta" style={{ paddingTop: 10 }}>
        <div className="mk-wrap">
          <h2>
            <span className="line">
              <span>{counts.total > 0 ? (open > 0 ? `${open} plots left this season.` : "Every plot is reserved.") : "Reserve your plot."}</span>
            </span>
          </h2>
          <p className="fade d4">{open > 0 || counts.total === 0 ? "Reserve now, or ask us anything first." : "Join the waitlist by getting in touch — we'll let you know when the next season opens."}</p>
          <div className="hero-actions fade d5">
            {season?.registrations_paused ? (
              <Link href="/#contact" className="btn btn-primary">
                <span>Bookings paused — contact us</span>
              </Link>
            ) : (
              <Link href={reserveHref} className="btn btn-primary">
                <span>{member.isLoggedIn ? "Choose your plots" : "Reserve your plot"}</span>
              </Link>
            )}
            <Link href="/faq" className="btn btn-ghost">
              <span>Read the FAQ</span>
            </Link>
          </div>
        </div>
      </Section>
    </SiteFrame>
  );
}
