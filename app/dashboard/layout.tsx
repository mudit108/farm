import { DashboardShell, type ShellMember } from "@/components/dashboard/dashboard-shell";
import { createSessionClient } from "@/lib/supabase/session";

/**
 * Server half of the member dashboard chrome: reads who is signed in (and
 * which plots they hold) once, for the sidebar's member chip. Navigation,
 * active states and log out live in the client DashboardShell.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let plotNumbers: number[] = [];
  if (user) {
    const { data } = await supabase.from("khet_club_plots").select("plot_number").eq("user_id", user.id).order("plot_number");
    plotNumbers = ((data ?? []) as { plot_number: number }[]).map((p) => p.plot_number);
  }

  const fullName = ((user?.user_metadata?.full_name as string | undefined) ?? "").trim();
  const firstName = fullName.split(/\s+/)[0] || null;
  const member: ShellMember = {
    firstName: firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : null,
    initial: (firstName?.charAt(0) || user?.email?.charAt(0) || "M").toUpperCase(),
    plotLabel: plotNumbers.length ? `${plotNumbers.length > 1 ? "Plots" : "Plot"} ${plotNumbers.map((n) => `#${n}`).join(", ")}` : null,
  };

  return <DashboardShell member={member}>{children}</DashboardShell>;
}
