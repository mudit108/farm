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
  if (user) {
    const [{ data: prefData }, { data: reqData }] = await Promise.all([
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
    ]);
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

      <div className="mt-4">
        <HarvestPreferenceForm currentPreference={pref} pendingRequest={pendingRequest} />
      </div>
    </Card>
  );
}
