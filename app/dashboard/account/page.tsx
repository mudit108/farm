import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PasswordForm } from "@/components/dashboard/password-form";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

type Doc = { id: string; name: string; file_url: string };

export default async function AccountPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("khet_club_documents")
    .select("id, name, file_url")
    .order("created_at", { ascending: false });
  const documents = (data ?? []) as Doc[];

  return (
    <div>
      <PageHeader title="Account" subtitle="Your profile and documents." />

      <div className="grid gap-6 p-6 sm:px-10 lg:grid-cols-2">
        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Profile</p>
          <div className="mt-4">
            <ProfileForm
              email={user?.email ?? ""}
              fullName={(user?.user_metadata?.full_name as string) ?? ""}
              phone={(user?.user_metadata?.phone as string) ?? ""}
              city={(user?.user_metadata?.city as string) ?? ""}
              address={(user?.user_metadata?.address as string) ?? ""}
              pincode={(user?.user_metadata?.pincode as string) ?? ""}
            />
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Password</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Change your password without logging out.
          </p>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Documents</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Documents our team shares with you. Your payment receipts and plot certificate are on{" "}
            <Link href="/dashboard/my-farm" className="font-medium text-[var(--color-green)] hover:underline">My Farm</Link>.
          </p>
          <div className="mt-4 space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-ink)]/10 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[var(--color-brown)]" />
                  <p className="text-sm font-medium">{doc.name}</p>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 hover:bg-[var(--color-ink)]/5"
                  aria-label={`Open ${doc.name}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="text-sm text-[var(--color-ink-soft)]">
                No documents yet. Documents will appear here once issued by our team.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
