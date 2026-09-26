"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitSupportMessage, type SupportState } from "@/app/actions/support";

const initialState: SupportState = { status: "idle" };

export function SupportForm({ whatsappUrl }: { whatsappUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(submitSupportMessage, initialState);

  if (state.status === "success") {
    return (
      <p className="text-sm text-[var(--color-green-deep)]">
        Thanks — your message has been sent to our support team.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Subject</span>
        <input name="subject" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Message</span>
        <textarea name="message" required rows={4} className="input" />
      </label>

      {state.status === "error" && <p className="text-sm text-[var(--color-live)]">{state.message}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending…" : "Send Message"}
        </Button>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ink)]/15 px-4 py-2 text-sm font-medium hover:border-[var(--color-green)] hover:text-[var(--color-green-deep)]"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Us
          </a>
        )}
      </div>
    </form>
  );
}
