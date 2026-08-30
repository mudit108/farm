import { Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";

const customers = [
  { name: "Priya Sharma", email: "priya@example.com", plot: "A-024", status: "active" },
  { name: "Arjun Mehta", email: "arjun@example.com", plot: "A-002", status: "active" },
  { name: "Kavita Rao", email: "kavita@example.com", plot: "A-005", status: "pending" },
];

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" subtitle="Search, view membership, and manage access." />

      <div className="p-6 sm:px-10">
        <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--color-ink)]/15 bg-[var(--color-surface)] px-4 py-2">
          <Search className="h-4 w-4 text-[var(--color-ink-soft)]" />
          <input placeholder="Search customers…" className="w-full bg-transparent text-sm outline-none" />
        </div>

        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Plot</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink)]/10">
              {customers.map((c) => (
                <tr key={c.email}>
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-[var(--color-ink-soft)]">{c.email}</td>
                  <td className="px-5 py-3 font-mono-data">{c.plot}</td>
                  <td className="px-5 py-3">
                    <Badge tone={c.status === "active" ? "green" : "brown"}>{c.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs font-medium text-[var(--color-green)]">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
