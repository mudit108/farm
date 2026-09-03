"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email before logging in — check your inbox for the link.");
      } else {
        setError("Incorrect email or password.");
      }
      return;
    }

    // Full navigation so the new session cookie is picked up by proxy.ts
    // on the very next request.
    window.location.href = redirectTo;
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Log in</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Welcome back to your farm.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-[var(--color-live)]">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </Button>
      </form>

      <div className="mt-4 flex justify-between text-sm text-[var(--color-ink-soft)]">
        <Link href="/auth/forgot-password" className="hover:text-[var(--color-ink)]">
          Forgot password?
        </Link>
        <Link href="/auth/signup" className="hover:text-[var(--color-ink)]">
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
