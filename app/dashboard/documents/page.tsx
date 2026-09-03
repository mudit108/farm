import { FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

type Doc = { id: string; name: string; file_url: string };

export default async function DocumentsPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("khet_club_documents")
    .select("id, name, file_url")
    .order("created_at", { ascending: false });

  const documents = (data ?? []) as Doc[];

  return (
    <div>
      <PageHeader title="Documents" subtitle="Your membership agreement, allocation document, and receipts." />

      <div className="space-y-3 p-6 sm:px-10">
        {documents.map((doc) => (
          <Card key={doc.id} className="flex items-center justify-between p-4">
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
          </Card>
        ))}

        {documents.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">
            No documents yet. Documents will appear here once issued by our team.
          </p>
        )}
      </div>
    </div>
  );
}
