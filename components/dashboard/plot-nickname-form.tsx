"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updatePlotNickname, type NicknameState } from "@/app/actions/plot-nickname";

const initialState: NicknameState = { status: "idle" };

export function PlotNicknameForm({ initialName }: { initialName: string }) {
  const [state, formAction, isPending] = useActionState(updatePlotNickname, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
          Give your plot(s) a name (optional)
        </span>
        <div className="flex gap-2">
          <input
            name="nickname"
            defaultValue={initialName}
            maxLength={60}
            placeholder="e.g. Sharma Family Farm"
            className="input flex-1"
          />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </label>
      {state.status === "error" && (
        <p className="text-xs text-[var(--color-live)]">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-xs text-[var(--color-green-deep)]">Saved.</p>
      )}
    </form>
  );
}
