import "server-only";
import type { User } from "@supabase/supabase-js";
import type { createServiceClient } from "@/lib/supabase/service";

/**
 * supabase.auth.admin.listUsers() returns only the first page (50 users
 * by default). Every admin screen that needs "all members" must page
 * through, or member #51 onward silently disappears — wrong counts,
 * "Unknown" names, missing from WhatsApp broadcasts and CSV exports.
 *
 * Returns the same `{ data: { users } }` shape as listUsers() so call
 * sites inside Promise.all don't need restructuring.
 */
export async function listAllUsers(
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ data: { users: User[] } }> {
  const perPage = 1000;
  const users: User[] = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("listAllUsers failed on page", page, error);
      break;
    }
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return { data: { users } };
}
