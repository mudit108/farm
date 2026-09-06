export function DraftNotice() {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-brown)]/30 bg-[var(--color-brown-soft)] p-4 text-sm text-[var(--color-ink)]">
      <strong className="text-[var(--color-brown)]">Draft — pending legal review.</strong>{" "}
      This document was drafted to cover the points a careful reader would
      expect before paying, using reasonable, common practice. It is not a
      substitute for review by a qualified lawyer, and bracketed fields
      like <code>[City, State]</code> need to be filled in with
      Mera Khet&apos;s actual registered details before this is relied on
      as a binding agreement.
    </div>
  );
}
