import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Karla } from "next/font/google";
import { Analytics } from "@/components/analytics";
import "./globals.css";
import "./site.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Body face for the public site (app/site.css). The dashboard and admin
// keep Inter via --font-inter, so this only changes the marketing pages.
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jbmono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Farm Plots in Rajasthan | Soil-Tested Farming & 24×7 Monitoring",
  description:
    "From our soil to your plate — you should know your food. Reserve 1, 3, or 6 wheat plots in Rajasthan, fertilized based on soil testing and tracked from sowing to harvest. Choose home delivery, milling into flour, or market sale for your harvest.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.merakhet.in"),
  openGraph: {
    title: "Farm Plots in Rajasthan | Mera Khet",
    description:
      "From our soil to your plate — you should know your food. Soil-tested wheat plots in Sujangarh, Rajasthan, farmed for you and tracked all season.",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mera Khet — a farmer walking through a wheat field at sunset in Sujangarh, Rajasthan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farm Plots in Rajasthan | Mera Khet",
    description: "From our soil to your plate — you should know your food. Soil-tested wheat plots in Rajasthan.",
    images: ["/images/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${fraunces.variable} ${inter.variable} ${karla.variable} ${jbmono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
