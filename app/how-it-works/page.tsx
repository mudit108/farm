import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { PageHero, SectionHead } from "@/components/site/heads";
import { InView, Rule, Section } from "@/components/site/motion";
import { Dot } from "@/components/site/marks";
import { SeasonTimeline } from "@/components/site/season-timeline";
import { getCurrentMember } from "@/lib/current-member";
import { getLowestPrice, getPlotCounts, getSeason } from "@/lib/public-data";
import { currentCrop, harvestOptions } from "@/lib/demo-data";
import { harvestFlow, inr } from "@/lib/site-content";
import cropArea from "@/public/images/cctv/cam-crop-area.jpg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How It Works | Mera Khet — Farm Plot Membership in Rajasthan",
  description:
    "Reserve a plot, we farm it, and the harvest comes home to you. A step-by-step look at the full season at Mera Khet — from sowing near Diwali through harvest and delivery.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  { title: "Choose your plots", body: "Pick the plan that fits how much wheat your household actually uses — 1, 3, or 6 plots. It's a single payment for the season, not a subscription.", detail: "A plot is 7,260 sq ft of real farmland. Six plots is a full acre." },
  { title: "Get your plot allocation", body: "Let us assign the next available plots, or choose your exact plot numbers yourself from the live map.", detail: "Your plot numbers are yours for the whole season and appear on your certificate." },
  { title: "We farm it", body: "Experienced farmers from our own village handle everything — field preparation, sowing, irrigation and care through the season. You don't need any farming knowledge, or to visit at all.", detail: "No harmful chemicals used to push yield. Fertiliser follows the soil tests, and you get the farm's test results every month." },
  { title: "Watch it grow", body: "Follow the season from your dashboard: crop-stage updates as the field moves through each phase, plus a live 24×7 camera once sowing begins.", detail: "You're welcome to visit in person too — members can request a farm visit." },
];

const optionTags: Record<string, string> = { "home-delivery": "Raw harvest", processed: "Atta · milled in-house", "sell-to-market": "We handle the sale" };

export default async function HowItWorksPage() {
  const [season, fromPrice, counts, member] = await Promise.all([getSeason(), getLowestPrice(), getPlotCounts(), getCurrentMember()]);
  const open = Math.max(counts.total - counts.filled, 0);
  const totalPlots = counts.total || 80;

  return (
    <SiteFrame>
      <PageHero
        crumb="How It Works"
        lines={["You reserve the plot.", "We farm it.", "The harvest comes home."]}
        lead="No farming experience needed, and no obligation to visit — though you're always welcome. Here is exactly what happens across a full season at Mera Khet, from the day you reserve to the day your wheat arrives."
        jumps={[
          { href: "#steps", label: "The four steps" },
          { href: "#season", label: `The ${currentCrop.durationDays}-day season` },
          { href: "#harvest", label: "After the harvest" },
          { href: "#fair", label: "How shares work" },
        ]}
      />

      <Section id="steps" className="section" style={{ paddingTop: 40 }}>
        <div className="mk-wrap">
          <div className="steps-wrap">
            <div className="photo-slot filled steps-photo fade">
              <Image src={cropArea} alt="Young crop in rows along drip irrigation lines, with the farm's water tank in the foreground" fill sizes="(min-width: 960px) 400px, 100vw" placeholder="blur" style={{ objectPosition: "30% center" }} />
              <span className="band-cap">Crop area · drip irrigation</span>
            </div>
            <div>
              <SectionHead num="01 — The Four Steps" title={["From reservation", "to your dashboard."]} style={{ marginBottom: 20 }} />
              {steps.map((s, i) => (
                <div key={s.title} className="step-row fade d2">
                  <span className="step-big">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p className="body">{s.body}</p>
                    <div className="step-detail">
                      <Dot />
                      <span>{s.detail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="season" className="section">
        <div className="mk-wrap">
          <SectionHead
            center
            num="02 — The Season"
            title={[`${currentCrop.name} takes about ${currentCrop.durationDays} days.`]}
            lead={`${currentCrop.variety} ${currentCrop.localName.toLowerCase()}, sown near Diwali and harvested in spring. Tap any stage to see what's happening in the field — and what you'll see from home.`}
          />
          <SeasonTimeline stages={currentCrop.stages} currentStage={season?.current_stage ?? null} />
        </div>
      </Section>

      <Rule />

      <Section id="harvest" className="section">
        <div className="mk-wrap">
          <SectionHead
            center
            num="03 — After the Harvest"
            title={["Then it comes home."]}
            lead="Nothing is sold on and bought back. Your share is weighed, checked, stored on our own land, and handled the way you chose."
          />
          <div className="process-row flow-row">
            <div className="process-line" />
            {harvestFlow.map((h, i) => (
              <div key={h.title} className={`step fade d${i + 1}`}>
                <div className="step-num">{i + 1}</div>
                <p className="step-title">{h.title}</p>
                <p className="step-text">{h.body}</p>
              </div>
            ))}
          </div>
          <div className="opts">
            {harvestOptions.map((o, i) => (
              <div key={o.id} className={`card opt-card fade d${i * 2 + 2}`}>
                <p className="opt-tag">{optionTags[o.id] ?? o.tagline}</p>
                <h3>{o.title}</h3>
                <p className="desc">{o.description}</p>
                <p className="opt-note">{o.note}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="fair" className="fair">
        <div className="mk-wrap">
          <div className="fair-inner fade">
            <div>
              <h2>
                <span className="line">
                  <span>Everyone shares the season fairly.</span>
                </span>
              </h2>
              <p>
                At harvest, the whole farm&apos;s wheat is pooled and divided equally across every plot. Your share never depends on whether your
                particular corner of the field did better or worse than the rest — a patch of poor soil or a heavy downpour on one side is carried by all{" "}
                {totalPlots} plots together, not by you alone. Your plot numbers are where you follow and visit the crop; your harvest is an equal share of
                the whole farm. If the crop is damaged or fails, everyone receives their share of whatever is harvested.
              </p>
            </div>
            <InView className="fair-viz">
              {Array.from({ length: totalPlots }, (_, i) => (
                <span key={i} className="fair-cell" style={{ transitionDelay: `${((i % 10) * 0.03 + Math.floor(i / 10) * 0.05).toFixed(3)}s` }} />
              ))}
              <p className="fair-cap">
                {totalPlots} plots · one pooled harvest · equal shares
              </p>
            </InView>
          </div>
        </div>
      </Section>

      <Section className="section cta" style={{ paddingTop: 20 }}>
        <div className="mk-wrap">
          <h2>
            <span className="line">
              <span>Ready to reserve a plot?</span>
            </span>
          </h2>
          <p className="fade d4">
            Plans start at {inr(fromPrice)} for the season{counts.total > 0 && ` · ${open} of ${counts.total} plots are still open`}.
          </p>
          <div className="hero-actions fade d5">
            <Link href="/plans" className="btn btn-primary">
              <span>See plans &amp; pricing</span>
            </Link>
            <Link href={member.isLoggedIn ? "/dashboard/select-plot" : "/plans#map"} className="btn btn-ghost">
              <span>View the live plot map</span>
            </Link>
          </div>
        </div>
      </Section>
    </SiteFrame>
  );
}
