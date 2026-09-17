import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import fieldPhoto from "@/public/images/wheat-field-green.jpg";

const steps = [
  {
    n: "01",
    title: "Choose Your Plots",
    body: "Select the seasonal plan that fits you — 1, 3, or 6 plots.",
  },
  {
    n: "02",
    title: "Get Your Plot Allocation",
    body: "Let us assign the next available plots, or pick the exact plot numbers you want from the live map.",
  },
  {
    n: "03",
    title: "We Farm It",
    body: "Our team manages cultivation according to the seasonal crop cycle.",
  },
  {
    n: "04",
    title: "Watch It Grow",
    body: "Track your farm through updates and 24×7 CCTV access.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <h2 className="max-w-lg font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
            From land to harvest.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="border-t-2 border-[var(--color-green)] pt-5">
                <p className="font-mono-data text-sm text-[var(--color-brown)]">{s.n}</p>
                <h3 className="mt-3 font-display text-xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-8">
            <Link
              href="/how-it-works"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-green-deep)] underline-offset-4 hover:underline"
            >
              See the full season, step by step
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mt-10 aspect-[21/9] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10">
            <Image
              src={fieldPhoto}
              alt="Young green wheat growing under a bright blue sky"
              fill
              sizes="(min-width: 1024px) 1100px, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
