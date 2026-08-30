import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://khetclub.example.com";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/auth/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/auth/signup`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
