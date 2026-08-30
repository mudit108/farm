"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      <PageHeader title="Support" subtitle="Reach our team about your farm or membership." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          {submitted ? (
            <p className="text-sm text-[var(--color-green-deep)]">
              Thanks — your message has been sent to our support team.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Subject</span>
                <input required className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Message</span>
                <textarea required rows={4} className="input" />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="submit">Send Message</Button>
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
