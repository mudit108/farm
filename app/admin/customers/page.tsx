import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import { adminAddDocument, adminDeleteDocument } from "@/app/actions/admin-content";
import { membershipPlans, harvestOptions } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = createServiceClient();

  const [{ data: usersData }, { data: plotsData }, { data: docsData }, { data: prefsData }] = await Promise.all([
    supabase.auth.admin.listUsers(),
    supabase.from("khet_club_plots").select("plot_number, user_id, plan_id").not("user_id", "is", null),
    supabase.from("khet_club_documents").select("id, name, file_url, user_id, created_at").order("created_at", { ascending: false }),
    supabase.from("khet_club_harvest_preferences").select("user_id, method, schedule, installment_kg"),
  ]);

  const users = usersData?.users ?? [];
  const plotsByUser = new Map<string, { plot_number: number; plan_id: string | null }[]>();
  for (const p of plotsData ?? []) {
    if (!p.user_id) continue;
    const list = plotsByUser.get(p.user_id) ?? [];
    list.push({ plot_number: p.plot_number, plan_id: p.plan_id });
    plotsByUser.set(p.user_id, list);
  }
  const prefsByUser = new Map((prefsData ?? []).map((p) => [p.user_id, p]));

  const docs = docsData ?? [];

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${users.length} registered account${users.length === 1 ? "" : "s"}.`} />

      <div className="p-6 sm:px-10">
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Confirmed</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Plots</th>
                <th className="px-5 py-3 font-medium">Harvest Preference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {users.map((u) => {
                const plots = plotsByUser.get(u.id) ?? [];
                const plan = plots[0] ? membershipPlans.find((p) => p.id === plots[0].plan_id) : null;
                const pref = prefsByUser.get(u.id);
                const prefOption = pref ? harvestOptions.find((o) => o.id === pref.method) : null;
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium">{(u.user_metadata?.full_name as string) || "—"}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-soft)]">{u.email}</td>
                    <td className="px-5 py-3">
                      <Badge tone={u.email_confirmed_at ? "green" : "brown"}>
                        {u.email_confirmed_at ? "confirmed" : "pending"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">{plan ? `${plan.name} (${plan.label})` : "—"}</td>
                    <td className="px-5 py-3 font-mono-data">
                      {plots.length ? plots.map((p) => `#${p.plot_number}`).join(", ") : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {prefOption ? (
                        <>
                          {prefOption.title}
                          {pref!.schedule === "monthly" && (
                            <span className="ml-1 text-xs text-[var(--color-brown)]">
                              (~{pref!.installment_kg} kg/mo)
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-[var(--color-ink-soft)]">
                    No customers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Documents management */}
        <Card className="mt-6 p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Documents
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Add a document link for a specific customer (by email), or leave
            email blank for a shared document everyone can see.
          </p>
          <form action={adminAddDocument} className="mt-4 grid gap-3 sm:grid-cols-4">
            <input name="name" required placeholder="Document name" className="input sm:col-span-1" />
            <input name="fileUrl" required placeholder="File URL" className="input sm:col-span-1" />
            <input name="email" placeholder="Customer email (optional)" className="input sm:col-span-1" />
            <Button type="submit" size="sm" className="sm:col-span-1">
              Add Document
            </Button>
          </form>

          {docs.length > 0 && (
            <div className="mt-4 divide-y divide-[var(--color-ink)]/10">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {d.user_id ? "Customer-specific" : "Shared"} ·{" "}
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="underline">
                        {d.file_url}
                      </a>
                    </p>
                  </div>
                  <form action={adminDeleteDocument}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Remove</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
