"use client";

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminResizeFarm, type ResizeFarmResult } from "@/app/actions/admin-content";

const initialState: ResizeFarmResult = { status: "idle" };

export function ResizeFarmForm({ currentTotal, filledCount }: { currentTotal: number; filledCount: number }) {
  const [state, formAction, isPending] = useActionState(adminResizeFarm, initialState);
  const [newTotal, setNewTotal] = useState(String(currentTotal));
  const [confirming, setConfirming] = useState(false);

  const parsed = Number(newTotal);
  const isShrink = Number.isFinite(parsed) && parsed < currentTotal;

  return (
    <div>
      <p className="text-sm">
        Currently <span className="font-semibold">{currentTotal}</span> total plots,{" "}
        <span className="font-semibold">{filledCount}</span> claimed.
      </p>

      <form
        action={formAction}
        className="mt-3 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          if (isShrink && !confirming) {
            e.preventDefault();
            setConfirming(true);
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">New total</span>
          <input
            name="newTotal"
            type="number"
            min={1}
            value={newTotal}
            onChange={(e) => {
              setNewTotal(e.target.value);
              setConfirming(false);
            }}
            className="input w-28"
          />
        </label>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Updating…" : isShrink ? "Shrink Farm" : "Update Total"}
        </Button>
      </form>

      {isShrink && confirming && (
        <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-live)]/30 bg-[var(--color-live)]/5 p-3 text-xs text-[var(--color-live)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This removes plots #{parsed + 1}–#{currentTotal} permanently. It will be refused if any of
            them are already claimed. Click &quot;Shrink Farm&quot; again to confirm.
          </span>
        </div>
      )}

      {state.status === "success" && (
        <p className="mt-3 text-sm text-[var(--color-green-deep)]">
          {state.plotsAdded > 0 && `Added ${state.plotsAdded} plot(s). `}
          {state.plotsRemoved > 0 && `Removed ${state.plotsRemoved} plot(s). `}
          Now {state.newTotal} total plots.
        </p>
      )}
      {state.status === "error" && <p className="mt-3 text-sm text-[var(--color-live)]">{state.message}</p>}
    </div>
  );
}
