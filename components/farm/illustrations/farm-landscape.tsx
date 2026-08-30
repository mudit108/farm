export function FarmLandscape({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      <rect x="0" y="0" width="400" height="300" fill="var(--color-green-soft)" />
      {/* sun */}
      <circle cx="320" cy="70" r="34" fill="var(--color-gold)" opacity="0.85" />
      {/* distant hill */}
      <path
        d="M0,150 C80,120 160,160 240,135 C300,118 350,140 400,120 L400,300 L0,300 Z"
        fill="var(--color-green)"
        opacity="0.25"
      />
      {/* near field */}
      <path
        d="M0,190 C90,170 190,205 280,180 C330,166 370,185 400,175 L400,300 L0,300 Z"
        fill="var(--color-green)"
        opacity="0.45"
      />
      {/* farmhouse */}
      <g transform="translate(150,150)">
        <rect x="-30" y="20" width="60" height="45" fill="var(--color-surface)" opacity="0.9" />
        <path d="M-38,20 L0,-10 L38,20 Z" fill="var(--color-brown)" />
        <rect x="-8" y="38" width="16" height="27" fill="var(--color-brown)" opacity="0.8" />
        <rect x="10" y="30" width="10" height="10" fill="var(--color-green-deep)" opacity="0.6" />
      </g>
      {/* wheat row along the base */}
      {Array.from({ length: 24 }, (_, i) => {
        const x = 10 + i * 17;
        const h = 26 + ((i * 7) % 14);
        return (
          <g key={i} stroke="var(--color-brown)" strokeLinecap="round" opacity="0.75">
            <line x1={x} y1={296} x2={x} y2={296 - h} strokeWidth="2" />
            <line x1={x} y1={296 - h + 6} x2={x - 5} y2={296 - h - 2} strokeWidth="1.5" />
            <line x1={x} y1={296 - h + 10} x2={x + 5} y2={296 - h + 2} strokeWidth="1.5" />
          </g>
        );
      })}
    </svg>
  );
}
