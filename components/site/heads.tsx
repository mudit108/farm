import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/** Hero block for the inner pages: breadcrumb, masked headline, lead, jump links. */
export function PageHero({
  crumb,
  lines,
  lead,
  jumps,
  children,
}: {
  crumb: string;
  lines: string[];
  lead?: ReactNode;
  jumps?: { href: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="page-hero hero">
      <div className="hero-texture" />
      <div className="mk-wrap" style={{ position: "relative" }}>
        <p className="crumb fade">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{crumb}</span>
        </p>
        <h1>
          {lines.map((l) => (
            <span className="line" key={l}>
              <span>{l}</span>
            </span>
          ))}
        </h1>
        {lead && <p className="lead fade d5">{lead}</p>}
        {jumps && (
          <div className="jump fade d6">
            {jumps.map((j) => (
              <a key={j.href} href={j.href}>
                {j.label}
              </a>
            ))}
          </div>
        )}
        {children}
      </div>
    </header>
  );
}

export function SectionHead({
  num,
  title,
  lead,
  center = false,
  style,
}: {
  num: string;
  title: string[];
  lead?: ReactNode;
  center?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={`section-head${center ? " center" : ""}`} style={style}>
      <span className="section-num fade">{num}</span>
      <h2>
        {title.map((t) => (
          <span className="line" key={t}>
            <span>{t}</span>
          </span>
        ))}
      </h2>
      {lead && <p className="fade d5">{lead}</p>}
    </div>
  );
}
