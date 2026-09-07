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
  title: "Organic Farm Plots in Rajasthan | Seasonal Farming & 24×7 Monitoring",
  description:
    "From our soil to your plate — you should know your food. Reserve 1, 3, or 6 organic wheat plots in Rajasthan, farmed for you and tracked from sowing to harvest. Choose home delivery, milling into flour, or market sale for your harvest.",
  metadataBase: new URL("https://merakhet.example.com"),
  openGraph: {
    title: "Organic Farm Plots in Rajasthan | Mera Khet",
    description:
      "From our soil to your plate — you should know your food. Organic wheat plots in Sujangarh, Rajasthan, farmed for you and tracked all season.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Organic Farm Plots in Rajasthan | Mera Khet",
    description: "From our soil to your plate — you should know your food. Organic wheat plots in Rajasthan.",
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
