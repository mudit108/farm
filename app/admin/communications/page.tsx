import { listAllUsers } from "@/lib/supabase/list-all-users";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionForm } from "@/components/admin/action-form";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { createServiceClient } from "@/lib/supabase/service";
import { adminPublishUpdate, adminDeleteUpdate, adminMarkContactMessage, adminResolveSupportMessage, adminReplySupportMessage } from "@/app/actions/admin-content";
import { isValidIndianMobile } from "@/lib/phone";
import { adminSendWhatsAppIndividual, adminBroadcastWhatsApp } from "@/app/actions/admin-whatsapp";

export const dynamic = "force-dynamic";

type Update = { id: string; title: string; description: string; created_at: string };
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
type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
};
type SupportMessage = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  admin_reply: string | null;
  replied_at: string | null;
};

export default async function CommunicationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = createServiceClient();

  const [{ data: updatesData }, { data: usersData }, { data: plots }, { data: logData }, { data: contactData }, { data: supportData }] = await Promise.all([
    supabase.from("khet_club_updates").select("id, title, description, created_at").order("created_at", { ascending: false }),
    listAllUsers(supabase),
    supabase.from("khet_club_plots").select("user_id").eq("status", "filled").not("user_id", "is", null),
    supabase
      .from("khet_club_whatsapp_messages")
      .select("id, user_id, phone, message, kind, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("khet_club_contact_messages")
      .select("id, name, phone, email, message, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("khet_club_support_messages")
      .select("id, user_id, subject, message, status, created_at, admin_reply, replied_at")
      .order("created_at", { ascending: false }),
  ]);

  const updates = (updatesData ?? []) as Update[];
  const users = usersData?.users ?? [];
  const usersById = new Map(users.map((u) => [u.id, u]));
  const memberCount = new Set((plots ?? []).map((p) => p.user_id)).size;
  const log = (logData ?? []) as LogRow[];
  const contactMessages = (contactData ?? []) as ContactMessage[];
  const newContactCount = contactMessages.filter((m) => m.status === "new").length;
  const supportMessages = (supportData ?? []) as SupportMessage[];
  const openSupportCount = supportMessages.filter((m) => m.status === "open").length;
  const isWhatsAppConfigured = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID);

  // Which members currently hold an unreachable phone number. Two ways
  // this happens: an invalid number that predates signup validation, or
  // a number that's valid in shape but whose sends keep failing.
  const failedByUser = new Map<string, number>();
  for (const row of log) {
    if (row.status === "failed" && row.user_id) {
      failedByUser.set(row.user_id, (failedByUser.get(row.user_id) ?? 0) + 1);
    }
  }
  const memberUserIds = new Set((plots ?? []).map((p) => p.user_id).filter(Boolean) as string[]);
  const unreachableMembers = users
    .filter((u) => memberUserIds.has(u.id))
    .map((u) => {
      const phone = (u.user_metadata?.phone as string) || "";
      return {
        id: u.id,
        name: (u.user_metadata?.full_name as string) || u.email || "Unknown",
        email: u.email ?? "",
        phone,
        invalidFormat: !isValidIndianMobile(phone),
        failedSends: failedByUser.get(u.id) ?? 0,
      };
    })
    .filter((m) => m.invalidFormat || m.failedSends > 0);

  const supportContent = (
    <div className="space-y-3 p-6 sm:px-10">
      {supportMessages.length === 0 && (
        <p className="text-sm text-[var(--color-ink-soft)]">No member support messages yet.</p>
      )}
      {supportMessages.map((m) => {
        const member = usersById.get(m.user_id);
        const name = (member?.user_metadata?.full_name as string) || member?.email || "Unknown member";
        return (
          <Card key={m.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{m.subject}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {name} · {member?.email ?? "—"} · {new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </p>
              </div>
              <Badge tone={m.status === "open" ? "gold" : "green"}>{m.status}</Badge>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
            {m.admin_reply ? (
              <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-3 text-sm">
                <p className="text-xs font-medium text-[var(--color-green-deep)]">
                  Your reply{m.replied_at ? ` · ${new Date(m.replied_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.admin_reply}</p>
              </div>
            ) : (
              <ActionForm action={adminReplySupportMessage} resetOnSuccess className="mt-3 space-y-2">
                <input type="hidden" name="id" value={m.id} />
                <textarea name="reply" rows={3} required placeholder="Write a reply — sent by email and WhatsApp, and shown in their dashboard" className="input" />
                <Button type="submit" size="sm">Send Reply</Button>
              </ActionForm>
            )}
            <div className="mt-3 flex gap-3 border-t border-[var(--color-ink)]/10 pt-3">
              {member?.email && (
                <a href={`mailto:${member.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="text-xs font-medium text-[var(--color-green)] hover:underline">
                  Reply by Email
                </a>
              )}
              {m.status === "open" && (
                <ActionForm action={adminResolveSupportMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-xs font-medium text-[var(--color-ink-soft)] hover:underline">Mark Resolved</button>
                </ActionForm>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );

  const contactContent = (
    <div className="space-y-3 p-6 sm:px-10">
      {contactMessages.length === 0 && (
        <p className="text-sm text-[var(--color-ink-soft)]">No contact form messages yet.</p>
      )}
      {contactMessages.map((m) => (
        <Card key={m.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {m.phone} · {m.email} · {new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
              </p>
            </div>
            <Badge tone={m.status === "new" ? "gold" : m.status === "replied" ? "green" : "brown"}>{m.status}</Badge>
          </div>
          <p className="mt-3 text-sm">{m.message}</p>
          <div className="mt-3 flex gap-3 border-t border-[var(--color-ink)]/10 pt-3">
            <a href={`mailto:${m.email}`} className="text-xs font-medium text-[var(--color-green)] hover:underline">
              Reply by Email
            </a>
            {m.status !== "replied" && (
              <ActionForm action={adminMarkContactMessage}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="status" value="replied" />
                <button className="text-xs font-medium text-[var(--color-ink-soft)] hover:underline">Mark Replied</button>
              </ActionForm>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  const updatesContent = (
    <div className="p-6 sm:px-10">
      <Card className="max-w-lg p-6">
        <ActionForm action={adminPublishUpdate} className="space-y-4" resetOnSuccess confirmMessage="Publish this update? It will also be sent to every current member on WhatsApp.">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Title</span>
            <input name="title" required className="input" placeholder="Groundnut entering flowering stage" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Description</span>
            <textarea name="description" rows={3} className="input" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Photo link (optional)</span>
            <input name="photoUrl" type="url" className="input" placeholder="https://… (a photo from the farm)" />
            <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">Shown with the update in every member&apos;s dashboard.</span>
          </label>
          <Button type="submit" className="w-full">Publish Update to All Members</Button>
        </ActionForm>
      </Card>
      <p className="mt-3 max-w-lg text-xs text-[var(--color-ink-soft)]">
        Publishing also broadcasts this update to every current-season member on WhatsApp automatically.
      </p>

      <div className="mt-6 space-y-3">
        {updates.map((u) => (
          <Card key={u.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
              </p>
              <p className="mt-1 font-medium">{u.title}</p>
              {u.description && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{u.description}</p>}
            </div>
            <ActionForm action={adminDeleteUpdate} confirmMessage="Delete this update? Members will no longer see it.">
              <input type="hidden" name="id" value={u.id} />
              <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Delete</button>
            </ActionForm>
          </Card>
        ))}
      </div>
    </div>
  );

  const whatsappContent = (
    <div className="p-6 sm:px-10">
      {!isWhatsAppConfigured && (
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
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Broadcast to Everyone</p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Sends to all {memberCount} current-season member{memberCount === 1 ? "" : "s"} (anyone with a filled plot).
          </p>
          <ActionForm action={adminBroadcastWhatsApp} className="mt-4 space-y-3" resetOnSuccess confirmMessage="Send this WhatsApp message to every current member now?">
            <textarea
              name="message"
              required
              rows={4}
              placeholder="e.g. Wheat sowing begins tomorrow morning — updates coming soon!"
              className="input"
            />
            <Button type="submit" className="w-full">Send to All {memberCount} Members</Button>
          </ActionForm>
        </Card>

        <Card className="p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Message an Individual</p>
          <ActionForm action={adminSendWhatsAppIndividual} className="mt-4 space-y-3">
            <select name="userId" required defaultValue="" className="input">
              <option value="" disabled>Choose a member</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {(u.user_metadata?.full_name as string) || u.email} — {(u.user_metadata?.phone as string) || "no phone"}
                </option>
              ))}
            </select>
            <textarea name="message" required rows={4} placeholder="Your message…" className="input" />
            <Button type="submit" className="w-full">Send Message</Button>
          </ActionForm>
        </Card>
      </div>

      {unreachableMembers.length > 0 && (
        <Card className="mt-6 border-[var(--color-live)]/30 bg-[var(--color-live)]/5 p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-live)]">
            {unreachableMembers.length} member{unreachableMembers.length > 1 ? "s" : ""} may not be receiving WhatsApp
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Either their number isn&apos;t a valid Indian mobile, or messages
            to it have failed. These members are silently missing farm
            updates — worth contacting them by email to get a correct number.
          </p>
          <div className="mt-4 space-y-2">
            {unreachableMembers.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-ink)]/10 pt-2 text-sm">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-xs">{m.phone || "(no number)"}</span>
                  {m.invalidFormat && <Badge tone="brown">invalid number</Badge>}
                  {m.failedSends > 0 && <Badge tone="brown">{m.failedSends} failed</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] px-5 py-3">
          <p className="text-sm font-medium">Recent Messages</p>
        </div>
        <div className="max-h-[480px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
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
                    <td className="px-4 py-2.5">{(user?.user_metadata?.full_name as string) || user?.email || row.phone || "—"}</td>
                    <td className="px-4 py-2.5 capitalize">{row.kind}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-[var(--color-ink-soft)]" title={row.message}>{row.message}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={row.status === "sent" ? "green" : "brown"}>
                        {row.status === "failed" && row.error_message ? row.error_message : row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">{new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                  </tr>
                );
              })}
              {log.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-soft)]">No messages sent yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Communications" subtitle="Farm updates, WhatsApp messaging, and inbound contact messages." />
      <Tabs
        defaultTab={tab}
        tabs={[
          { id: "support", label: `Member Support${openSupportCount > 0 ? ` (${openSupportCount})` : ""}`, content: supportContent },
          { id: "contact", label: `Contact Messages${newContactCount > 0 ? ` (${newContactCount})` : ""}`, content: contactContent },
          { id: "updates", label: "Farm Updates", content: updatesContent },
          { id: "whatsapp", label: "WhatsApp", content: whatsappContent },
        ]}
      />
    </div>
  );
}
