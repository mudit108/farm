"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // No backend is wired up yet — this just simulates a login so the
  // dashboard is reachable for demo purposes. Replace with a real
  // authentication call once a backend is chosen.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Log in</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Welcome back to your farm.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </Field>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
