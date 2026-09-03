"use client";

import { useActionState, useRef, useState } from "react";
import { Truck, Droplets, TrendingUp, Check, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { harvestOptions } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import {
  saveHarvestPreference,
  requestHarvestPreferenceChange,
  type HarvestPrefState,
} from "@/app/actions/harvest-preference";

const icons = { "home-delivery": Truck, processed: Droplets, "sell-to-market": TrendingUp };

const initialState: HarvestPrefState = { status: "idle" };

type Preference = { method: string; schedule: string; installment_kg: number | null };
type PendingRequest = {
  id: string;
  requested_method: string;
  requested_schedule: string;
  requested_installment_kg: number | null;
};

function describe(method: string, schedule: string, installmentKg: number | null) {
  const label = harvestOptions.find((o) => o.id === method)?.title ?? method;
  if (schedule === "monthly") return `${label} — ~${installmentKg} kg/month`;
  return `${label} — one-time`;
}

/** The method/schedule/kg picker, shared between first-time save and a change request. */
function PreferencePicker({
  action,
  initialMethod,
  initialSchedule,
  initialInstallmentKg,
  submitLabel,
  successMessage,
  confirmOneTime = false,
}: {
  action: (prev: HarvestPrefState, formData: FormData) => Promise<HarvestPrefState>;
  initialMethod: string;
  initialSchedule: string;
  initialInstallmentKg: number | null;
  submitLabel: string;
  successMessage: string;
  confirmOneTime?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [method, setMethod] = useState(initialMethod);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [installmentKg, setInstallmentKg] = useState(initialInstallmentKg ? String(initialInstallmentKg) : "");
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);

  const canSchedule = method === "home-delivery" || method === "processed";

  if (state.status === "success") {
    return <p className="text-sm text-[var(--color-green-deep)]">{successMessage}</p>;
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-5"
        onSubmit={(e) => {
          if (confirmOneTime && !confirmedRef.current) {
            e.preventDefault();
            setShowConfirm(true);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {harvestOptions.map((opt) => {
            const Icon = icons[opt.id as keyof typeof icons];
            const active = method === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMethod(opt.id)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-[var(--radius-sm)] border p-4 text-left transition-colors",
                  active
                    ? "border-[var(--color-green)] bg-[var(--color-green-soft)]"
                    : "border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/25"
                )}
              >
                {active && <Check className="absolute right-3 top-3 h-4 w-4 text-[var(--color-green-deep)]" />}
                <Icon className="h-5 w-5 text-[var(--color-green-deep)]" />
                <p className="text-sm font-medium">{opt.title}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{opt.tagline}</p>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="method" value={method} />

        <p className="text-xs text-[var(--color-ink-soft)]">{harvestOptions.find((o) => o.id === method)?.note}</p>

        {canSchedule && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-ink)]/10 p-4">
            <p className="text-sm font-medium">Delivery schedule</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSchedule("one-time")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  schedule === "one-time"
                    ? "bg-[var(--color-green)] text-white"
                    : "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/10"
                )}
              >
                One-time delivery
              </button>
              <button
                type="button"
                onClick={() => setSchedule("monthly")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  schedule === "monthly"
                    ? "bg-[var(--color-green)] text-white"
                    : "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/10"
                )}
              >
                Monthly installments
              </button>
            </div>
            <input type="hidden" name="schedule" value={schedule} />

            {schedule === "monthly" && (
              <div className="mt-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Amount per month (kg)</span>
                  <input
                    name="installmentKg"
                    type="number"
                    min={1}
                    step={1}
                    required
                    placeholder="e.g. 40"
                    value={installmentKg}
                    onChange={(e) => setInstallmentKg(e.target.value)}
                    className="input max-w-[160px]"
                  />
                </label>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  We&apos;ll split your total harvest into ~{installmentKg || "__"} kg{" "}
                  {method === "processed" ? "flour " : ""}deliveries each month until it&apos;s all
                  delivered. Custom sizes are fine — whatever works for your household.
                </p>
              </div>
            )}
          </div>
        )}

        {state.status === "error" && <p className="text-sm text-[var(--color-live)]">{state.message}</p>}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </form>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="harvest-pref-confirm-title"
        >
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--color-bg)] p-6 shadow-xl">
            <div className="flex items-center gap-2 text-[var(--color-brown)]">
              <AlertTriangle className="h-5 w-5" />
              <p id="harvest-pref-confirm-title" className="font-display text-lg text-[var(--color-ink)]">
                Confirm your choice
              </p>
            </div>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              You can only set this <span className="font-semibold text-[var(--color-ink)]">once</span>.
              After saving, any change will need to go through admin approval.
            </p>
            <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-3 text-sm font-medium text-[var(--color-green-deep)]">
              {describe(method, schedule, installmentKg ? Number(installmentKg) : null)}
            </div>
            <div className="mt-5 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                Go Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  confirmedRef.current = true;
                  setShowConfirm(false);
                  formRef.current?.requestSubmit();
                }}
              >
                Confirm & Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function HarvestPreferenceForm({
  currentPreference,
  pendingRequest,
}: {
  currentPreference: Preference | null;
  pendingRequest: PendingRequest | null;
}) {
  const [requestingChange, setRequestingChange] = useState(false);

  if (!currentPreference) {
    return (
      <PreferencePicker
        action={saveHarvestPreference}
        initialMethod="home-delivery"
        initialSchedule="one-time"
        initialInstallmentKg={null}
        submitLabel="Save Preference"
        successMessage="Preference saved."
        confirmOneTime
      />
    );
  }

  if (pendingRequest) {
    return (
      <div className="space-y-3">
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-3 text-sm text-[var(--color-green-deep)]">
          Current: {describe(currentPreference.method, currentPreference.schedule, currentPreference.installment_kg)}
        </div>
        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-brown)]/30 bg-[var(--color-brown-soft)] p-3 text-sm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brown)]" />
          <div>
            <p className="font-medium text-[var(--color-brown)]">Change request pending approval</p>
            <p className="mt-0.5 text-[var(--color-ink-soft)]">
              Requested:{" "}
              {describe(
                pendingRequest.requested_method,
                pendingRequest.requested_schedule,
                pendingRequest.requested_installment_kg
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!requestingChange) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-3 text-sm text-[var(--color-green-deep)]">
          <span className="flex items-center gap-2">
            <Badge tone="green">Locked In</Badge>
            {describe(currentPreference.method, currentPreference.schedule, currentPreference.installment_kg)}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRequestingChange(true)}>
          Request a Change
        </Button>
      </div>
    );
  }

  return (
    <PreferencePicker
      action={requestHarvestPreferenceChange}
      initialMethod={currentPreference.method}
      initialSchedule={currentPreference.schedule}
      initialInstallmentKg={currentPreference.installment_kg}
      submitLabel="Submit Change Request"
      successMessage="Change request submitted — it'll take effect once an admin approves it."
    />
  );
}
