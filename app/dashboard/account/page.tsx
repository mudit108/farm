import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Download, UserRound, KeyRound, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/ui";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PasswordForm } from "@/components/dashboard/password-form";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account | Mera Khet", robots: { index: false } };

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
      <PageHeader eyebrow="Your details" title="Account" subtitle="Your profile, password and documents." />

      <div className="mk-page-pad grid gap-6 lg:grid-cols-2">
        <Panel icon={UserRound} label="Profile" className="lg:row-span-2">
          <ProfileForm
            email={user?.email ?? ""}
            fullName={(user?.user_metadata?.full_name as string) ?? ""}
            phone={(user?.user_metadata?.phone as string) ?? ""}
            city={(user?.user_metadata?.city as string) ?? ""}
            address={(user?.user_metadata?.address as string) ?? ""}
            pincode={(user?.user_metadata?.pincode as string) ?? ""}
          />
        </Panel>

        <Panel icon={KeyRound} label="Password">
          <p className="mk-muted mb-4">Change your password without logging out.</p>
          <PasswordForm />
        </Panel>

        <Panel icon={FolderOpen} label="Documents">
          <p className="mk-muted">
            Documents our team shares with you. Your payment receipts and plot certificate are on{" "}
            <Link href="/dashboard/my-farm" className="font-semibold text-[var(--color-green)] hover:underline">
              My Farm
            </Link>
            .
          </p>
          <div className="mk-rows mt-3">
            {documents.map((doc) => (
              <div key={doc.id} className="mk-row">
                <span className="mk-row-main flex items-center gap-3 font-semibold text-[var(--color-ink)]">
                  <FileText className="h-5 w-5 shrink-0 text-[var(--color-brown)]" aria-hidden="true" />
                  {doc.name}
                </span>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="mk-download" aria-label={`Open ${doc.name}`}>
                  <Download className="h-4 w-4" aria-hidden="true" /> Open
                </a>
              </div>
            ))}
            {documents.length === 0 && <p className="mk-muted">No documents yet. Documents will appear here once issued by our team.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
