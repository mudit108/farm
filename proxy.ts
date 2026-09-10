import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAdminEmail } from "@/lib/admin-auth";

/**
 * - /admin/*: requires a real Supabase Auth session AND an email on the
 *   ADMIN_EMAILS allowlist (see lib/admin-auth.ts). Login lives at
 *   /auth/admin-login, outside this matcher, so it's always reachable.
 * - /dashboard/*: requires any signed-in, confirmed customer account.
 *   Login lives at /auth/login.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (path.startsWith("/admin")) {
    const isAllowed = user && isAllowedAdminEmail(user.email);
    if (!isAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/admin-login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (path.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // An already-signed-in member landing on Login or Signup is a dead
  // end — send them to their dashboard instead.
  //
  // Deliberately matched as EXACT paths, not a /auth prefix:
  //   /auth/update-password REQUIRES an active session (the reset email
  //     creates one), so redirecting it away would silently break
  //     password reset entirely.
  //   /auth/callback must run to exchange the auth code.
  //   /auth/admin-login must stay reachable for someone signed in as a
  //     customer who needs to reach the admin panel.
  if (user && (path === "/auth/login" || path === "/auth/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/auth/login", "/auth/signup"],
};
