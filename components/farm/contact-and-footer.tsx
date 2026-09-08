"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Sprout, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitContactMessage, type ContactState } from "@/app/actions/contact";

const initialState: ContactState = { status: "idle" };

/** Same normalization approach as lib/whatsapp/whatsapp-service.ts — a
 * bare 10-digit number is assumed Indian; anything already longer is
 * passed through as-is. */
function toWhatsAppDigits(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11) return digits;
  return null;
}

export function Contact({
  contactPhone,
}: {
  contactEmail: string | null;
  contactPhone: string | null;
}) {
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialState);
  const whatsappDigits = toWhatsAppDigits(contactPhone);

  return (
    <section id="contact" className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-14 sm:py-20">
      <div className="mx-auto max-w-xl px-5">
        <h2 className="font-display text-3xl">Talk to us</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Questions about membership, allocation, or a visit? Send us a note.
        </p>

        {state.status === "success" ? (
          <p className="mt-8 rounded-[var(--radius-sm)] bg-[var(--color-green-soft)] p-4 text-sm text-[var(--color-green-deep)]">
            Thanks — we&apos;ve received your message and will get back to
            you shortly.
          </p>
        ) : (
          <form action={formAction} className="mt-8 space-y-4">
            <input name="name" required placeholder="Name" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-green)] sm:text-sm" />
            <input name="phone" required type="tel" placeholder="Phone" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-green)] sm:text-sm" />
            <input name="email" required type="email" placeholder="Email" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-green)] sm:text-sm" />
            <textarea name="message" required placeholder="Message" rows={4} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-green)] sm:text-sm" />

            {state.status === "error" && (
              <p className="text-sm text-[var(--color-live)]">{state.message}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending…" : "Talk to Us"}
              </Button>
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi, I have a question about Mera Khet.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button type="button" variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Us
                  </Button>
                </a>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

const footerLinks = {
  Company: [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Our Farm", href: "/#live" },
    { label: "Seasonal Crops", href: "/#crops" },
    { label: "Contact", href: "/#contact" },
  ],
  Customer: [
    { label: "Login", href: "/auth/login" },
    { label: "Sign Up", href: "/auth/signup" },
    { label: "Membership Plans", href: "/#pricing" },
    { label: "Farm Visits", href: "/dashboard/farm-visit" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Membership Agreement", href: "/membership-agreement" },
    { label: "Refund & Cancellation", href: "/refund-policy" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};

export function Footer({
  contactEmail,
  contactPhone,
}: {
  contactEmail: string | null;
  contactPhone: string | null;
}) {
  return (
    <footer className="bg-[var(--color-ink)] py-16 text-[var(--color-bg)]/70">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg text-[var(--color-bg)]">
              <Sprout className="h-5 w-5 text-[var(--color-gold)]" /> Mera Khet
            </div>
            <p className="mt-3 max-w-xs text-sm">Sujangarh, Rajasthan, India</p>
            {contactEmail && <p className="mt-1 text-sm">{contactEmail}</p>}
            {contactPhone && <p className="text-sm">{contactPhone}</p>}
            {!contactEmail && !contactPhone && (
              <p className="mt-1 text-sm">
                Use the <Link href="/#contact" className="underline">contact form</Link> to reach us.
              </p>
            )}
          </div>

          {Object.entries(footerLinks).map(([heading, items]) => (
            <div key={heading}>
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-bg)]/50">
                {heading}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-[var(--color-bg)]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs">
          © {new Date().getFullYear()} Mera Khet. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
