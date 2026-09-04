import { redirect } from "next/navigation";

// Documents was merged into Account, alongside Profile — this stays as
// a redirect so any old bookmarks or links still work.
export default function DocumentsRedirect() {
  redirect("/dashboard/account");
}
