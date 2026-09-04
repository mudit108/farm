import { redirect } from "next/navigation";

// Harvest Deliveries was merged into Members (as the "Harvest" tab) —
// this stays as a redirect so any old bookmarks or links still work.
export default function HarvestRedirect() {
  redirect("/admin/members");
}
