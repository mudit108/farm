export function PageHeader({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <div className="mk-page-head border-b border-[var(--color-ink)]/10 px-6 pb-7 pt-8 sm:px-10">
      {eyebrow && <p className="mk-page-eyebrow">{eyebrow}</p>}
      <h1 className="font-display text-[1.75rem] leading-tight sm:text-[2.1rem]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>}
    </div>
  );
}
