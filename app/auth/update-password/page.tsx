"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * The page a password-reset email link actually lands on. Previously
 * missing entirely — the reset email sent users straight to /dashboard,
 * where they were signed in via the magic link but had no way to set a
 * new password, leaving them stuck in the same loop the next time they
 * logged out.
 *
 * Supabase's reset link creates a real session before this page loads,
 * so updateUser() here works without asking for the old password.
 */
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Please use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("same")
          ? "That's already your current password — please choose a different one."
          : "Couldn't update your password. Your reset link may have expired — request a new one."
      );
      return;
    }

    setDone(true);
  }

  if (checkingSession) {
    return <p className="text-sm text-[var(--color-ink-soft)]">Checking your link…</p>;
  }

  if (!hasSession) {
    return (
      <div>
        <h1 className="font-display text-2xl">Link expired</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          This password reset link is no longer valid. Reset links expire
          after a while for security.
        </p>
        <Link href="/auth/forgot-password" className="mt-4 inline-block">
          <Button>Request a new link</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <h1 className="font-display text-2xl">Password updated</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          You&apos;re all set — you can use your new password from now on.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Set a new password</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Choose something you&apos;ll remember — at least 8 characters.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">New password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-[var(--color-live)]">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
