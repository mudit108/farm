"use client";

import { useState } from "react";
import { Sprout, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-20">
      <div className="mx-auto max-w-xl px-5">
        <h2 className="font-display text-3xl">Talk to us</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Questions about membership, allocation, or a visit? Send us a note.
        </p>

        {submitted ? (
          <p className="mt-8 rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-4 text-sm text-[var(--color-green-deep)]">
            Thanks — we&apos;ve received your message and will get back to
            you shortly.
          </p>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <input required placeholder="Name" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-green)]" />
            <input required type="tel" placeholder="Phone" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-green)]" />
            <input required type="email" placeholder="Email" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-green)]" />
            <textarea required placeholder="Message" rows={4} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-green)]" />
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Talk to Us</Button>
              <Button type="button" variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

const footerLinks = {
  Company: ["About", "How It Works", "Our Farm", "Seasonal Crops", "Contact"],
  Customer: ["Login", "Dashboard", "Membership", "Farm Visits"],
  Legal: ["Terms", "Privacy", "Membership Agreement", "Disclaimer"],
};

export function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] py-16 text-[var(--color-bg)]/70">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg text-[var(--color-bg)]">
              <Sprout className="h-5 w-5 text-[var(--color-gold)]" /> Khet Club
            </div>
            <p className="mt-3 max-w-xs text-sm">Rajasthan, India</p>
            <p className="mt-1 text-sm">hello@khetclub.example.com</p>
            <p className="text-sm">+91 00000 00000</p>
          </div>

          {Object.entries(footerLinks).map(([heading, items]) => (
            <div key={heading}>
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-bg)]/50">
                {heading}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-[var(--color-bg)]">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs">
          © {new Date().getFullYear()} Khet Club. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
