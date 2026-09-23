import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { PageHero, SectionHead } from "@/components/site/heads";
import { InView, Rule, Section } from "@/components/site/motion";
import { KernelToggle } from "@/components/site/kernel-toggle";
import { getLowestPrice, getSeason } from "@/lib/public-data";
import { currentCrop, membershipPlans, wheatComparisonRows } from "@/lib/demo-data";
import { inr } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Wheat | Mera Khet — RAJ 1482, Soil-Tested, Milled Whole",
  description:
    "What's actually in your atta: RAJ 1482 wheat bred for Rajasthan, soil-tested fertiliser use, milled whole with bran and germ intact — and an honest answer on organic.",
  alternates: { canonical: "/our-wheat" },
};

export default async function OurWheatPage() {
  const [fromPrice, season] = await Promise.all([getLowestPrice(), getSeason()]);
  const tonnes = season?.warehouse_capacity_tonnes ?? 30;
  const rows = wheatComparisonRows.map((r) => ({ ...r, known: r.known.replace(/\b30-tonne\b/, `${tonnes}-tonne`) }));
  const kothi = membershipPlans[0];

  return (
    <SiteFrame>
      <PageHero
        crumb="Our Wheat"
        lines={["Wheat you can trace", "back to the field."]}
        lead="Most flour arrives with no story at all. Ours comes with a variety name, a soil test, a camera, and a warehouse you can visit. Here's what's actually in your atta."
        jumps={[
          { href: "#variety", label: "The variety" },
          { href: "#compare", label: "Compared honestly" },
          { href: "#milled", label: "Milled whole" },
          { href: "#honest", label: "Soil & organic" },
        ]}
      />

      <Section id="variety" className="section" style={{ paddingTop: 30 }}>
        <div className="mk-wrap">
          <div className="variety">
            <div className="variety-mark fade">
              <p className="vm-label">This season&apos;s seed</p>
              <p className="vm-big">{currentCrop.variety}</p>
              <p className="vm-sub">Developed at the Rajasthan Agricultural Research Institute, Durgapura — for this region&apos;s soil and climate.</p>
            </div>
            <div className="variety-copy">
              <SectionHead num="01 — The Variety" title={["Chosen for the roti,", "not just the yield."]} style={{ marginBottom: 26 }} />
              <p className="fade d4">
                {currentCrop.variety} is recognised among Indian wheat researchers for its grain quality rather than yield alone. It&apos;s a variety
                millers and households specifically seek out for soft, pliable chapatis — not a general-purpose wheat.
              </p>
              <p className="fade d5">We sow it near Diwali and grow it through the cooler Rabi months, which suit Sujangarh&apos;s soil and winter climate.</p>
            </div>
          </div>
          <div className="benefits">
            {currentCrop.varietyBenefits.map((b, i) => (
              <div key={b.title} className={`card benefit fade d${i + 1}`}>
                <p className="benefit-num">{String(i + 1).padStart(2, "0")}</p>
                <h3>{b.title}</h3>
                <p>{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="compare" className="section">
        <div className="mk-wrap">
          <SectionHead
            center
            num="02 — Compared Honestly"
            title={["Food should never", "be a mystery."]}
            lead="This isn't a claim that other wheat is bad. It's about what you can know — and what you usually can't."
          />
          <InView className="card compare fade d2">
            <div className="cmp-head">
              <span>The question</span>
              <span>Most wheat &amp; atta you buy</span>
              <span className="mk">Mera Khet</span>
            </div>
            {rows.map((r, i) => (
              <div key={r.label} className="cmp-row" style={{ transitionDelay: `${(0.15 + i * 0.07).toFixed(2)}s` }}>
                <span className="cmp-label">{r.label}</span>
                <span className="cmp-unknown">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" stroke="#9A9A88" strokeWidth="1.3" strokeDasharray="2 2" />
                  </svg>
                  {r.unknown}
                </span>
                <span className="cmp-known">
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                    <path d="M1 6L6 11L15 1" stroke="#B4872E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {r.known}
                </span>
              </div>
            ))}
          </InView>
        </div>
      </Section>

      <Rule />

      <Section id="milled" className="section">
        <div className="mk-wrap">
          <KernelToggle />
        </div>
      </Section>

      <Rule />

      <Section id="honest" className="section">
        <div className="mk-wrap">
          <SectionHead center num="04 — Soil & Organic" title={["What we do — and", "what we won't claim."]} />
          <div className="honest">
            <div className="card honest-card fade d2">
              <span className="honest-tag tag-yes">What we do</span>
              <h3>No shortcuts for yield.</h3>
              <p>
                We don&apos;t use harmful chemicals or anything else just to push the yield up. Fertiliser follows our soil test results — applied to the
                crop&apos;s actual need, not by routine or habit.
              </p>
              <p>
                Every member gets the farm&apos;s test results every month on their dashboard, so you can check what&apos;s going into the field yourself.
              </p>
            </div>
            <div className="card honest-card fade d4">
              <span className="honest-tag tag-notyet">Not yet</span>
              <h3>Is it organic?</h3>
              <p>
                Not yet, and we won&apos;t claim otherwise. For the next wheat season, we&apos;re planning to farm 100% organically.
              </p>
              <p>We&apos;ll only call it certified organic once we actually hold the certificate — not a day before.</p>
            </div>
          </div>
        </div>
      </Section>

      <Section className="section cta" style={{ paddingTop: 20 }}>
        <div className="mk-wrap">
          <h2>
            <span className="line">
              <span>Grow your own this season.</span>
            </span>
          </h2>
          <p className="fade d4">
            From {inr(fromPrice)} for a plot that yields up to {kothi.wheatMaxKg} kg of {currentCrop.variety}.
          </p>
          <div className="hero-actions fade d5">
            <Link href="/plans" className="btn btn-primary">
              <span>See plans &amp; pricing</span>
            </Link>
            <Link href="/the-farm" className="btn btn-ghost">
              <span>See the farm</span>
            </Link>
          </div>
        </div>
      </Section>
    </SiteFrame>
  );
}
