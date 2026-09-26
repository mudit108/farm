"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Tabs whose active tab lives in the URL (?tab=…), so a search, a page
 * refresh, or a link from elsewhere lands on the right tab instead of
 * always resetting to the first one. Pages pass the server-read ?tab=
 * value as `defaultTab`.
 */
export function Tabs({
  tabs,
  defaultTab,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
}) {
  const initial = tabs.some((t) => t.id === defaultTab) ? defaultTab! : tabs[0].id;
  const [active, setActive] = useState(initial);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  function select(id: string) {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === tabs[0].id) url.searchParams.delete("tab");
    else url.searchParams.set("tab", id);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-ink)]/10 px-6 sm:px-10" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => select(tab.id)}
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
