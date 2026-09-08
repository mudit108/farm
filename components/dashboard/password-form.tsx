"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updatePassword, type PasswordState } from "@/app/actions/profile";

const initialState: PasswordState = { status: "idle" };

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">New password</span>
        <input name="newPassword" type="password" required autoComplete="new-password" className="input" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
        <input name="confirmPassword" type="password" required autoComplete="new-password" className="input" />
      </label>

      {state.status === "error" && (
        <p className="text-sm text-[var(--color-live)]">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-sm text-[var(--color-green-deep)]">Password updated.</p>
      )}

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}
