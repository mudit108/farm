import { redirect } from "next/navigation";

// Farm Updates was merged into Communications (as the "Farm Updates"
// tab, alongside WhatsApp) — this stays as a redirect so any old
// bookmarks or links still work.
export default function AdminUpdatesRedirect() {
  redirect("/admin/communications");
}
