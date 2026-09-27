import type { Metadata } from "next";
import { CalendarDays, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/card";
import { Panel } from "@/components/dashboard/ui";
import { FarmVisitForm } from "@/components/dashboard/farm-visit-form";
import { SupportForm } from "@/components/dashboard/support-form";
import { createSessionClient } from "@/lib/supabase/session";
import { getSeason } from "@/lib/public-data";
import { addDays, todayInIndia } from "@/lib/demo-data";
import { whatsappHref } from "@/components/site/footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Visits & Support | Mera Khet", robots: { index: false } };

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
      <PageHeader eyebrow="We're here to help" title="Visits & Support" subtitle="Come and stand in your field, or ask us anything." />

      <div className="mk-page-pad grid gap-6 lg:grid-cols-2">
        <Panel icon={CalendarDays} label="Request a farm visit">
          <p className="mk-muted mb-4">Subject to scheduling and farm conditions.</p>
          <FarmVisitForm minDate={addDays(todayInIndia(), 1)} defaultPhone={(user?.user_metadata?.phone as string) ?? ""} />

          {visits.length > 0 && (
            <div className="mk-subsection">
              <h3 className="mk-subhead">Your requests</h3>
              <div className="mk-rows">
                {visits.map((v) => (
                  <div key={v.id} className="mk-row">
                    <div className="mk-row-main">
                      <p className="font-semibold text-[var(--color-ink)]">
                        {new Date(v.preferred_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                      </p>
                      <p className="mk-muted">
                        {v.visitors} visitor{v.visitors > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge tone={v.status === "requested" ? "gold" : v.status === "approved" || v.status === "completed" ? "green" : "brown"}>{v.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel icon={MessageCircle} label="Contact support">
          <p className="mk-muted mb-4">Reach our team about your farm or membership — a real person reads every message.</p>
          <SupportForm whatsappUrl={whatsappHref(season?.contact_phone ?? null, "Hi, I'm a Mera Khet member and have a question.")} />

          {supportMessages.length > 0 && (
            <div className="mk-subsection">
              <h3 className="mk-subhead">Your messages</h3>
              <div className="space-y-4">
                {supportMessages.map((m) => (
                  <div key={m.id} className="mk-thread">
                    <div className="mk-thread-head">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-ink)]">{m.subject}</p>
                        <p className="mk-muted">{fmtDateTime(m.created_at)}</p>
                      </div>
                      <Badge tone={m.admin_reply ? "green" : "gold"}>{m.admin_reply ? "Replied" : "Waiting for reply"}</Badge>
                    </div>
                    <p className="mk-bubble mk-bubble-me">{m.message}</p>
                    {m.admin_reply && (
                      <div className="mk-bubble mk-bubble-team">
                        <p className="mk-bubble-from">Mera Khet team{m.replied_at ? ` · ${fmtDateTime(m.replied_at)}` : ""}</p>
                        <p>{m.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
