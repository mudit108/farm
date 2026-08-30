import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

const jbmono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Own a 100% Organic Farm in Rajasthan | Seasonal Farming & 24×7 Monitoring",
  description:
    "Choose 1, 3, or 6 organic wheat plots in Rajasthan — from feeding your family to owning an entire acre. Sowing near Diwali. Choose home delivery, processing into flour, or market sale for your harvest — with 24×7 CCTV monitoring along the way.",
  metadataBase: new URL("https://khetclub.example.com"),
  openGraph: {
    title: "Own a 100% Organic Farm in Rajasthan | Khet Club",
    description:
      "1, 3, or 6 organic wheat plots. Your choice for the harvest. A technology-enabled farm membership in Sandwa, Rajasthan.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Own a 100% Organic Farm in Rajasthan | Khet Club",
    description: "1, 3, or 6 organic wheat plots. Your choice for the harvest.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${inter.variable} ${jbmono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
