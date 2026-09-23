/** Brand marks and line-art for the public site. Pure SVG, no client JS. */

export function WheatMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={(size * 18) / 26} height={size} viewBox="0 0 18 26" fill="none" aria-hidden="true">
      <line x1="9" y1="25" x2="9" y2="2" stroke="#B4872E" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="5" x2="2" y2="9" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="5" x2="16" y2="9" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="12" x2="2.5" y2="16" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15.5" y2="16" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Nine pairs of ears, tapering toward the base. Each draws itself in on load (see .wheat-art in site.css).
const EARS = Array.from({ length: 9 }, (_, i) => {
  const y = 26 + i * 24;
  const spread = 14 + (9 - i) * 1.2;
  return { y, tip: y - 16, xl: 60 - spread, xr: 60 + spread, w: 2.4 - i * 0.09, delay: 0.3 + i * 0.085 };
});

export function HeroWheat() {
  return (
    <div className="wheat-art" aria-hidden="true">
      <svg viewBox="0 0 120 250" fill="none">
        <line className="stem" x1="60" y1="240" x2="60" y2="8" stroke="#B4872E" strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: ".18s" }} />
        {EARS.flatMap((e) =>
          [e.xl, e.xr].map((x) => (
            <line
              key={`${e.y}-${x}`}
              className="ear"
              x1="60"
              y1={e.y}
              x2={x.toFixed(1)}
              y2={e.tip}
              stroke="#B4872E"
              strokeWidth={e.w.toFixed(2)}
              strokeLinecap="round"
              style={{ animationDelay: `${e.delay.toFixed(2)}s` }}
            />
          ))
        )}
      </svg>
    </div>
  );
}

export function Check() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path d="M1 6L6 11L15 1" stroke="#B4872E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Dot() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="#B4872E" strokeWidth="1.4" />
    </svg>
  );
}

export function Arrow() {
  return <span aria-hidden="true">→</span>;
}
