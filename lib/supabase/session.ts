import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Session-aware Supabase client for Server Components and Server Actions.
 * Uses the anon key + the visitor's own auth cookies — respects RLS as
 * that user, unlike lib/supabase/service.ts (which bypasses RLS entirely
 * and never touches a user session). Use this to check *who's logged in*;
 * use service.ts for the actual admin data reads/writes once you've
 * confirmed they're allowed in.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no writable cookies —
            // safe to ignore since proxy.ts refreshes the session cookie
            // on every request anyway.
          }
        },
      },
    }
  );
}
