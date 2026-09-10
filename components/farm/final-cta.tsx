import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { WheatIcon } from "@/components/farm/illustrations/wheat-icon";

const inclusions = [
  "Your own numbered plot(s), pick or auto-assign",
  "Soil-tested, responsible fertilizer use",
  "Camera access + updates all season",
  "Your harvest delivered, milled, or sold",
];

export function FinalCta({
  fromPriceInr,
  remaining,
  deadline,
}: {
  fromPriceInr: number;
  remaining: number;
  deadline: string | null;
}) {
  const deadlineLabel = deadline
    ? new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <section className="bg-[var(--color-green-deep)] py-16 text-center text-[var(--color-bg)] sm:py-32">
      <div className="mx-auto max-w-2xl px-5">
        <Reveal>
          <WheatIcon color="var(--color-gold)" className="mx-auto h-12 w-12" />
          <h2 className="mt-4 font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
            Your farm is waiting.
          </h2>

          <p className="mt-4 text-[var(--color-bg)]/70">
            From <strong className="text-[var(--color-bg)]">&#8377;{fromPriceInr.toLocaleString("en-IN")}</strong> for the
            full season &mdash; one payment, no renewals, nothing recurring.
          </p>

          <ul className="mx-auto mt-8 grid max-w-md gap-2 text-left sm:grid-cols-2">
            {inclusions.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-bg)]/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gold)]" />
                {item}
              </li>
            ))}
          </ul>

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

          <p className="mt-6 text-xs text-[var(--color-bg)]/50">
            {remaining > 0 ? `${remaining} plots still available` : "All plots reserved for this season"}
            {deadlineLabel && ` \u00b7 Registration closes ${deadlineLabel}`}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
