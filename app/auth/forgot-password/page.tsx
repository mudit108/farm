"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl">Check your email</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          If an account exists for {email}, we&apos;ve sent a password reset link.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Reset password</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        We&apos;ll email you a link to reset it.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="text-sm text-[var(--color-live)]">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>
    </div>
  );
}
