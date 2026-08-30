import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const visits = [
  { customer: "Priya Sharma", date: "5 Sep 2026", visitors: 2, status: "pending" },
  { customer: "Arjun Mehta", date: "20 Aug 2026", visitors: 1, status: "completed" },
];

export default function VisitsPage() {
  return (
    <div>
      <PageHeader title="Visit Requests" subtitle="Approve or decline customer farm-visit requests." />

      <div className="space-y-4 p-6 sm:px-10">
        {visits.map((v) => (
          <Card key={v.customer + v.date} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-medium">{v.customer}</p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                {v.date} · {v.visitors} visitor{v.visitors > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={v.status === "pending" ? "gold" : "green"}>{v.status}</Badge>
              {v.status === "pending" && (
                <>
                  <Button size="sm" variant="outline">Decline</Button>
                  <Button size="sm">Approve</Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
