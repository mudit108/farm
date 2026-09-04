import { redirect } from "next/navigation";

// WhatsApp was merged into Communications (as the "WhatsApp" tab,
// alongside Farm Updates) — this stays as a redirect so any old
// bookmarks or links still work.
export default function AdminWhatsAppRedirect() {
  redirect("/admin/communications");
}
