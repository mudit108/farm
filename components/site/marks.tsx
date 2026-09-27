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
