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

export default async function HelpPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const season = await getSeason();
  let visits: Visit[] = [];
  if (user) {
    const { data } = await supabase
      .from("khet_club_farm_visits")
      .select("id, preferred_date, visitors, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    visits = (data ?? []) as Visit[];
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
        </Card>
      </div>
    </div>
  );
}
