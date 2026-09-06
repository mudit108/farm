import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { WheatIcon } from "@/components/farm/illustrations/wheat-icon";

export function FinalCta() {
  return (
    <section className="bg-[var(--color-green-deep)] py-24 text-center text-[var(--color-bg)] sm:py-32">
      <div className="mx-auto max-w-2xl px-5">
        <Reveal>
          <WheatIcon color="var(--color-gold)" className="mx-auto h-12 w-12" />
          <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Your farm is waiting.
          </h2>
          <p className="mt-4 text-[var(--color-bg)]/70">
            Start your journey from a piece of land in Rajasthan to a
            harvest you can follow from anywhere.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                Reserve Your Plot
              </Button>
            </Link>
            <a href="#contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:border-white">
                Talk to Us
              </Button>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
