"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoPlots } from "@/lib/demo-data";

export default function UpdateManagementPage() {
  const [published, setPublished] = useState(false);

  return (
    <div>
      <PageHeader title="Farm Updates" subtitle="Publish an update to a customer's dashboard." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          {published ? (
            <p className="text-sm text-[var(--color-green-deep)]">
              Update published — it will appear on the customer&apos;s dashboard immediately.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setPublished(true);
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Plot</span>
                <select className="input" required>
                  {demoPlots.filter((p) => p.status === "active").map((p) => (
                    <option key={p.id} value={p.id}>{p.id}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Title</span>
                <input required className="input" placeholder="Wheat entering tillering stage" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Date</span>
                <input required type="date" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Description</span>
                <textarea required rows={3} className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Photos</span>
                <input type="file" multiple accept="image/*" className="input" />
              </label>
              <Button type="submit" className="w-full">Publish Update</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
