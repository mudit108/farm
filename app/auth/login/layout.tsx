import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | Mera Khet",
  description: "Log in to your Mera Khet member dashboard — your plots, harvest, farm updates and payments.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
