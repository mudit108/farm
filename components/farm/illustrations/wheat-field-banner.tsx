export function WheatFieldBanner({ className }: { className?: string }) {
  // Deterministic "scatter" (no Math.random) so server/client markup matches.
  const stalks = Array.from({ length: 46 }, (_, i) => {
    const x = 10 + i * (1180 / 45);
    const jitter = Math.sin(i * 12.9) * 10;
    const height = 70 + Math.abs(Math.sin(i * 3.7)) * 40;
    return { x: x + jitter, height };
  });

  return (
    <svg
      viewBox="0 0 1200 260"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* sky */}
      <rect x="0" y="0" width="1200" height="260" fill="var(--color-bg-deep)" />
      {/* sun */}
      <circle cx="1030" cy="70" r="46" fill="var(--color-gold)" opacity="0.5" />
      <circle cx="1030" cy="70" r="28" fill="var(--color-gold)" opacity="0.8" />
      {/* rolling hill */}
      <path
        d="M0,180 C200,140 350,200 560,170 C780,140 950,190 1200,150 L1200,260 L0,260 Z"
        fill="var(--color-green-soft)"
      />
      <path
        d="M0,210 C220,185 420,225 640,205 C860,185 1000,220 1200,195 L1200,260 L0,260 Z"
        fill="var(--color-green)"
        opacity="0.18"
      />
      {/* wheat row */}
      {stalks.map((s, i) => (
        <g key={i} stroke="var(--color-brown)" strokeLinecap="round" opacity="0.8">
          <line x1={s.x} y1={228} x2={s.x} y2={228 - s.height} strokeWidth="2" />
          <line
            x1={s.x}
            y1={228 - s.height + 10}
            x2={s.x - 7}
            y2={228 - s.height - 4}
            strokeWidth="2"
          />
          <line
            x1={s.x}
            y1={228 - s.height + 16}
            x2={s.x + 7}
            y2={228 - s.height + 2}
            strokeWidth="2"
          />
          <line
            x1={s.x}
            y1={228 - s.height + 22}
            x2={s.x - 6}
            y2={228 - s.height + 12}
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}
