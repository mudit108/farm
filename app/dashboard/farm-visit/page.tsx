import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { FarmVisitForm } from "@/components/dashboard/farm-visit-form";
import { SupportForm } from "@/components/dashboard/support-form";
import { createSessionClient } from "@/lib/supabase/session";
import { getSeason } from "@/lib/public-data";
import { addDays, todayInIndia } from "@/lib/demo-data";
import { whatsappHref } from "@/components/site/footer";

export const dynamic = "force-dynamic";

type Visit = {
  id: string;
  preferred_date: string;
  visitors: number;
  status: string;
  created_at: string;
};

type SupportMsg = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  admin_reply: string | null;
  replied_at: string | null;
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function HelpPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const season = await getSeason();
  let visits: Visit[] = [];
  let supportMessages: SupportMsg[] = [];
  if (user) {
    const { data } = await supabase
      .from("khet_club_farm_visits")
      .select("id, preferred_date, visitors, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    visits = (data ?? []) as Visit[];
    const { data: supportData } = await supabase
      .from("khet_club_support_messages")
      .select("id, subject, message, status, created_at, admin_reply, replied_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    supportMessages = (supportData ?? []) as SupportMsg[];
  }

  return (
    <div>
      <PageHeader title="Visits & Support" subtitle="Request a farm visit or reach our support team." />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-2">
        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Request a Farm Visit
          </p>
          <p className="mt-1 mb-4 text-sm text-[var(--color-ink-soft)]">
            Subject to scheduling and farm conditions.
          </p>
          <FarmVisitForm
            minDate={addDays(todayInIndia(), 1)}
            defaultPhone={(user?.user_metadata?.phone as string) ?? ""}
          />

          {visits.length > 0 && (
            <div className="mt-6 border-t border-[var(--color-ink)]/10 pt-5">
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                Your Requests
              </p>
              <div className="mt-3 space-y-3">
                {visits.map((v) => (
                  <div key={v.id} className="flex items-center justify-between border-b border-[var(--color-ink)]/10 pb-3 text-sm last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">
                        {new Date(v.preferred_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">{v.visitors} visitor{v.visitors > 1 ? "s" : ""}</p>
                    </div>
                    <Badge tone={v.status === "requested" ? "gold" : v.status === "approved" || v.status === "completed" ? "green" : "brown"}>
                      {v.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Contact Support
          </p>
          <p className="mt-1 mb-4 text-sm text-[var(--color-ink-soft)]">
            Reach our team about your farm or membership.
          </p>
          <SupportForm whatsappUrl={whatsappHref(season?.contact_phone ?? null, "Hi, I'm a Mera Khet member and have a question.")} />

          {supportMessages.length > 0 && (
            <div className="mt-6 border-t border-[var(--color-ink)]/10 pt-5">
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Your Messages</p>
              <div className="mt-3 space-y-3">
                {supportMessages.map((m) => (
                  <div key={m.id} className="rounded-[var(--radius-sm)] border border-[var(--color-ink)]/10 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{m.subject}</p>
                        <p className="text-xs text-[var(--color-ink-soft)]">{fmtDateTime(m.created_at)}</p>
                      </div>
                      <Badge tone={m.admin_reply ? "green" : "gold"}>{m.admin_reply ? "Replied" : "Waiting for reply"}</Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-[var(--color-ink-soft)]">{m.message}</p>
                    {m.admin_reply && (
                      <div className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-2.5">
                        <p className="text-xs font-medium text-[var(--color-green-deep)]">
                          Mera Khet team{m.replied_at ? ` · ${fmtDateTime(m.replied_at)}` : ""}
                        </p>
                        <p className="mt-1 whitespace-pre-line">{m.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
