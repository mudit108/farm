import { Reveal } from "@/components/ui/reveal";
import { createAnonClient } from "@/lib/supabase/anon";

type Update = { id: string; title: string; description: string; created_at: string };

async function getUpdates(): Promise<Update[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("khet_club_updates")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Failed to load khet_club_updates:", error.message);
    return [];
  }
  return (data ?? []) as Update[];
}

export async function FarmUpdates() {
  const updates = await getUpdates();
  if (updates.length === 0) return null;

  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal>
          <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--color-brown)]">
            Farm Updates
          </p>
          <h2 className="mt-3 font-display text-[1.75rem] leading-[1.15] tracking-tight sm:text-5xl sm:leading-tight">
            Following the season, together.
          </h2>
        </Reveal>

        <div className="mt-12 space-y-0">
          {updates.map((u, i) => (
            <Reveal key={u.id} delay={i * 70}>
              <div className="relative flex gap-6 border-l border-[var(--color-ink)]/10 pb-10 pl-6 last:pb-0">
                <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-green)]" />
                <div>
                  <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                    {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <h3 className="mt-1 font-display text-lg">{u.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {u.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
