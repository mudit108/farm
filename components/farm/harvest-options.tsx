import Image from "next/image";
import { Truck, Droplets, TrendingUp, Scale, CheckCircle2, Package, LayoutDashboard } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { harvestOptions } from "@/lib/demo-data";
import harvestPhoto from "@/public/images/farmer-harvesting-combine.jpg";

const icons = { "home-delivery": Truck, processed: Droplets, "sell-to-market": TrendingUp };

const processSteps = [
  { icon: Scale, title: "Weighed & confirmed", body: "Your harvest is weighed at the field and your confirmed total is recorded against your membership." },
  { icon: CheckCircle2, title: "Quality checked", body: "Checked before it moves to delivery, processing, or market sale — whichever you've chosen." },
  { icon: Package, title: "Your choice applied", body: "Delivered raw, milled into flour, or sold to market on your behalf — one delivery or monthly installments." },
  { icon: LayoutDashboard, title: "Tracked on your dashboard", body: "Every delivery is logged with date and quantity, with a running progress bar against your confirmed total." },
];

export function HarvestOptions() {
  return (
    <section id="harvest" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
              Your Harvest
            </p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Your harvest, your choice.
            </h2>
            <p className="mt-4 max-w-md text-[var(--color-ink-soft)]">
              When your crop is ready, choose how you&apos;d like to receive
              it — every crop grown 100% organic.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10">
              <Image
                src={harvestPhoto}
                alt="A farmer harvesting wheat by hand as a combine harvester works the field behind"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="mt-14 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] p-6 sm:p-8">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
              What Happens After Harvest
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-green-soft)]">
                    <step.icon className="h-4 w-4 text-[var(--color-green-deep)]" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">
                    {i + 1}. {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-soft)]">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {harvestOptions.map((opt, i) => {
            const Icon = icons[opt.id as keyof typeof icons];
            return (
              <Reveal key={opt.id} delay={i * 80}>
                <Card className="flex h-full flex-col p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-green-soft)]">
                    <Icon className="h-5 w-5 text-[var(--color-green-deep)]" />
                  </div>
                  <p className="mt-4 font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
                    {opt.tagline}
                  </p>
                  <h3 className="mt-1 font-display text-xl">{opt.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {opt.description}
                  </p>
                  {opt.id !== "sell-to-market" && (
                    <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-green-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-green-deep)]">
                      📅 One-time or monthly installments
                    </p>
                  )}
                  <p className="mt-4 border-t border-[var(--color-ink)]/10 pt-3 text-xs text-[var(--color-ink-soft)]">
                    {opt.note}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
