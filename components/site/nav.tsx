"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WheatMark } from "@/components/site/marks";

export const siteLinks = [
  { href: "/the-farm", label: "The Farm" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/our-wheat", label: "Our Wheat" },
  { href: "/plans", label: "Plans" },
  { href: "/faq", label: "FAQ" },
];

export function SiteNav({
  isLoggedIn,
  firstName,
  registrationsPaused = false,
}: {
  isLoggedIn: boolean;
  firstName: string;
  registrationsPaused?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // The menu is "open at" a path, so navigating anywhere closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenAt((cur) => ((typeof v === "function" ? v(cur === pathname) : v) ? pathname : null));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll while the mobile menu is open; Escape closes it.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);


  const reserveHref = isLoggedIn ? "/dashboard/select-plot" : "/auth/signup";

  return (
    <nav className={["nav", scrolled && "nav--scrolled", open && "nav-open"].filter(Boolean).join(" ")} aria-label="Main">
      {registrationsPaused && (
        <p className="paused-bar">New plot bookings are temporarily paused. Existing members are unaffected — check back shortly.</p>
      )}
      <div className="nav-inner">
        <Link href="/" className="brand">
          <WheatMark />
          <span>Mera Khet</span>
        </Link>
        <div className="nav-links">
          {siteLinks.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "current" : undefined} aria-current={pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <span className="nav-hi">Hi, {firstName}</span>
              <Link href="/dashboard" className="btn btn-nav">
                <span>My Dashboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="nav-login">
                Login
              </Link>
              <Link href={reserveHref} className="btn btn-nav">
                <span>Reserve Your Plot</span>
              </Link>
            </>
          )}
          <button className="nav-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((v) => !v)}>
            <span />
          </button>
        </div>
      </div>

      <div className="nav-panel" id="site-menu" hidden={!open}>
        <Link href="/" className={`np-link${pathname === "/" ? " current" : ""}`}>
          Home
        </Link>
        {siteLinks.map((l) => (
          <Link key={l.href} href={l.href} className={`np-link${pathname === l.href ? " current" : ""}`}>
            {l.label}
          </Link>
        ))}
        <div className="np-actions">
          {isLoggedIn ? (
            <>
              <span className="np-hi">Signed in as {firstName}</span>
              <Link href="/dashboard" className="btn btn-primary">
                <span>My Dashboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link href={reserveHref} className="btn btn-primary">
                <span>Reserve Your Plot</span>
              </Link>
              <Link href="/auth/login" className="btn btn-ghost">
                <span>Login</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
