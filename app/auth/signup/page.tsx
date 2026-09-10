"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { normalizeIndianMobile, PHONE_HELP_TEXT, PHONE_ERROR_TEXT } from "@/lib/phone";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate before hitting Supabase — every WhatsApp path messages
    // this number, so a junk value here means silent unreachability.
    const normalizedPhone = normalizeIndianMobile(form.phone);
    if (!normalizedPhone) {
      setError(PHONE_ERROR_TEXT);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Verified name/phone the claim-a-plot step reads later — never
        // taken from client input again after this point.
        data: { full_name: form.name, phone: normalizedPhone, city: form.city.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/select-plot`,
      },
    });

    setLoading(false);
    if (error) {
      // Translate Supabase's internal wording into something a customer
      // can act on — matching how the login page already handles errors.
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setError("An account with this email already exists — try logging in instead.");
      } else if (msg.includes("password")) {
        setError("Please choose a password with at least 8 characters.");
      } else if (msg.includes("email")) {
        setError("Please enter a valid email address.");
      } else {
        setError("Couldn't create your account. Please try again, or contact us if it keeps happening.");
      }
      return;
    }

    if (data.session) {
      // Email confirmation is disabled on this project — signed in already.
      window.location.href = "/dashboard/select-plot";
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl">Check your email</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          We&apos;ve sent a confirmation link to {form.email}. Click it to
          activate your account, then log in to select your plot.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Reserve your plot</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Create an account, confirm your email, then select your plot.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Full name</span>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Phone</span>
          <input required type="tel" inputMode="numeric" placeholder="9876543210" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">{PHONE_HELP_TEXT} — we send farm updates here on WhatsApp.</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Delivery city</span>
          <input required type="text" placeholder="e.g. Jaipur" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">Where your harvest should be delivered. You can change this later.</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input required type="password" minLength={8} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>

        {error && <p className="text-sm text-[var(--color-live)]">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-ink-soft)]">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-[var(--color-green)]">
          Log in
        </Link>
      </p>
    </div>
  );
}
