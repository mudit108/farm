import { Video } from "lucide-react";
import { ActionForm } from "@/components/admin/action-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import { adminUpsertCamera, adminDeleteCamera } from "@/app/actions/admin-content";

export const dynamic = "force-dynamic";

type Camera = {
  id: string;
  plot_number: number | null;
  name: string;
  stream_url: string | null;
  status: "online" | "offline" | "not_configured";
};

export default async function CctvManagementPage() {
  const supabase = createServiceClient();
  const [{ data }, { count: totalPlots }] = await Promise.all([
    supabase.from("khet_club_cameras").select("id, plot_number, name, stream_url, status").order("name"),
    supabase.from("khet_club_plots").select("plot_number", { count: "exact", head: true }),
  ]);
  const cameras = (data ?? []) as Camera[];
  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const maxPlot = totalPlots ?? 80;

  return (
    <div>
      <PageHeader title="CCTV" subtitle="Assign cameras to plots and configure stream sources." />

      <div className="p-6 sm:px-10">
        <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
          {onlineCount} of {cameras.length} online
        </p>

        {/* Add camera */}
        <Card className="p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Add Camera
          </p>
          <ActionForm action={adminUpsertCamera} className="mt-4 grid gap-3 sm:grid-cols-4">
            <input name="name" required placeholder="Camera name" className="input" />
            <input name="plotNumber" type="number" min={1} max={maxPlot} placeholder="Plot # (optional)" className="input" />
            <input name="streamUrl" placeholder="rtsp:// or https://…m3u8" className="input" />
            <select name="status" defaultValue="not_configured" className="input">
              <option value="not_configured">Not configured</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <Button type="submit" size="sm" className="sm:col-span-4">
              Add Camera
            </Button>
          </ActionForm>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cameras.map((cam) => (
            <Card key={cam.id} className="p-5">
              <div className="flex items-center justify-between">
                <Video className="h-5 w-5 text-[var(--color-brown)]" />
                <Badge tone={cam.status === "online" ? "green" : "brown"}>{cam.status}</Badge>
              </div>
              <p className="mt-3 text-sm font-medium">{cam.name}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Plot: {cam.plot_number ?? "—"}
              </p>

              <ActionForm action={adminUpsertCamera} className="mt-4 space-y-2">
                <input type="hidden" name="id" value={cam.id} />
                <input name="name" defaultValue={cam.name} className="input" placeholder="Name" />
                <input name="plotNumber" type="number" min={1} max={maxPlot} defaultValue={cam.plot_number ?? ""} className="input" placeholder="Plot #" />
                <input name="streamUrl" defaultValue={cam.stream_url ?? ""} className="input" placeholder="Stream URL" />
                <select name="status" defaultValue={cam.status} className="input">
                  <option value="not_configured">Not configured</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" variant="outline" className="flex-1">
                    Save
                  </Button>
                </div>
              </ActionForm>
              <ActionForm action={adminDeleteCamera} className="mt-2" confirmMessage="Remove this camera?">
                <input type="hidden" name="id" value={cam.id} />
                <button className="text-xs font-medium text-[var(--color-live)] hover:underline">Delete</button>
              </ActionForm>
            </Card>
          ))}
        </div>

        <p className="mt-6 max-w-lg text-xs text-[var(--color-ink-soft)]">
          Stream URLs and camera credentials are stored server-side only.
          Customers only ever see camera name and status for their own
          plot — never the raw URL. Actual video streaming infrastructure
          still needs to be connected separately.
        </p>
      </div>
    </div>
  );
}
