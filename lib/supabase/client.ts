import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase client, used by the customer auth pages
 * (login/signup/forgot-password) and the admin login form. Uses the
 * anon key — safe for the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
