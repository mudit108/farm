"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 sm:px-10">
      <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-surface)] p-6 text-center">
        <p className="font-display text-xl">Something went wrong loading this page</p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Your farm and payments are safe — this is just a display problem. Please try again in a moment. If it keeps
          happening, contact us from Visits &amp; Support.
        </p>
        <Button className="mt-5" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
