"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0].id);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-ink)]/10 px-6 sm:px-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-[var(--color-green)] text-[var(--color-ink)]"
                : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeTab.content}</div>
    </div>
  );
}
