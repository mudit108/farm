"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitFarmVisit, type FarmVisitState } from "@/app/actions/farm-visit";

const initialState: FarmVisitState = { status: "idle" };

export function FarmVisitForm() {
  const [state, formAction, isPending] = useActionState(submitFarmVisit, initialState);

  if (state.status === "success") {
    return (
      <p className="text-sm text-[var(--color-green-deep)]">
        Your visit request has been submitted. Our team will confirm
        availability shortly.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Preferred date</span>
        <input name="preferredDate" required type="date" className="input" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Number of visitors</span>
        <input name="visitors" required type="number" min={1} defaultValue={1} className="input" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Phone</span>
        <input name="phone" required type="tel" className="input" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Notes</span>
        <textarea name="notes" rows={3} className="input" />
      </label>

      {state.status === "error" && (
        <p className="text-sm text-[var(--color-live)]">{state.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting…" : "Request Visit"}
      </Button>
    </form>
  );
}
