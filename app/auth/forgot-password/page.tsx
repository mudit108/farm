"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // No backend is wired up yet — this just simulates sending a reset
  // email. Replace with a real password-reset call once a backend is
  // chosen.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        <Button type="submit" className="w-full">Send Reset Link</Button>
      </form>
    </div>
  );
}
