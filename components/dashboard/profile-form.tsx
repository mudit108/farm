"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileState } from "@/app/actions/profile";

const initialState: ProfileState = { status: "idle" };

export function ProfileForm({
  email,
  fullName,
  phone,
}: {
  email: string;
  fullName: string;
  phone: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Full name</span>
        <input name="fullName" required className="input" defaultValue={fullName} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email</span>
        <input className="input" value={email} disabled />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Phone</span>
        <input name="phone" type="tel" className="input" defaultValue={phone} />
      </label>

      {state.status === "error" && (
        <p className="text-sm text-[var(--color-live)]">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-sm text-[var(--color-green-deep)]">Saved.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
