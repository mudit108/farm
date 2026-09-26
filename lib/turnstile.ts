import "server-only";

/**
 * Server-side check of a Cloudflare Turnstile token. Returns true when
 * TURNSTILE_SECRET_KEY isn't configured yet (so forms keep working before
 * setup), false for a missing or rejected token once it is.
 */
export async function verifyTurnstile(token: string | null, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}
