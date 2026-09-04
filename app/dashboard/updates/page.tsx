import { redirect } from "next/navigation";

// Farm Updates was merged into Farm Activity (as a tab) — this stays as
// a redirect so any old bookmarks or links still work.
export default function UpdatesRedirect() {
  redirect("/dashboard/crop-cycle");
}
