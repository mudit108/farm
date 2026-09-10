import "server-only";
import { createSessionClient } from "@/lib/supabase/session";

export type CurrentMember = {
  isLoggedIn: boolean;
  firstName: string;
  fullName: string;
  plotNumbers: number[];
  planId: string | null;
};

/**
 * Read by the public homepage so a logged-in member isn't shown "Login"
 * and "Reserve Your Plot" as though they were a stranger. Deliberately
 * returns only what the public page needs — no email, phone or payment
 * detail leaks onto a page that also renders for anonymous visitors.
 */
export async function getCurrentMember(): Promise<CurrentMember> {
  const empty: CurrentMember = {
    isLoggedIn: false,
    firstName: "",
    fullName: "",
    plotNumbers: [],
    planId: null,
  };

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data } = await supabase
    .from("khet_club_plots")
    .select("plot_number, plan_id")
    .eq("user_id", user.id)
    .order("plot_number");

  const rows = (data ?? []) as { plot_number: number; plan_id: string | null }[];
  const fullName = (user.user_metadata?.full_name as string) || "";

  return {
    isLoggedIn: true,
    firstName: fullName.trim().split(/\s+/)[0] || "there",
    fullName,
    plotNumbers: rows.map((r) => r.plot_number),
    planId: rows[0]?.plan_id ?? null,
  };
}
