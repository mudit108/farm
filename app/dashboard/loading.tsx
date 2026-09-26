export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6 sm:px-10" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded bg-[var(--color-ink)]/10" />
      <div className="mt-2 h-4 w-40 rounded bg-[var(--color-ink)]/5" />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="h-48 rounded-[var(--radius-card)] bg-[var(--color-ink)]/5 lg:col-span-2" />
        <div className="h-48 rounded-[var(--radius-card)] bg-[var(--color-ink)]/5" />
      </div>
    </div>
  );
}
