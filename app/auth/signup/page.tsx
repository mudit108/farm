"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Verified name/phone the claim-a-plot step reads later — never
        // taken from client input again after this point.
        data: { full_name: form.name, phone: form.phone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/select-plot`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
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
          <input required type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
