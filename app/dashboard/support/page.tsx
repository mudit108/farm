import { redirect } from "next/navigation";

// Support was merged into Help, alongside Farm Visit requests — this
// stays as a redirect so any old bookmarks or links still work.
export default function SupportRedirect() {
  redirect("/dashboard/farm-visit");
}
