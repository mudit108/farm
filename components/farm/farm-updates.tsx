import { Reveal } from "@/components/ui/reveal";
import { demoUpdates } from "@/lib/demo-data";

export function FarmUpdates() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Farm Updates
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Following plot A-024 this season.
          </h2>
        </Reveal>

        <div className="mt-12 space-y-0">
          {demoUpdates.map((u, i) => (
            <Reveal key={u.date} delay={i * 70}>
              <div className="relative flex gap-6 border-l border-[var(--color-ink)]/10 pb-10 pl-6 last:pb-0">
                <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-green)]" />
                <div>
                  <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                    {u.date}
                  </p>
                  <h3 className="mt-1 font-display text-lg">{u.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {u.description}
                  </p>
                  <p className="mt-2 text-xs italic text-[var(--color-brown)]">{u.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
