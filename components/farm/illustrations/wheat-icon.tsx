export function WheatIcon({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  const grains = Array.from({ length: 7 }, (_, i) => i);
  return (
    <svg viewBox="0 0 60 140" fill="none" className={className} aria-hidden="true">
      <path d="M30 138 L30 20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {grains.map((i) => {
        const y = 24 + i * 15;
        const scale = 1 - i * 0.07;
        return (
          <g key={i}>
            <ellipse
              cx={30 - 9 * scale}
              cy={y}
              rx={7 * scale}
              ry={4 * scale}
              fill={color}
              opacity={0.9}
              transform={`rotate(-28 ${30 - 9 * scale} ${y})`}
            />
            <ellipse
              cx={30 + 9 * scale}
              cy={y}
              rx={7 * scale}
              ry={4 * scale}
              fill={color}
              opacity={0.9}
              transform={`rotate(28 ${30 + 9 * scale} ${y})`}
            />
          </g>
        );
      })}
      <ellipse cx="30" cy="16" rx="5" ry="9" fill={color} />
    </svg>
  );
}
