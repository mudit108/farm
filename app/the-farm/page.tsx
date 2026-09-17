import type { Metadata } from "next";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon";
import { Nav } from "@/components/farm/nav";
import { Footer } from "@/components/farm/contact-and-footer";
import { FarmTransparency, type SeasonSnapshot } from "@/components/farm/farm-transparency";
import { FarmUpdates } from "@/components/farm/farm-updates";
import { VisitAndLocation } from "@/components/farm/visit-and-location";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { getCurrentMember } from "@/lib/current-member";
import { currentCrop } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

/**
 * Second page of the homepage restructure.
 *
 * The homepage had FIVE consecutive proof sections sitting between the
 * founder story and the price — roughly 560 lines of "here's why you
 * should believe us" before anyone saw what it costs. That's the real
 * problem the restructure is solving, not raw page length.
 *
 * These three belong together: they're all "here is the actual farm,
 * look at it yourself" — live camera and season data, what's happened
 * recently, and where the land physically is. Grouped here they read as
 * a coherent argument instead of three separate scroll obstacles.
 */
export const metadata: Metadata = {
  title: "The Farm | Mera Khet — Live Camera, Updates & Location",
  description:
    "See the actual farm in Sujangarh, Rajasthan: live camera access, current crop stage, recent farm updates, and how to visit in person. You don't have to take our word for it.",
  alternates: { canonical: "/the-farm" },
};

type SeasonInfo = {
  season_label: string;
  current_stage: string;
  progress: number;
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

export default async function TheFarmPage() {
  const [season, member] = await Promise.all([getSeason(), getCurrentMember()]);

  const seasonSnapshot: SeasonSnapshot | null = season
    ? {
        current_stage: season.current_stage,
        progress: season.progress,
        sowing_date: season.sowing_date,
        estimated_harvest: season.estimated_harvest,
      }
    : null;

  return (
    <>
      <Nav isLoggedIn={member.isLoggedIn} firstName={member.firstName} />

      <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              The Farm
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-[2rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
              You don&apos;t have to take our word for it.
            </h1>
            <p className="mt-5 max-w-xl text-[var(--color-ink-soft)]">
              Real land in Sujangarh, Rajasthan — with a camera on it, a season
              you can follow, and an open invitation to come and stand in the
              field yourself.
            </p>
          </Reveal>
        </div>
      </section>

      <FarmTransparency
        season={seasonSnapshot}
        cropName={`${currentCrop.name} (${currentCrop.localName})`}
      />
      <FarmUpdates />
      <VisitAndLocation />

      <section className="py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <Reveal>
            <h2 className="font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-4xl">
              Seen enough?
            </h2>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              Reserve a plot for {season?.season_label ?? "this season"} and follow
              it from sowing to harvest.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/#pricing">
                <Button>See plans &amp; pricing</Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="outline">How it works</Button>
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
