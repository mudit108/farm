"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FarmVisitPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      <PageHeader title="Farm Visit" subtitle="Request to visit your plot, subject to scheduling and farm conditions." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          {submitted ? (
            <p className="text-sm text-[var(--color-green-deep)]">
              Your visit request has been submitted. Our team will confirm
              availability shortly.
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
                <span className="mb-1.5 block text-sm font-medium">Preferred date</span>
                <input required type="date" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Number of visitors</span>
                <input required type="number" min={1} defaultValue={1} className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Phone</span>
                <input required type="tel" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Notes</span>
                <textarea rows={3} className="input" />
              </label>
              <Button type="submit" className="w-full">Request Visit</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
