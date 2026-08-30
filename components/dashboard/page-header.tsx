export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-[var(--color-ink)]/10 px-6 py-6 sm:px-10">
      <h1 className="font-display text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>}
    </div>
  );
}
