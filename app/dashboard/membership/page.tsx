import { redirect } from "next/navigation";

// Membership was merged into My Farm (plan details, payment history,
// harvest preference, and delivery progress all live there now) — this
// stays as a redirect so any old bookmarks or links still work.
export default function MembershipRedirect() {
  redirect("/dashboard/my-farm");
}
