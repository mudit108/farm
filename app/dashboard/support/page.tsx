"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { submitSupportMessage, type SupportState } from "@/app/actions/support";

const initialState: SupportState = { status: "idle" };

export default function SupportPage() {
  const [state, formAction, isPending] = useActionState(submitSupportMessage, initialState);

  return (
    <div>
      <PageHeader title="Support" subtitle="Reach our team about your farm or membership." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          {state.status === "success" ? (
            <p className="text-sm text-[var(--color-green-deep)]">
              Thanks — your message has been sent to our support team.
            </p>
          ) : (
            <form action={formAction} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Subject</span>
                <input name="subject" required className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Message</span>
                <textarea name="message" required rows={4} className="input" />
              </label>

              {state.status === "error" && (
                <p className="text-sm text-[var(--color-live)]">{state.message}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Sending…" : "Send Message"}
                </Button>
                <Button type="button" variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Us
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
