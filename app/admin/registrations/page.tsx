import { redirect } from "next/navigation";

// Plot Registrations was merged into Members (as the "Members" and
// "All Plots" tabs) — this stays as a redirect so any old bookmarks or
// links still work.
export default function RegistrationsRedirect() {
  redirect("/admin/members");
}
