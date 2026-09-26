import { Card } from "@/components/ui/card";
import { HarvestPreferenceForm } from "@/components/dashboard/harvest-preference-form";
import { createSessionClient } from "@/lib/supabase/session";

type Preference = {
  method: string;
  schedule: string;
  installment_kg: number | null;
};
type PendingRequest = {
  id: string;
  requested_method: string;
  requested_schedule: string;
  requested_installment_kg: number | null;
};

export async function HarvestPreference() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pref: Preference | null = null;
  let pendingRequest: PendingRequest | null = null;
  let lastRejected: { reviewed_at: string | null } | null = null;
  if (user) {
    const [{ data: prefData }, { data: reqData }, { data: lastReviewed }] = await Promise.all([
      supabase
        .from("khet_club_harvest_preferences")
        .select("method, schedule, installment_kg")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("khet_club_harvest_preference_requests")
        .select("id, requested_method, requested_schedule, requested_installment_kg")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle(),
      // The most recent decided request — if it was rejected, say so
      // instead of letting it silently disappear.
      supabase
        .from("khet_club_harvest_preference_requests")
        .select("status, reviewed_at")
        .eq("user_id", user.id)
        .neq("status", "pending")
        .order("reviewed_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (lastReviewed?.status === "rejected") lastRejected = { reviewed_at: lastReviewed.reviewed_at };
    pref = prefData as Preference | null;
    pendingRequest = reqData as PendingRequest | null;
  }

  return (
    <Card className="p-6">
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
        Harvest Preference
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        {pref
          ? "Your harvest preference is locked in — changes go through admin review."
          : "Choose how you'd like to receive your harvest — including whether it's all at once or split into monthly deliveries."}
      </p>

      {lastRejected && !pendingRequest && (
        <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-ink)]/5 p-3 text-xs text-[var(--color-ink-soft)]">
          Your last change request
          {lastRejected.reviewed_at
            ? ` (reviewed ${new Date(lastRejected.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })})`
            : ""}{" "}
          wasn&apos;t approved, so your preference below is unchanged. Message us from Visits &amp; Support if you&apos;d like to talk it
          through.
        </p>
      )}

      <div className="mt-4">
        <HarvestPreferenceForm currentPreference={pref} pendingRequest={pendingRequest} />
      </div>
    </Card>
  );
}
