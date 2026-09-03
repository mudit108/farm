"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";

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
      setError(error.message);
      return;
    }

    // Full navigation (not router.push) so the new session cookie is
    // picked up by proxy.ts on the very next request.
    window.location.href = redirectTo;
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-[var(--color-ink-soft)]">
        <ShieldCheck className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wide">Admin Access</span>
      </div>
      <h1 className="mt-2 font-display text-2xl">Admin login</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Sign in with your admin account.
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
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
        No account? Admin accounts are created in the Supabase Dashboard —
        contact whoever manages the project.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
