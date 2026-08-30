import { Plus, Video } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const cameras = [
  { name: "Camera 01 — Main Field", plot: "A-024", status: "online" },
  { name: "Camera 02 — Farm Entrance", plot: "—", status: "online" },
  { name: "Camera 03 — Crop Area", plot: "A-002", status: "offline" },
];

export default function CctvManagementPage() {
  return (
    <div>
      <PageHeader title="CCTV" subtitle="Assign cameras to plots and configure stream sources." />

      <div className="p-6 sm:px-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--color-ink-soft)]">
            {cameras.filter((c) => c.status === "online").length} of {cameras.length} online
          </p>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Camera
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cameras.map((cam) => (
            <Card key={cam.name} className="p-5">
              <div className="flex items-center justify-between">
                <Video className="h-5 w-5 text-[var(--color-brown)]" />
                <Badge tone={cam.status === "online" ? "green" : "brown"}>{cam.status}</Badge>
              </div>
              <p className="mt-3 text-sm font-medium">{cam.name}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">Plot: {cam.plot}</p>

              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">
                  Stream URL (stored securely, never sent to customers)
                </span>
                <input className="input" placeholder="rtsp:// or https://…m3u8" />
              </label>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Save</Button>
                <Button size="sm" variant="ghost" className="flex-1">
                  {cam.status === "online" ? "Disable" : "Enable"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-6 max-w-lg text-xs text-[var(--color-ink-soft)]">
          Stream URLs and camera credentials are stored server-side only.
          Customers only ever receive a signed, scoped playback URL for
          their own plot — never raw camera credentials.
        </p>
      </div>
    </div>
  );
}
