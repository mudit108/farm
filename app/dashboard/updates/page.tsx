import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

type Update = { id: string; title: string; description: string; created_at: string };

export default async function UpdatesPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("khet_club_updates")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false });

  const updates = (data ?? []) as Update[];

  return (
    <div>
      <PageHeader title="Farm Updates" subtitle="Photos, notes, and crop-stage changes from our field team." />

      <div className="space-y-4 p-6 sm:px-10">
        {updates.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">No updates published yet.</p>
        )}
        {updates.map((u) => (
          <Card key={u.id} className="p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <p className="mt-1 font-display text-lg">{u.title}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{u.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
