import Image from "next/image";
import { Radio } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { createSessionClient } from "@/lib/supabase/session";
import { cn } from "@/lib/utils";
import samplePhoto from "@/public/images/cctv/cam-main-field.jpg";

export const dynamic = "force-dynamic";

type CameraStatus = { camera_name: string; status: string };

export default async function LiveCameraPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase.rpc("khet_club_my_camera");
  const camera = (data as CameraStatus[] | null)?.[0] ?? null;
  const isOnline = camera?.status === "online";

  return (
    <div>
      <PageHeader title="Live Camera" subtitle="24×7 view of your plot, when connected." />

      <div className="p-6 sm:px-10">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-ink)]/10 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={cn("h-2 w-2 rounded-full", isOnline ? "live-dot bg-[var(--color-live)]" : "bg-[var(--color-ink)]/30")} />
              {camera ? `${camera.camera_name} — ${camera.status}` : "No camera assigned yet"}
            </div>
          </div>

          {camera ? (
            <div className="relative aspect-video bg-[var(--color-ink)]">
              <Image
                src={samplePhoto}
                alt={`Recent sample view from ${camera.camera_name}`}
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover opacity-90"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                <p className="text-xs text-white/80">
                  Sample view — live video streaming for your camera isn&apos;t
                  connected yet. This is a recent photo, not your real-time feed.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[var(--color-ink)]">
              <div className="flex flex-col items-center gap-3 px-8 text-center text-white/50">
                <Radio className="h-8 w-8" />
                <p className="max-w-xs text-sm">
                  A camera hasn&apos;t been assigned to your plot yet. Check
                  back once our team sets one up.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
