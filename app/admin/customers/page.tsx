import { redirect } from "next/navigation";

// Customers was merged into Members (as the "All Accounts" tab,
// including documents) — this stays as a redirect so any old bookmarks
// or links still work.
export default function CustomersRedirect() {
  redirect("/admin/members");
}
