"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account details." />

      <div className="p-6 sm:px-10">
        <Card className="max-w-lg p-6">
          <form className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Full name</span>
              <input className="input" placeholder="Your name" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input className="input" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Phone</span>
              <input className="input" placeholder="Your phone number" />
            </label>
            <Button type="button">Save Changes</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
