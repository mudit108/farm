import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { demoUpdates } from "@/lib/demo-data";

export default function UpdatesPage() {
  return (
    <div>
      <PageHeader title="Farm Updates" subtitle="Photos, notes, and crop-stage changes from our field team." />

      <div className="space-y-4 p-6 sm:px-10">
        {demoUpdates
          .slice()
          .reverse()
          .map((u) => (
            <Card key={u.date} className="p-5">
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                {u.date}
              </p>
              <p className="mt-1 font-display text-lg">{u.title}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{u.description}</p>
              <p className="mt-2 text-xs italic text-[var(--color-brown)]">{u.note}</p>
            </Card>
          ))}
      </div>
    </div>
  );
}
