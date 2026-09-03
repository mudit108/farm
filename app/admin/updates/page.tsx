import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import { adminPublishUpdate, adminDeleteUpdate } from "@/app/actions/admin-content";

export const dynamic = "force-dynamic";

type Update = { id: string; title: string; description: string; created_at: string };

export default async function UpdateManagementPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("khet_club_updates")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false });
  const updates = (data ?? []) as Update[];

  return (
    <div>
      <PageHeader title="Farm Updates" subtitle="Publish an update — it appears on every customer's dashboard immediately." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          <form action={adminPublishUpdate} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Title</span>
              <input name="title" required className="input" placeholder="Groundnut entering flowering stage" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Description</span>
              <textarea name="description" rows={3} className="input" />
            </label>
            <Button type="submit" className="w-full">Publish Update</Button>
          </form>
        </Card>

        <div className="mt-6 space-y-3">
          {updates.map((u) => (
            <Card key={u.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <p className="mt-1 font-medium">{u.title}</p>
                {u.description && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{u.description}</p>}
              </div>
              <form action={adminDeleteUpdate}>
                <input type="hidden" name="id" value={u.id} />
                <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Delete</button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
