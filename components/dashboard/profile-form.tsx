"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileState } from "@/app/actions/profile";
import { PHONE_HELP_TEXT } from "@/lib/phone";

const initialState: ProfileState = { status: "idle" };

export function ProfileForm({
  email,
  fullName,
  phone,
  city,
  address,
  pincode,
}: {
  email: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  pincode: string;
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
        <input name="phone" required type="tel" inputMode="numeric" placeholder="9876543210" className="input" defaultValue={phone} />
        <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">{PHONE_HELP_TEXT} — farm updates are sent here on WhatsApp.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Delivery city</span>
        <input name="city" required type="text" placeholder="e.g. Jaipur" className="input" defaultValue={city} />
        <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">Where your harvest should be delivered.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Delivery address</span>
        <textarea name="address" rows={2} placeholder="House / street / area / landmark" className="input" defaultValue={address} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Pincode</span>
        <input name="pincode" type="text" inputMode="numeric" maxLength={6} pattern="\d{6}" placeholder="e.g. 302001" className="input max-w-[10rem]" defaultValue={pincode} />
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
