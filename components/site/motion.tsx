"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Motion primitives for the public site. All the actual animation lives in
 * app/site.css — these components only flip the classes that CSS keys off:
 *   .is-ready  on the page wrapper once hydrated (hero + nav choreography)
 *   .is-in     on a section the first time it scrolls into view
 * Everything degrades to fully visible content under prefers-reduced-motion.
 */

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px", ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView] as const;
}

/** Root wrapper for every public page: scoping class, ready state and the scroll progress bar. */
export function SiteShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);
  return (
    <div className="mk">
      <div className={cn("mk-page", ready && "is-ready")}>
        <div className="progress" aria-hidden="true">
          <div className="progress-bar" />
        </div>
        {children}
      </div>
    </div>
  );
}

/** A <section> that gains .is-in the first time it enters the viewport. */
export function Section({
  id,
  className,
  style,
  children,
}: {
  id?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <section ref={ref} id={id} className={cn(className, inView && "is-in")} style={style}>
      {children}
    </section>
  );
}

/** Same as Section but for a plain block (dividers, standalone cards). */
export function InView({ className, style, children }: { className?: string; style?: CSSProperties; children?: ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cn(className, inView && "is-in")} style={style}>
      {children}
    </div>
  );
}

/** Hairline divider that draws itself across the page when reached. */
export function Rule() {
  return (
    <div className="mk-wrap">
      <InView className="rule" />
    </div>
  );
}

function useCountUp(to: number, { duration = 1400, delay = 150, start }: { duration?: number; delay?: number; start: boolean }) {
  // Server HTML (and no-JS visitors, and crawlers) get the real number. The
  // count restarts from zero only once the element is revealed — it sits inside
  // a .fade block that is still transparent at that moment, so there's no flash.
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (!start || prefersReducedMotion() || to === 0) return;
    let raf = 0;
    const timer = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [start, to, duration, delay]);

  return value;
}

/** A number that counts up from zero when it scrolls into view. */
export function CountUp({
  to,
  format = "num",
  duration,
  delay,
}: {
  to: number;
  format?: "num" | "inr";
  duration?: number;
  delay?: number;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const v = useCountUp(to, { duration, delay, start: inView });
  const text = format === "inr" ? `₹${v.toLocaleString("en-IN")}` : v.toLocaleString("en-IN");
  return <span ref={ref}>{text}</span>;
}

/** Hero availability meter: bar and number fill together on load. */
export function HeroMeter({ filled, total }: { filled: number; total: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 650);
    return () => clearTimeout(t);
  }, []);
  const v = useCountUp(filled, { duration: 1500, delay: 0, start: ready });
  const open = Math.max(total - filled, 0);
  if (total === 0) return null;
  return (
    <div className="hero-meter fade d6">
      <div
        className="meter-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={filled}
        aria-label="Plots reserved this season"
      >
        <div className="meter-fill" style={{ width: `${(v / total) * 100}%` }} />
      </div>
      <p className="meter-label">
        <strong>
          {v} of {total} plots
        </strong>{" "}
        reserved this season — {open > 0 ? `${open} still open` : "all plots are taken"}
      </p>
    </div>
  );
}
