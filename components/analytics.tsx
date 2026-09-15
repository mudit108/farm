"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Loads analytics on PUBLIC marketing pages only — never on /dashboard
 * or /admin. This is deliberate, for two separate reasons:
 *
 *  1. Privacy. Microsoft Clarity records session replays. On member
 *     dashboard pages that would capture real names, plot numbers,
 *     delivery cities, payment history and support messages — and on
 *     /admin it would capture EVERY member's personal data at once.
 *     Scoping by path is a much stronger guarantee than relying on
 *     field-level masking rules staying correct as pages change.
 *
 *  2. Data quality. The founder and admin browsing their own site all
 *     day would otherwise drown out real visitor traffic in the stats.
 *
 * Every provider is optional and driven by an env var: with none set,
 * this renders nothing at all and the site behaves exactly as before.
 * Nothing is hardcoded, so the same build works before and after
 * analytics accounts exist.
 */
export function Analytics() {
  const pathname = usePathname();

  const isPrivateArea =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth");

  if (isPrivateArea) return null;

  return (
    <>
      {CLARITY_ID && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");`}
        </Script>
      )}

      {PLAUSIBLE_DOMAIN && (
        <Script
          id="plausible"
          strategy="afterInteractive"
          data-domain={PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
        />
      )}

      {GA_ID && (
        <>
          <Script
            id="ga-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });`}
          </Script>
        </>
      )}
    </>
  );
}
