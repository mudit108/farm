import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAnonClient } from "@/lib/supabase/anon";
import { Nav } from "@/components/farm/nav";
import { Footer } from "@/components/farm/contact-and-footer";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { getCurrentMember } from "@/lib/current-member";
import { currentCrop, harvestOptions, membershipPlans } from "@/lib/demo-data";
import fieldPhoto from "@/public/images/wheat-field-green.jpg";

export const dynamic = "force-dynamic";

/**
 * First page of the homepage restructure: the homepage had grown to 16
 * stacked sections, so the deep "how the season actually works" content
 * lives here instead of competing for space above the fold.
 *
 * Nothing was deleted in the move — the homepage keeps a short version
 * of the four steps that links here, so someone who only scrolls still
 * gets the complete argument.
 */
export const metadata: Metadata = {
  title: "How It Works | Mera Khet — Farm Plot Membership in Rajasthan",
  description:
    "Reserve a plot, we farm it, and the harvest comes home to you. A step-by-step look at the full season at Mera Khet — from sowing near Diwali through harvest and delivery.",
  alternates: { canonical: "/how-it-works" },
};

type SeasonInfo = {
  season_label: string;
  current_stage: string;
  sowing_date: string | null;
  estimated_harvest: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

async function getSeason(): Promise<SeasonInfo | null> {
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("khet_club_get_season");
  return (data as SeasonInfo[] | null)?.[0] ?? null;
}

const steps = [
  {
    n: "01",
    title: "Choose your plots",
    body: "Pick the plan that fits how much wheat your household actually uses — 1, 3, or 6 plots. It's a single payment for the season, not a subscription.",
    detail: "A plot is 7,260 sq ft of real farmland. Six plots is a full acre.",
  },
  {
    n: "02",
    title: "Get your plot allocation",
    body: "Let us assign the next available plots, or choose your exact plot numbers yourself from the live map.",
    detail: "Your plot numbers are yours for the whole season and appear on your certificate.",
  },
  {
    n: "03",
    title: "We farm it",
    body: "Our team handles everything — field preparation, sowing, irrigation, and care through the season. You don't need any farming knowledge or to visit at all.",
    detail: "Fertiliser is applied based on soil testing and what the crop actually needs.",
  },
  {
    n: "04",
    title: "Watch it grow",
    body: "Follow the season from your dashboard: crop-stage updates as the field moves through each phase, plus camera access once sowing begins.",
    detail: "You're welcome to visit in person too — members can request a farm visit.",
  },
];

const harvestFlow = [
  { title: "Weighed & confirmed", body: "The farm's total harvest is weighed and your share is confirmed." },
  { title: "Quality checked", body: "Grain is checked before anything is stored or dispatched." },
  { title: "Stored on-site", body: "Kept in our own warehouse until you're ready — not sold on and bought back." },
  { title: "Your choice applied", body: "Delivered raw, milled into atta, or sold to market on your behalf." },
  { title: "Delivered", body: "Sent to you in 15, 30 or 50 kg bags — at once, or spread monthly." },
];

export default async function HowItWorksPage() {
  const [season, member] = await Promise.all([getSeason(), getCurrentMember()]);
  const seasonLabel = season?.season_label ?? "this season";
  const currentStage = season?.current_stage ?? null;

  return (
    <>
      <Nav isLoggedIn={member.isLoggedIn} firstName={member.firstName} />

      {/* Hero */}
      <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              How It Works
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-[2rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
              You reserve the plot. We farm it. The harvest comes home to you.
            </h1>
            <p className="mt-5 max-w-xl text-[var(--color-ink-soft)]">
              No farming experience needed, and no obligation to visit — though
              you&apos;re always welcome. Here&apos;s exactly what happens across
              a full season at Mera Khet.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The four steps */}
      <section className="border-b border-[var(--color-ink)]/10 py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-8">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 60}>
                  <div className="flex gap-5">
                    <span className="font-display text-2xl text-[var(--color-gold)]">{s.n}</span>
                    <div>
                      <h2 className="font-display text-xl text-[var(--color-ink)]">{s.title}</h2>
                      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{s.body}</p>
                      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{s.detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={120}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10">
                <Image
                  src={fieldPhoto}
                  alt="Young wheat growing in the field"
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Season timeline */}
      <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              The Season
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-4xl">
              {currentCrop.name} takes about {currentCrop.durationDays} days.
            </h2>
            <p className="mt-4 max-w-xl text-sm text-[var(--color-ink-soft)]">
              {currentCrop.localName} ({currentCrop.variety}), sown near Diwali and
              harvested in spring. Your dashboard shows which stage the field is in
              at any point — these are the phases it moves through.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {currentCrop.stages.map((stage, i) => {
                const isNow = currentStage?.toLowerCase() === stage.toLowerCase();
                return (
                  <li
                    key={stage}
                    className={`rounded-[var(--radius-sm)] border p-4 ${
                      isNow
                        ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
                        : "border-[var(--color-ink)]/10 bg-[var(--color-surface)]"
                    }`}
                  >
                    <span className="font-mono-data text-xs text-[var(--color-ink-soft)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-1 text-sm font-medium">{stage}</p>
                    {isNow && (
                      <p className="mt-1 font-mono-data text-[10px] uppercase tracking-wide text-[var(--color-brown)]">
                        Happening now
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Harvest */}
      <section id="harvest" className="scroll-mt-20 border-b border-[var(--color-ink)]/10 py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              Your Harvest
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-4xl">
              Then it comes home.
            </h2>
          </Reveal>

          <Reveal delay={60}>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {harvestFlow.map((h, i) => (
                <li key={h.title}>
                  <span className="font-display text-xl text-[var(--color-gold)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1 text-sm font-medium">{h.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{h.body}</p>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {harvestOptions.map((o) => (
                <div
                  key={o.id}
                  className="rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-surface)] p-5"
                >
                  <p className="font-display text-lg">{o.title}</p>
                  <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{o.description}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-8 rounded-[var(--radius-card)] bg-[var(--color-green-soft)] p-6">
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-green-deep)]">
                Everyone shares the season fairly
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">
                At harvest the whole farm&apos;s wheat is pooled and divided equally
                across every plot — so your share never depends on whether your
                particular corner of the field did better or worse than the rest.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <Reveal>
            <h2 className="font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-4xl">
              Ready to reserve a plot for {seasonLabel}?
            </h2>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              Plans start at ₹{membershipPlans[0].priceInr.toLocaleString("en-IN")} for
              the season.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/#pricing">
                <Button>See plans &amp; pricing</Button>
              </Link>
              <Link href="/#register">
                <Button variant="outline">View the live plot map</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer
        contactEmail={season?.contact_email ?? null}
        contactPhone={season?.contact_phone ?? null}
      />
    </>
  );
}
