import { FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

const documents = [
  { name: "Membership Agreement", type: "PDF" },
  { name: "Farm Allocation Document — Plot A-024", type: "PDF" },
  { name: "Receipt — Annual Membership 2026", type: "PDF" },
];

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader title="Documents" subtitle="Your membership agreement, allocation document, and receipts." />

      <div className="space-y-3 p-6 sm:px-10">
        {documents.map((doc) => (
          <Card key={doc.name} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[var(--color-brown)]" />
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{doc.type}</p>
              </div>
            </div>
            <button className="rounded-full p-2 hover:bg-[var(--color-ink)]/5" aria-label={`Download ${doc.name}`}>
              <Download className="h-4 w-4" />
            </button>
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
