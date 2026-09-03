import { AdminShell } from "@/components/admin/admin-shell";
import { createSessionClient } from "@/lib/supabase/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts already guarantees an authenticated, allowlisted user reaches
  // this far — this read is just to display who's signed in.
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AdminShell adminEmail={user?.email ?? null}>{children}</AdminShell>;
}
