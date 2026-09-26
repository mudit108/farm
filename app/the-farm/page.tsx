import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { PageHero, SectionHead } from "@/components/site/heads";
import { CountUp, Rule, Section } from "@/components/site/motion";
import { CameraViewer } from "@/components/site/camera-viewer";
import { getFarmUpdates, getPlotCounts, getSeason } from "@/lib/public-data";
import { currentCrop } from "@/lib/demo-data";
import entrance from "@/public/images/cctv/cam-farm-entrance.jpg";
import mainField from "@/public/images/cctv/cam-main-field.jpg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Farm | Mera Khet — Cameras, Updates & Location",
  description:
    "See the actual farm in Sujangarh, Rajasthan: camera coverage, the current crop stage, recent farm updates, and how to visit in person. You don't have to take our word for it.",
  alternates: { canonical: "/the-farm" },
};

const fmtDate = (d: string | null, fallback: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : fallback;

export default async function TheFarmPage() {
  const [season, counts, updates] = await Promise.all([getSeason(), getPlotCounts(), getFarmUpdates(5)]);
  const tonnes = season?.warehouse_capacity_tonnes ?? 30;
  const progress = Math.min(Math.max(season?.progress ?? 0, 0), 100);

  return (
    <SiteFrame>
      <PageHero
        crumb="The Farm"
        lines={["You don't have to take", "our word for it."]}
        lead="Real land in Sujangarh, Rajasthan — with cameras on it, a season you can follow, and an open invitation to come and stand in the field yourself."
        jumps={[
          { href: "#land", label: "The land" },
          { href: "#camera", label: "The cameras" },
          { href: "#updates", label: "Farm updates" },
          { href: "#visit", label: "Visit us" },
        ]}
      >
        <div className="photo-slot filled hero-photo fade d7" style={{ marginTop: 64 }}>
          <Image src={entrance} alt="The Mera Khet farm gate, with a solar-powered camera on its pole overlooking the field" fill priority sizes="(min-width: 1180px) 1100px, 100vw" placeholder="blur" style={{ objectPosition: "center 42%" }} />
          <span className="band-cap">Farm entrance · gate camera on solar power</span>
        </div>
      </PageHero>

      <Section id="land" className="section" style={{ paddingTop: 40 }}>
        <div className="mk-wrap">
          <div className="land-wrap">
            <div>
              <SectionHead num="01 — The Land" title={["A way back", "to the field."]} style={{ marginBottom: 30 }} />
              <div className="land-copy">
                <p className="fade d3">
                  Mera Khet started with a family that had farmed for generations — and a generation that had drifted away from it, until almost no
                  farming was left. This farm is the way back.
                </p>
                <p className="fade d4">
                  The farming is done by experienced farmers from our own village, so every season also means steady work close to home. The business
                behind it, MK Farms, is named after the founder&apos;s grandparents. Everything you&apos;ll read
                  about — the plots, the cameras, the storage — sits on one piece of land in Sujangarh that you are welcome to visit.
                </p>
                <p className="fade d5">
                  This is our first season. We won&apos;t show you photos of a harvest that hasn&apos;t happened. Instead, you can watch this one unfold,
                  from the day the field is prepared.
                </p>
              </div>
            </div>
            <div className="facts">
              <div className="card fact-card fade d2">
                <p className="fact-num">
                  <CountUp to={counts.total || 80} />
                </p>
                <p className="fact-label">Plots this season, each 7,260 sq ft of farmland</p>
              </div>
              <div className="card fact-card fade d3">
                <p className="fact-num">
                  <CountUp to={tonnes} />
                  <span className="unit">t</span>
                </p>
                <p className="fact-label">On-site storage warehouse — your harvest never leaves our hands</p>
              </div>
              <div className="card fact-card fade d4">
                <p className="fact-num">24×7</p>
                <p className="fact-label">Live camera on the field, on your dashboard from sowing</p>
              </div>
              <div className="card fact-card fade d5">
                <p className="fact-num">
                  1<span className="unit">st</span>
                </p>
                <p className="fact-label">Season — early members are founding members</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="camera" className="section">
        <div className="mk-wrap">
          <SectionHead center num="02 — The Cameras" title={["Look for yourself."]} lead="Field cameras watch over the plots, and members see them live on their dashboard from sowing. These are real stills from them, taken before sowing — switch between views below." />
          <CameraViewer />
          <div className="season-strip fade d3">
            <div className="ss-cell">
              <p className="ss-label">Crop</p>
              <p className="ss-val">
                {currentCrop.name} ({currentCrop.localName})
              </p>
            </div>
            <div className="ss-cell">
              <p className="ss-label">Sowing</p>
              <p className="ss-val">{fmtDate(season?.sowing_date ?? null, "Near Diwali")}</p>
            </div>
            <div className="ss-cell">
              <p className="ss-label">Est. harvest</p>
              <p className="ss-val">{fmtDate(season?.estimated_harvest ?? null, "Spring")}</p>
            </div>
            <div className="ss-cell">
              <p className="ss-label">Now · {season?.current_stage ?? "Field Preparation"}</p>
              <p className="ss-val">{progress}% of the season</p>
              <div className="ss-bar">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="cam-how">
            {[
              "Live camera access is a member benefit from sowing to harvest — 24×7, on your dashboard, for the field your plots are in.",
              "If weather or the farm's network drops the stream, you'll see the latest photo instead — labelled as a photo, never passed off as live.",
              "The camera system is run by our team. Its credentials are never shared with members.",
              "Every member also gets the farm's test results every month, alongside the camera and field updates.",
            ].map((t, i) => (
              <p key={t} className={`cam-how-item fade d${i + 2}`}>
                <span className="tick-dot" />
                <span>{t}</span>
              </p>
            ))}
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="updates" className="section">
        <div className="mk-wrap">
          <SectionHead center num="03 — Farm Updates" title={["Following the season, together."]} lead="Our farmers post photos, notes and crop-stage changes as they happen. The latest five appear here." />
          {updates.length > 0 ? (
            <div className="updates">
              {updates.map((u, i) => (
                <div key={u.id} className={`update fade d${Math.min(i + 2, 8)}`}>
                  <p className="update-date">{fmtDate(u.created_at, "")}</p>
                  <div>
                    <h3>{u.title}</h3>
                    <p>{u.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card updates-empty fade d2">
              <p>The first update of the season will appear here as field work begins. Members see every update on their dashboard timeline.</p>
            </div>
          )}
          {updates.length > 0 && <p className="feed-note fade d5">Members see every update on their dashboard timeline, not just the latest five.</p>}
        </div>
      </Section>

      <Section id="visit" className="section" style={{ paddingTop: 20 }}>
        <div className="mk-wrap">
          <div className="card visit-card fade">
            <div className="photo-slot filled visit-photo">
              <Image src={mainField} alt="The main field at Mera Khet, Sujangarh" fill sizes="(min-width: 960px) 560px, 100vw" placeholder="blur" style={{ objectPosition: "center 60%" }} />
              <span className="band-cap">Main field · Sujangarh</span>
            </div>
            <div className="visit-copy">
              <span className="section-num">04 — Visit</span>
              <h2>Your farm isn&apos;t just on a screen.</h2>
              <p>
                Members can visit Mera Khet and stand in their own plot. Requests are raised from your dashboard, which also shows your exact plot numbers —
                so you can walk straight to them when you arrive.
              </p>
              <ul className="conds">
                <li>Scheduled in advance</li>
                <li>Subject to farm conditions</li>
                <li>Safety requirements apply</li>
                <li>Operational availability</li>
              </ul>
              <div className="loc">
                <svg width="20" height="24" viewBox="0 0 20 24" fill="none" aria-hidden="true">
                  <path d="M10 23C10 23 2 15 2 9.5C2 5 5.6 1.5 10 1.5C14.4 1.5 18 5 18 9.5C18 15 10 23 10 23Z" stroke="#B4872E" strokeWidth="1.5" />
                  <circle cx="10" cy="9.5" r="3" stroke="#B4872E" strokeWidth="1.5" />
                </svg>
                <div>
                  <strong>Sujangarh, Rajasthan</strong>
                  <span>Exact plot coordinates are shared with members after allocation. We don&apos;t publish a private address.</span>
                </div>
              </div>
              <div className="hero-actions" style={{ margin: "28px 0 0" }}>
                <Link href="/dashboard/farm-visit" className="btn btn-primary">
                  <span>Plan a farm visit</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="section cta" style={{ paddingTop: 20 }}>
        <div className="mk-wrap">
          <h2>
            <span className="line">
              <span>Seen enough?</span>
            </span>
          </h2>
          <p className="fade d4">Reserve a plot for {season?.season_label || "this season"} and follow it from sowing to harvest.</p>
          <div className="hero-actions fade d5">
            <Link href="/plans" className="btn btn-primary">
              <span>See plans &amp; pricing</span>
            </Link>
            <Link href="/how-it-works" className="btn btn-ghost">
              <span>How it works</span>
            </Link>
          </div>
        </div>
      </Section>
    </SiteFrame>
  );
}
