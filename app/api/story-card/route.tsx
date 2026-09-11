import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { createSessionClient } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

/**
 * Generates a personalized, shareable "I Have a Khet" story card (9:16,
 * matching Instagram/WhatsApp Story dimensions) for the logged-in
 * member. Always derives name, plots, and season from the
 * authenticated session server-side — a member can only ever generate
 * their OWN card. Nothing here accepts a name or plot number from the
 * client.
 *
 * Ported from a Python/Pillow prototype built earlier in this project.
 * Two real lessons carried over from that prototype, not re-learned
 * here from scratch:
 *  - Fraunces and Noto Sans are bundled as STATIC instances
 *    (lib/fonts/Fraunces-Regular.ttf etc.), not the variable fonts
 *    used elsewhere in the app. Satori's font parser cannot read a
 *    variable font's `fvar` table at all — it throws outright, not a
 *    silent fallback. Confirmed by testing the variable file directly
 *    against this exact pipeline before switching to static instances.
 *  - Gold text does not reliably read against this photo — the sky is
 *    warm-toned enough that gold-on-photo measured under 2:1 contrast
 *    in the prototype. The tagline uses white; gold is reserved for
 *    text sitting on the cream panel or the darkest lower third of the
 *    photo, where it was verified to read clearly.
 */
export async function GET() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const [{ data: plotRows }, { data: seasonRow }] = await Promise.all([
    supabase.from("khet_club_plots").select("plot_number").eq("user_id", user.id).order("plot_number"),
    supabase.rpc("khet_club_get_season"),
  ]);

  const plotNumbers = ((plotRows ?? []) as { plot_number: number }[]).map((r) => r.plot_number);
  if (plotNumbers.length === 0) {
    return NextResponse.json(
      { error: "Reserve a plot first — there's nothing to share yet." },
      { status: 400 }
    );
  }

  const fullName = ((user.user_metadata?.full_name as string) || "Mera Khet Member").trim();
  const season = (seasonRow as { season_label: string }[] | null)?.[0];
  const seasonLabel = season?.season_label ?? "Current Season";

  const fontDir = path.join(process.cwd(), "lib/fonts");
  const [frauncesBuf, notoRegBuf, notoBoldBuf, bgBuf] = await Promise.all([
    readFile(path.join(fontDir, "Fraunces-Regular.ttf")),
    readFile(path.join(fontDir, "NotoSans-Regular.ttf")),
    readFile(path.join(fontDir, "NotoSans-Bold.ttf")),
    readFile(path.join(process.cwd(), "public/images/story-card-bg.jpg")),
  ]);
  const bgDataUri = `data:image/jpeg;base64,${bgBuf.toString("base64")}`;

  const qrDataUri = await QRCode.toDataURL("https://www.merakhet.in", {
    margin: 1,
    width: 300,
    color: { dark: "#232920", light: "#FFFFFF" },
  });

  // Real per-member numbers, matching the exact math already live on
  // the dashboard's "Your Impact" card (\u20b91,000/plot, 2 families
  // per \u20b91,000) — every card states a fact specific to that
  // member, not a stock line every card repeats identically.
  const familiesFed = plotNumbers.length * 2;
  const plotWord = plotNumbers.length === 1 ? "plot" : "plots";
  const verb = plotNumbers.length === 1 ? "is" : "are";
  const impactLine = `My ${plotWord} ${verb} feeding ${familiesFed} families, too.`;
  const plotLabel = "Plot " + plotNumbers.map((n) => `#${n}`).join(", ");

  // Real text measurement isn't available in this render path, so the
  // name size is a character-count heuristic rather than a precise
  // fit — deliberately conservative, and the panel width has real
  // margin either side of the longest realistic name.
  const nameSize = fullName.length <= 14 ? 68 : fullName.length <= 20 ? 56 : fullName.length <= 26 ? 46 : 38;

  const GOLD = "#C79A4B";
  const CREAM = "#F7F3E9";
  const INK = "#232920";
  const INK_SOFT = "#5B6357";
  const GREEN_DEEP = "#263422";

  const image = new ImageResponse(
    (
      <div style={{ display: "flex", width: 1080, height: 1920, position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgDataUri}
          width={1080}
          height={1920}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            // Stronger at the top than a typical bottom-only vignette
            // — verified necessary against this specific photo's warm
            // sky (see file header). A weaker top gradient measured
            // under 2:1 text contrast in the prototype.
            background:
              "linear-gradient(180deg, rgba(35,41,32,0.55) 0%, rgba(35,41,32,0.62) 24%, rgba(35,41,32,0.78) 65%, rgba(35,41,32,0.90) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 1080,
            height: 1920,
            padding: "70px 60px",
          }}
        >
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 52, color: "#fff" }}>MERA KHET</div>
          <div
            style={{
              display: "flex",
              fontFamily: "NotoSansBold",
              fontSize: 21,
              letterSpacing: 3,
              color: "#fff",
              marginTop: 10,
            }}
          >
            APNA KHET. APNI PEHCHAN.
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              background: CREAM,
              border: `3px solid ${GOLD}`,
              borderRadius: 28,
              marginTop: 190,
              padding: "56px 50px 50px 50px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "NotoSansBold",
                fontSize: 28,
                letterSpacing: 4,
                color: GREEN_DEEP,
              }}
            >
              I HAVE A KHET
            </div>
            <div style={{ display: "flex", width: 120, height: 2, background: GOLD, marginTop: 24, marginBottom: 40 }} />

            <div style={{ display: "flex", fontFamily: "NotoSans", fontSize: 25, color: INK_SOFT }}>
              This wheat is being grown for
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: nameSize,
                color: INK,
                marginTop: 28,
                textAlign: "center",
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "NotoSansBold",
                fontSize: 30,
                color: GREEN_DEEP,
                marginTop: 26,
              }}
            >
              {plotLabel}
            </div>
            <div style={{ display: "flex", fontFamily: "NotoSans", fontSize: 21, color: INK_SOFT, marginTop: 14 }}>
              {seasonLabel}
            </div>

            <div
              style={{
                display: "flex",
                width: "100%",
                height: 1,
                background: GOLD,
                marginTop: 44,
                marginBottom: 44,
              }}
            />

            <div style={{ display: "flex", fontFamily: "NotoSansBold", fontSize: 20, color: INK }}>
              I know exactly where my food comes from.
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "NotoSansBold",
                fontSize: 20,
                color: GREEN_DEEP,
                marginTop: 14,
              }}
            >
              {impactLine}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 90 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUri}
              width={170}
              height={170}
              style={{ borderRadius: 12, background: "#fff", padding: 10 }}
            />
            <div style={{ display: "flex", fontFamily: "NotoSans", fontSize: 19, color: "#fff", marginTop: 26 }}>
              Scan to reserve your own plot
            </div>
            {/* White, not gold -- the hashtag sits over a mid-tone
                region of the photo where gold measured poor contrast
                when actually rendered (same root cause as the tagline
                fix noted at the top of this file: gold reads reliably
                only on the cream panel or the darkest lower third of
                the photo, not against this photo's warm mid-tones). */}
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 32, color: "#fff", marginTop: 12 }}>
              #MyMeraKhet
            </div>
            <div
              style={{ display: "flex", fontFamily: "NotoSansBold", fontSize: 19, color: "#fff", marginTop: 12 }}
            >
              www.merakhet.in
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: "Fraunces", data: frauncesBuf, weight: 600, style: "normal" },
        { name: "NotoSans", data: notoRegBuf, weight: 400, style: "normal" },
        { name: "NotoSansBold", data: notoBoldBuf, weight: 700, style: "normal" },
      ],
    }
  );

  // Force a real download rather than an inline render, and use the
  // member's own name in the filename so a saved file is identifiable
  // without opening it.
  const headers = new Headers(image.headers);
  const safeName = fullName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  headers.set("Content-Disposition", `attachment; filename="mera-khet-story-${safeName}.png"`);
  return new Response(image.body, { headers, status: 200 });
}
