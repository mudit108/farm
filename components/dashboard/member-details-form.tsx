"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveMemberDetails, type MemberDetailsState } from "@/app/actions/member-details";

export type MemberDetails = {
  delivery_time_pref: string | null;
  delivery_days_note: string | null;
  delivery_instructions: string | null;
  payout_upi: string | null;
  payout_account_name: string | null;
  payout_account_number: string | null;
  payout_ifsc: string | null;
};

const initial: MemberDetailsState = { status: "idle" };

export function MemberDetailsForm({ details, method }: { details: MemberDetails | null; method: string | null }) {
  const [state, action, pending] = useActionState(saveMemberDetails, initial);
  const selling = method === "sell-to-market";

  return (
    <form action={action} className="space-y-5">
      {!selling && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Delivery preferences</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--color-ink-soft)]">Best time to deliver</span>
              <select name="deliveryTimePref" defaultValue={details?.delivery_time_pref ?? "any"} className="input">
                <option value="any">Any time</option>
                <option value="morning">Morning (8am–12pm)</option>
                <option value="afternoon">Afternoon (12–4pm)</option>
                <option value="evening">Evening (4–8pm)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--color-ink-soft)]">Preferred days (optional)</span>
              <input name="deliveryDaysNote" defaultValue={details?.delivery_days_note ?? ""} placeholder="e.g. weekends only" className="input" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--color-ink-soft)]">Instructions for the delivery person (optional)</span>
            <textarea
              name="deliveryInstructions"
              rows={2}
              defaultValue={details?.delivery_instructions ?? ""}
              placeholder="e.g. call on arrival, 2nd floor, leave with security"
              className="input"
            />
          </label>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Your delivery address is on the <a href="/dashboard/account" className="underline">Account</a> page.
          </p>
          {/* Keep any payout details already saved */}
          <input type="hidden" name="payoutUpi" value={details?.payout_upi ?? ""} />
          <input type="hidden" name="payoutAccountName" value={details?.payout_account_name ?? ""} />
          <input type="hidden" name="payoutAccountNumber" value={details?.payout_account_number ?? ""} />
          <input type="hidden" name="payoutIfsc" value={details?.payout_ifsc ?? ""} />
        </div>
      )}

      {selling && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Where should we send your sale money?</p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Give a UPI ID, or bank details — whichever is easier. Only our team can see these.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--color-ink-soft)]">UPI ID</span>
            <input name="payoutUpi" defaultValue={details?.payout_upi ?? ""} placeholder="name@okhdfcbank" className="input" autoComplete="off" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--color-ink-soft)]">Account holder name</span>
              <input name="payoutAccountName" defaultValue={details?.payout_account_name ?? ""} className="input" autoComplete="off" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--color-ink-soft)]">Account number</span>
              <input name="payoutAccountNumber" inputMode="numeric" defaultValue={details?.payout_account_number ?? ""} className="input" autoComplete="off" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--color-ink-soft)]">IFSC</span>
              <input name="payoutIfsc" defaultValue={details?.payout_ifsc ?? ""} placeholder="SBIN0001234" className="input uppercase" autoComplete="off" />
            </label>
          </div>
          {/* Keep any delivery preferences already saved */}
          <input type="hidden" name="deliveryTimePref" value={details?.delivery_time_pref ?? "any"} />
          <input type="hidden" name="deliveryDaysNote" value={details?.delivery_days_note ?? ""} />
          <input type="hidden" name="deliveryInstructions" value={details?.delivery_instructions ?? ""} />
        </div>
      )}

      {state.status === "error" && <p className="text-sm text-[var(--color-live)]">{state.message}</p>}
      {state.status === "success" && <p className="text-sm text-[var(--color-green-deep)]">Saved.</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
