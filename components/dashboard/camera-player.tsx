/**
 * Plays a farm camera's stream in the member dashboard.
 *
 * Browsers can't play raw RTSP (what most CCTV cameras speak), so the
 * camera must be relayed to something a browser understands. Supported:
 * - YouTube Live (easiest: an unlisted live stream) — any youtube.com /
 *   youtu.be link is turned into an embed;
 * - any https page meant for embedding (e.g. a camera cloud's share/embed link);
 * - a direct video link (.mp4, or .m3u8 on phones and Safari).
 */
function youTubeEmbed(url: URL): string | null {
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (url.pathname.startsWith("/live/") || url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
  }
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1` : null;
}

export function CameraPlayer({ streamUrl, title }: { streamUrl: string; title: string }) {
  let url: URL | null = null;
  try {
    url = new URL(streamUrl);
  } catch {
    url = null;
  }

  if (!url || url.protocol !== "https:") {
    return (
      <div className="flex aspect-video items-center justify-center bg-[var(--color-ink)] px-8 text-center text-sm text-white/60">
        The live feed is being set up — please check back soon.
      </div>
    );
  }

  const yt = youTubeEmbed(url);
  if (/\.(mp4|m3u8)$/i.test(url.pathname) && !yt) {
    return (
      <video
        src={url.toString()}
        className="aspect-video w-full bg-black"
        autoPlay
        muted
        playsInline
        controls
        aria-label={title}
      />
    );
  }

  return (
    <iframe
      src={yt ?? url.toString()}
      title={title}
      className="aspect-video w-full border-0 bg-black"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
