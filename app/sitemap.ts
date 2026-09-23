import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.merakhet.in";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    // A real SEO target in its own right: the homepage can't rank well
    // for "how farm plot membership works" while also competing for
    // pricing, location and brand terms.
    { url: `${base}/how-it-works`, changeFrequency: "monthly", priority: 0.9 },
    // Updates weekly during the season — the camera and farm-update
    // content here is the freshest thing on the site.
    { url: `${base}/the-farm`, changeFrequency: "weekly", priority: 0.8 },
    // Added in the 2026 multi-page redesign.
    { url: `${base}/plans`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/our-wheat`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/auth/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/auth/signup`, changeFrequency: "yearly", priority: 0.5 },
    // Legal pages were missing entirely — they're public, linked from
    // the footer, and carry real trust signals for a business taking
    // payments.
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/refund-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/membership-agreement`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
