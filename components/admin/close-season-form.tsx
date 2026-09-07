"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminCloseSeason, type CloseSeasonResult } from "@/app/actions/admin-content";

const initialState: CloseSeasonResult = { status: "idle" };

export function CloseSeasonForm({
  currentLabel,
  filledPlots,
}: {
  currentLabel: string;
  filledPlots: number;
}) {
  const [state, formAction, isPending] = useActionState(adminCloseSeason, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-4 text-sm text-[var(--color-green-deep)]">
        <p className="font-medium">Season closed.</p>
        <p className="mt-1">
          {state.plotsFreed} plot{state.plotsFreed === 1 ? "" : "s"} freed,{" "}
          {state.membersArchived} member{state.membersArchived === 1 ? "" : "s"} archived.
          Now running: <strong>{state.newLabel}</strong>.
        </p>
        <p className="mt-2 text-xs">
          Past certificates and receipts are untouched and still downloadable
          by those members.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-live)]/30 bg-[var(--color-live)]/5 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-live)]" />
        <div className="text-xs text-[var(--color-ink-soft)]">
          <p className="font-medium text-[var(--color-ink)]">
            This frees all {filledPlots} filled plots for a new season.
          </p>
          <p className="mt-1">
            Members lose their current plot assignment and would need to
            purchase again for the new season. Their certificates,
            receipts and payment history are <strong>not</strong> deleted —
            those stay downloadable permanently.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Type the current season name to confirm
          </span>
          <input
            name="confirmLabel"
            required
            placeholder={currentLabel}
            className="input"
            autoComplete="off"
          />
          <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
            Exactly: <code>{currentLabel}</code>
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">New season name</span>
          <input
            name="newSeasonLabel"
            required
            placeholder="e.g. Wheat Season 2027-28"
            className="input"
            autoComplete="off"
          />
        </label>

        {state.status === "error" && (
          <p className="text-sm text-[var(--color-live)]">{state.message}</p>
        )}

        <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
          {isPending ? "Closing season…" : "Close Season & Start New"}
        </Button>
      </form>
    </div>
  );
}
