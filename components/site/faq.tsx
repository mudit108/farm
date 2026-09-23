"use client";

import { useMemo, useState } from "react";
import type { Faq } from "@/lib/site-content";

export function FaqAccordion({ items, open, onToggle }: { items: Faq[]; open: number; onToggle: (id: number) => void }) {
  return (
    <div className="faq-list">
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className={isOpen ? "faq-item open" : "faq-item"}>
            <button className="faq-q" aria-expanded={isOpen} aria-controls={`faq-a-${f.id}`} onClick={() => onToggle(f.id)}>
              <span>{f.q}</span>
              <span className="faq-icon" aria-hidden="true" />
            </button>
            <div className="faq-a" id={`faq-a-${f.id}`} role="region" aria-hidden={!isOpen}>
              <div className="faq-a-inner">
                <p>{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Short accordion for the homepage. */
export function FaqPreview({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState(items[0]?.id ?? -1);
  return (
    <div className="fade d3">
      <FaqAccordion items={items} open={open} onToggle={(id) => setOpen((o) => (o === id ? -1 : id))} />
    </div>
  );
}

/** Full FAQ: live search + topic filter, grouped by topic. */
export function FaqBrowser({ faqs, categories }: { faqs: Faq[]; categories: readonly { id: string; title: string; short: string }[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(faqs[0]?.id ?? -1);

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      categories
        .filter((c) => cat === "all" || c.id === cat)
        .map((c) => ({
          ...c,
          items: faqs.filter((f) => f.cat === c.id && (q === "" || `${f.q} ${f.a}`.toLowerCase().includes(q))),
        }))
        .filter((g) => g.items.length > 0),
    [categories, faqs, cat, q]
  );
  const shown = groups.reduce((n, g) => n + g.items.length, 0);
  const counts = Object.fromEntries(categories.map((c) => [c.id, faqs.filter((f) => f.cat === c.id).length]));
  const chips = [{ id: "all", short: "All", count: faqs.length }, ...categories.map((c) => ({ id: c.id, short: c.short, count: counts[c.id] }))];

  const line =
    q === "" && cat === "all"
      ? `${faqs.length} questions across ${categories.length} topics`
      : `${shown} ${shown === 1 ? "question" : "questions"}${q ? ` matching “${query.trim()}”` : ""}`;

  return (
    <>
      <div className="faq-tools fade d5">
        <div className="search">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="6" stroke="#7E5A12" strokeWidth="1.6" />
            <line x1="12" y1="12" x2="17" y2="17" stroke="#7E5A12" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <label htmlFor="faq-search" className="sr-only">
            Search the questions
          </label>
          <input
            id="faq-search"
            type="search"
            placeholder="Search — try “delivery”, “organic” or “refund”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="chips" role="group" aria-label="Filter by topic">
          {chips.map((c) => (
            <button key={c.id} className={cat === c.id ? "chip on" : "chip"} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.short}
              <span className="chip-n">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="faq-body" style={{ margin: "34px 0 0" }}>
        <p className="result-line" aria-live="polite">
          {line}
        </p>
        {groups.map((g) => (
          <div className="faq-group" key={g.id}>
            <div className="group-h">
              <h2>{g.title}</h2>
              <span>
                {g.items.length} {g.items.length === 1 ? "question" : "questions"}
              </span>
            </div>
            <FaqAccordion items={g.items} open={open} onToggle={(id) => setOpen((o) => (o === id ? -1 : id))} />
          </div>
        ))}
        {groups.length === 0 && (
          <div className="empty">
            <h2>Nothing matches that yet.</h2>
            <p>Try a simpler word — or just ask us directly below.</p>
            <button
              onClick={() => {
                setQuery("");
                setCat("all");
              }}
            >
              Clear search and filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
