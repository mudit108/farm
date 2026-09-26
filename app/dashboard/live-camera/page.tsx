import { redirect } from "next/navigation";

// Live Camera was merged into Farm Activity (as a tab) — this stays as a
// redirect so any old bookmarks or links still work.
export default function LiveCameraRedirect() {
  redirect("/dashboard/crop-cycle?tab=live-camera");
}
