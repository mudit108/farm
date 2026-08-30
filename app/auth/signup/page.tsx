"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  // No backend is wired up yet — this just simulates account creation so
  // the dashboard is reachable for demo purposes. Replace with a real
  // sign-up call once a backend is chosen.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Own your farm</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Create an account to get started.
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
