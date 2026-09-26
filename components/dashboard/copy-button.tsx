"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked (older browser / permissions) — the text is
          // visible on screen, so the member can still copy it by hand.
        }
      }}
      className="rounded-full border border-[var(--color-ink)]/15 px-3 py-1.5 text-xs font-medium hover:border-[var(--color-green)] hover:text-[var(--color-green-deep)]"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
