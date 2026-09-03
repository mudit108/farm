/**
 * Admin access = a valid Supabase Auth session AND an email on the
 * ADMIN_EMAILS allowlist (comma-separated env var). There's no separate
 * "admin" role/table — anyone can have a Supabase account, but only
 * allowlisted emails can reach /admin. Add or remove admins by editing
 * ADMIN_EMAILS; create their login via the Supabase Dashboard
 * (Authentication → Users → Add user).
 */
export function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminAllowlist().includes(email.toLowerCase());
}
