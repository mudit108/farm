"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { demoFaqs } from "@/lib/demo-data";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export function Faq({ warehouseTonnes }: { warehouseTonnes: number }) {
  const [open, setOpen] = useState<number | null>(0);

  // Warehouse capacity is admin-editable, so the FAQ text carries a
  // token rather than a hardcoded number that could go stale.
  const faqs = demoFaqs.map((f) => ({
    ...f,
    a: f.a.replace("{WAREHOUSE_TONNES}", String(warehouseTonnes)),
  }));

  return (
    <section id="faq" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal>
          <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Questions, answered.
          </h2>
        </Reveal>

        <div className="mt-10 divide-y divide-[var(--color-ink)]/10 border-y border-[var(--color-ink)]/10">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium">{item.q}</span>
                  <Plus
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isOpen && "rotate-45"
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="pb-5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
