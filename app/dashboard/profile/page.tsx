import { redirect } from "next/navigation";

// Profile was merged into Account, alongside Documents — this stays as
// a redirect so any old bookmarks or links still work.
export default function ProfileRedirect() {
  redirect("/dashboard/account");
}
