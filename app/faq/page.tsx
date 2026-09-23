import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { Section } from "@/components/site/motion";
import { FaqBrowser } from "@/components/site/faq";
import { whatsappHref } from "@/components/site/footer";
import { getPlanCards, getSeason } from "@/lib/public-data";
import { buildFaqs, faqCategories } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ | Mera Khet — Every Question About Farm Plot Membership",
  description:
    "Ownership, organic status, harvest and delivery, cameras, pricing, split payments and cancellation — every question about Mera Khet, answered plainly and searchable.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [plans, season] = await Promise.all([getPlanCards(), getSeason()]);
  const faqs = buildFaqs({
    prices: Object.fromEntries(plans.map((p) => [p.id, p.priceInr])),
    warehouseTonnes: season?.warehouse_capacity_tonnes ?? 30,
  });
  const wa = whatsappHref(season?.contact_phone ?? null);

  // FAQPage structured data, so answers can appear directly in search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <SiteFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="page-hero hero" style={{ paddingBottom: 40 }}>
        <div className="hero-texture" />
        <div className="mk-wrap" style={{ position: "relative" }}>
          <p className="crumb fade">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>FAQ</span>
          </p>
          <h1>
            <span className="line">
              <span>Every question,</span>
            </span>
            <span className="line">
              <span>answered plainly.</span>
            </span>
          </h1>
          <FaqBrowser faqs={faqs} categories={faqCategories} />
        </div>
      </header>

      <Section className="section" style={{ paddingTop: 10 }}>
        <div className="mk-wrap">
          <div className="card help fade">
            <div>
              <h2>Still have a question?</h2>
              <p>Ask us directly — we&apos;d rather answer it than have you guess. Gifted memberships are set up the same way.</p>
            </div>
            <div className="help-lines">
              {season?.contact_email && (
                <p className="help-line">
                  <a href={`mailto:${season.contact_email}`}>{season.contact_email}</a>
                </p>
              )}
              {wa && (
                <p className="help-line">
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    WhatsApp us
                  </a>
                </p>
              )}
              <Link href="/#contact" className="mk-link" style={{ marginTop: 8, alignSelf: "flex-start" }}>
                Send a message <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </SiteFrame>
  );
}
