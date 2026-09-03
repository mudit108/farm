import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import { adminSendWhatsAppIndividual, adminBroadcastWhatsApp } from "@/app/actions/admin-whatsapp";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  user_id: string | null;
  phone: string;
  message: string;
  kind: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

export default async function WhatsAppAdminPage() {
  const supabase = createServiceClient();

  const [{ data: usersData }, { data: plots }, { data: logData }] = await Promise.all([
    supabase.auth.admin.listUsers(),
    supabase.from("khet_club_plots").select("user_id").eq("status", "filled").not("user_id", "is", null),
    supabase
      .from("khet_club_whatsapp_messages")
      .select("id, user_id, phone, message, kind, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const memberCount = new Set((plots ?? []).map((p) => p.user_id)).size;
  const users = usersData?.users ?? [];
  const usersById = new Map(users.map((u) => [u.id, u]));
  const log = (logData ?? []) as LogRow[];
  const isConfigured = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID);

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="Send updates to individual members or broadcast to everyone this season." />

      <div className="p-6 sm:px-10">
        {!isConfigured && (
          <Card className="mb-6 border-[var(--color-live)]/30 bg-[var(--color-live)]/5 p-4">
            <p className="text-sm text-[var(--color-live)]">
              WhatsApp isn&apos;t configured yet — messages will be logged as
              failed until <code>WHATSAPP_PHONE_NUMBER_ID</code> and{" "}
              <code>WHATSAPP_ACCESS_TOKEN</code> are set. See the README.
            </p>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Broadcast to Everyone
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
              Sends to all {memberCount} current-season member{memberCount === 1 ? "" : "s"} (anyone with a filled plot).
            </p>
            <form action={adminBroadcastWhatsApp} className="mt-4 space-y-3">
              <textarea
                name="message"
                required
                rows={4}
                placeholder="e.g. Wheat sowing begins tomorrow morning — updates coming soon!"
                className="input"
              />
              <Button type="submit" className="w-full">
                Send to All {memberCount} Members
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Message an Individual
            </p>
            <form action={adminSendWhatsAppIndividual} className="mt-4 space-y-3">
              <select name="userId" required defaultValue="" className="input">
                <option value="" disabled>
                  Choose a member
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.user_metadata?.full_name as string) || u.email} — {(u.user_metadata?.phone as string) || "no phone"}
                  </option>
                ))}
              </select>
              <textarea name="message" required rows={4} placeholder="Your message…" className="input" />
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </Card>
        </div>

        <Card className="mt-6 overflow-hidden p-0">
          <div className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
            <p className="text-sm font-medium">Recent Messages</p>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <tr>
                  <th className="px-4 py-3 font-medium">To</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/10">
                {log.map((row) => {
                  const user = row.user_id ? usersById.get(row.user_id) : null;
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-2.5">
                        {(user?.user_metadata?.full_name as string) || user?.email || row.phone || "—"}
                      </td>
                      <td className="px-4 py-2.5 capitalize">{row.kind}</td>
                      <td className="max-w-xs truncate px-4 py-2.5 text-[var(--color-ink-soft)]" title={row.message}>
                        {row.message}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={row.status === "sent" ? "green" : "brown"}>
                          {row.status === "failed" && row.error_message ? row.error_message : row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                        {new Date(row.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
                {log.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">
                      No messages sent yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
