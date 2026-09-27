import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Newspaper, Package, Sprout, Video, Wallet, ClipboardCheck, Users } from "lucide-react";
import { getMyInstallmentPlans } from "@/app/actions/payment";
import { Panel, PlotMap, PlotMapLegend, ProgressBar, SeasonJourney, Facts } from "@/components/dashboard/ui";
import { currentCrop, summarizePlotHoldings, FEEDING_FAMILIES_PER_PLOT, todayInIndia } from "@/lib/demo-data";
import { stageDetails, inr } from "@/lib/site-content";
import { daysBetween, formatDay, stageWhenLabels } from "@/lib/season-timeline";
import { getPlanCards } from "@/lib/public-data";
import { createSessionClient } from "@/lib/supabase/session";
import heroPhoto from "@/public/images/wheat-ear-macro.jpg";
import camStill from "@/public/images/cctv/cam-main-field.jpg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Overview | Mera Khet", robots: { index: false } };

type MyPlot = {
  plot_number: number;
  status: "available" | "filled";
  plan_id: string | null;
  assigned_at: string | null;
  approved_at: string | null;
};
type Season = {
  current_stage: string;
  progress: number;
  sowing_date: string | null;
  estimated_harvest: string | null;
  season_label: string;
  registration_deadline: string | null;
  registrations_paused: boolean;
};
type Update = { id: string; title: string; description: string; created_at: string; photo_url: string | null };
type GridPlot = { plot_number: number; status: "available" | "filled" };

export default async function DashboardOverview() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: seasonData }, { data: updatesData }, { data: gridData }] = await Promise.all([
    supabase.rpc("khet_club_get_season"),
    supabase.from("khet_club_updates").select("id, title, description, created_at, photo_url").order("created_at", { ascending: false }).limit(3),
    supabase.rpc("khet_club_all_plot_statuses"),
  ]);
  const season = (seasonData as Season[] | null)?.[0] ?? null;
  const recentUpdates = (updatesData ?? []) as Update[];
  const latestUpdate = recentUpdates[0] ?? null;
  const earlierUpdates = recentUpdates.slice(1);
  const grid = (gridData ?? []) as GridPlot[];

  let myPlots: MyPlot[] = [];
  let cameraOnline = false;
  let confirmedTotalKg: number | null = null;
  let deliveredKg = 0;
  let hasCertificate = false;
  let paidPaise = 0;
  let balances: Awaited<ReturnType<typeof getMyInstallmentPlans>> = [];
  if (user) {
    balances = await getMyInstallmentPlans();
    const [{ data }, { data: cameraData }, { data: prefData }, { data: deliveryData }, { count: certCount }, { data: paymentData }] =
      await Promise.all([
        supabase
          .from("khet_club_plots")
          .select("plot_number, status, plan_id, assigned_at, approved_at")
          .eq("user_id", user.id)
          .order("plot_number"),
        supabase.rpc("khet_club_my_camera"),
        supabase.from("khet_club_harvest_preferences").select("confirmed_total_kg").eq("user_id", user.id).maybeSingle(),
        // Voided deliveries must never count toward the member's total.
        supabase.from("khet_club_harvest_deliveries").select("kg_delivered").eq("user_id", user.id).is("voided_at", null),
        supabase.from("khet_club_certificates").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("khet_club_payments").select("amount").eq("user_id", user.id).eq("status", "paid"),
      ]);
    myPlots = (data ?? []) as MyPlot[];
    cameraOnline = ((cameraData as { status: string }[] | null) ?? []).some((c) => c.status === "online");
    confirmedTotalKg = prefData?.confirmed_total_kg ?? null;
    deliveredKg = ((deliveryData ?? []) as { kg_delivered: number }[]).reduce((sum, d) => sum + d.kg_delivered, 0);
    hasCertificate = (certCount ?? 0) > 0;
    paidPaise = ((paymentData ?? []) as { amount: number }[]).reduce((sum, p) => sum + p.amount, 0);
  }

  // Greeting by India time — the farm and nearly every member are there.
  const hour = Number(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const rawFirst = ((user?.user_metadata?.full_name as string | undefined) ?? "").trim().split(/\s+/)[0];
  const firstName = rawFirst ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1) : "";

  const hasPlots = myPlots.length > 0;
  const holdings = summarizePlotHoldings(myPlots);
  const plotList = myPlots.map((p) => `#${p.plot_number}`).join(", ");
  const confirmed = hasPlots && myPlots.every((p) => p.approved_at);
  const today = todayInIndia();
  const seasonLabel = season?.season_label ?? "This season";

  // Where the season is: counting down to sowing, or counting the days since.
  const stages = currentCrop.stages;
  const stageIndex = season ? Math.max(stages.indexOf(season.current_stage), 0) : 0;
  const stageName = stages[stageIndex];
  const stageCopy = stageDetails[stageName];
  const sowing = season?.sowing_date ?? null;
  const harvest = season?.estimated_harvest ?? null;
  const countdown =
    sowing && today < sowing
      ? { k: "Sowing in", v: String(daysBetween(today, sowing)), u: daysBetween(today, sowing) === 1 ? "day" : "days", s: formatDay(sowing, "long") }
      : sowing && harvest && today <= harvest
        ? { k: "Season day", v: String(daysBetween(sowing, today) + 1), u: "", s: `Harvest ~${formatDay(harvest)}` }
        : season
          ? { k: "Stage", v: "", u: stageName, s: seasonLabel }
          : null;

  const heroLine = hasPlots
    ? `${confirmed ? "Your" : "Your reserved"} ${holdings.label} ${myPlots.length > 1 ? "plots are" : "plot is"} ${
        confirmed ? "confirmed" : "awaiting our team's confirmation"
      } for ${seasonLabel}.${sowing && today < sowing ? ` Sowing begins ${formatDay(sowing)}.` : ` Now: ${stageName.toLowerCase()}.`}`
    : "Choose a plan to claim your plot — then follow it here from sowing to harvest.";

  const held = balances.filter((b) => b.plots_still_held);
  const balanceDue = held.reduce((s, b) => s + b.balance_due_inr, 0);

  const bookingsOpen =
    !season?.registrations_paused && !(season?.registration_deadline && today > season.registration_deadline);
  const plans = hasPlots ? [] : await getPlanCards();

  const families = Math.round(((myPlots.length * FEEDING_FAMILIES_PER_PLOT) / 1000) * 2);
  const sowingStarted = stageIndex >= 1;

  return (
    <div className="mk-page-pad space-y-6">
      {/* Welcome */}
      <section className="mk-hero">
        <Image src={heroPhoto} alt="" fill preload sizes="(min-width: 1280px) 1120px, 100vw" placeholder="blur" className="mk-hero-img" />
        <div className="mk-hero-shade" aria-hidden="true" />
        <div className="mk-hero-body">
          <div className="mk-hero-copy">
            <p className="mk-hero-eyebrow">
              {seasonLabel}
              {hasPlots ? ` · ${plotList}` : " · Sujangarh, Rajasthan"}
            </p>
            <h1>
              {greeting}
              {firstName && (
                <>
                  , <em>{firstName}</em>
                </>
              )}
            </h1>
            <p className="mk-hero-sub">{heroLine}</p>
            <div className="mk-hero-actions">
              {hasPlots ? (
                <>
                  <Link href="/dashboard/my-farm" className="mk-btn mk-btn-gold">
                    Open my farm <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href="/dashboard/crop-cycle" className="mk-btn mk-btn-glass">
                    Farm activity
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard/select-plot" className="mk-btn mk-btn-gold">
                    Choose your plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href="/how-it-works" className="mk-btn mk-btn-glass">
                    How it works
                  </Link>
                </>
              )}
            </div>
          </div>
          {countdown && (
            <div className="mk-hero-count">
              <span className="mk-hero-count-k">{countdown.k}</span>
              <span className="mk-hero-count-v">
                {countdown.v}
                {countdown.u && <small>{countdown.u}</small>}
              </span>
              <span className="mk-hero-count-s">{countdown.s}</span>
            </div>
          )}
        </div>
      </section>

      {/* Balance due */}
      {balanceDue > 0 && (
        <Link href="/dashboard/my-farm" className="mk-alert">
          <span className="mk-alert-icon" aria-hidden="true">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="mk-alert-body">
            <b>Balance due: {inr(balanceDue)}</b>
            <span>
              Due {formatDay(held[0].balance_due_date, "long")} — pay from My Farm to keep your plots.
            </span>
          </span>
          <span className="mk-alert-cta">
            Pay now <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      )}

      {/* Season journey */}
      {season && (
        <Panel
          icon={Sprout}
          label="Season journey"
          action={<span className="mk-chip">{season.progress}% complete</span>}
        >
          <SeasonJourney stages={stages} current={stageIndex} when={stageWhenLabels(stages, sowing, harvest)} />
          {stageCopy && (
            <div className="mk-now">
              <p className="mk-now-k">
                Now · <b>{stageName}</b>
              </p>
              <p className="mk-now-desc">{stageCopy.desc}</p>
              <p className="mk-now-see">
                <span>What you&apos;ll see</span> {stageCopy.see}
              </p>
            </div>
          )}
        </Panel>
      )}

      {hasPlots ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            icon={MapPin}
            label={myPlots.length > 1 ? "Your plots" : "Your plot"}
            className="mk-panel-col"
            action={
              <Link href="/dashboard/my-farm" className="mk-more">
                Details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            <div className="mk-plot-split">
              {grid.length > 0 && (
                <div>
                  <PlotMap grid={grid} mine={myPlots.map((p) => p.plot_number)} />
                  <PlotMapLegend />
                </div>
              )}
              <Facts
                className="mk-facts-stack"
                items={[
                  { label: "Plan", value: `${holdings.label}${holdings.isMixedPlans ? " (mixed)" : ""}` },
                  { label: "Status", value: confirmed ? "Confirmed" : "Awaiting approval" },
                  { label: "Area", value: `${holdings.areaSqFt.toLocaleString("en-IN")} sq ft` },
                  { label: "Paid so far", value: inr(paidPaise / 100) },
                ]}
              />
            </div>
            <p className="mk-panel-note">
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>
                The whole farm&apos;s harvest is shared equally across every plot — your share never depends on which corner of the field is yours.
              </span>
            </p>
          </Panel>

          <div className="grid min-w-0 gap-6">
            <Panel icon={Package} label="Your harvest">
              {confirmedTotalKg ? (
                <>
                  <p className="mk-big">
                    {deliveredKg.toLocaleString("en-IN")} <small>of {confirmedTotalKg.toLocaleString("en-IN")} kg delivered</small>
                  </p>
                  <ProgressBar value={(deliveredKg / confirmedTotalKg) * 100} tone="green" label="Harvest delivered" />
                  <p className="mk-muted mt-3">
                    {deliveredKg >= confirmedTotalKg
                      ? "Fully delivered — enjoy every roti."
                      : `${(confirmedTotalKg - deliveredKg).toLocaleString("en-IN")} kg still to come.`}
                  </p>
                </>
              ) : (
                <>
                  <p className="mk-big">
                    {holdings.wheatMinKg.toLocaleString("en-IN")}–{holdings.wheatMaxKg.toLocaleString("en-IN")} <small>kg estimated</small>
                  </p>
                  <p className="mk-muted">
                    Your share is weighed and confirmed after harvest{harvest ? ` (~${formatDay(harvest)})` : ""}, then deliveries begin. Estimates, not
                    guarantees.
                  </p>
                </>
              )}
              <Link href="/dashboard/my-farm#harvest" className="mk-more mt-4">
                Harvest choice &amp; delivery <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Panel>

            <Panel icon={Heart} label="Your impact" className="mk-panel-warm">
              <p className="mk-big">
                {inr(myPlots.length * FEEDING_FAMILIES_PER_PLOT)} <small>to the Feeding Families Fund</small>
              </p>
              <p className="mk-muted">
                Wheat for roughly {families} {families === 1 ? "family" : "families"} in need — included in your membership, not an extra charge.
              </p>
              <Link href="/dashboard/my-farm" className="mk-more mt-4">
                {hasCertificate ? "Certificate & receipts" : "Receipts & story card"} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Panel>
          </div>
        </div>
      ) : (
        <Panel
          icon={ClipboardCheck}
          label="Choose your plan"
          action={
            <Link href="/dashboard/select-plot" className="mk-more">
              Compare
            </Link>
          }
        >
          <div className="mk-plan-tiles">
            {plans.map((p) => (
              <Link key={p.id} href="/dashboard/select-plot" className={p.id === "3-plots" ? "mk-plan-tile is-featured" : "mk-plan-tile"}>
                <span className="mk-plan-name">{p.name}</span>
                <span className="mk-plan-sub">
                  {p.label} · {p.wheatMinKg.toLocaleString("en-IN")}–{p.wheatMaxKg.toLocaleString("en-IN")} kg wheat
                </span>
                {p.strikePriceInr && <s className="mk-plan-was">{inr(p.strikePriceInr)}</s>}
                <span className="mk-plan-price">{inr(p.priceInr)}</span>
              </Link>
            ))}
          </div>
          <p className="mk-muted mt-4">
            {bookingsOpen
              ? season?.registration_deadline
                ? `Bookings close ${formatDay(season.registration_deadline, "long")}. Pay in full, or 50% now and 50% later.`
                : "Pay in full, or 50% now and 50% later."
              : season?.registrations_paused
                ? "Bookings are paused for a short while — check back soon."
                : "Bookings for this season have closed."}
          </p>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          icon={Newspaper}
          label="Latest from the farm"
          className="lg:col-span-3"
          action={
            <Link href="/dashboard/crop-cycle?tab=updates" className="mk-more">
              All updates
            </Link>
          }
        >
          {latestUpdate ? (
            <article className="mk-update">
              <p className="mk-update-date">
                {new Date(latestUpdate.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
              </p>
              <h3>{latestUpdate.title}</h3>
              <p className="mk-update-text">{latestUpdate.description}</p>
              {latestUpdate.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL from any host
                <img src={latestUpdate.photo_url} alt="" loading="lazy" className="mk-update-photo" />
              )}
              {earlierUpdates.length > 0 && (
                <ul className="mk-earlier">
                  {earlierUpdates.map((u) => (
                    <li key={u.id}>
                      <span>{new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</span>
                      {u.title}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ) : (
            <p className="mk-muted">No updates published yet — the first one will appear here.</p>
          )}
        </Panel>

        <Link href="/dashboard/crop-cycle?tab=live-camera" className="mk-cam-teaser lg:col-span-2">
          <Image src={camStill} alt="" fill sizes="(min-width: 1024px) 440px, 100vw" placeholder="blur" />
          <span className="mk-cam-teaser-shade" aria-hidden="true" />
          <span className="mk-cam-teaser-top">
            <span className={sowingStarted && cameraOnline ? "mk-live-dot is-on" : "mk-live-dot"} aria-hidden="true" />
            {sowingStarted && cameraOnline ? "Live now" : "Farm camera"}
          </span>
          <span className="mk-cam-teaser-body">
            <Video className="h-5 w-5" aria-hidden="true" />
            <b>{sowingStarted ? (cameraOnline ? "Watch your field live" : "Your camera view") : "Watch from sowing day"}</b>
            <span>
              {sowingStarted
                ? cameraOnline
                  ? "The field right now, from the farm camera."
                  : "The live view appears here as soon as your camera is online."
                : `Live camera access opens when sowing begins${sowing ? ` on ${formatDay(sowing)}` : ""}. This is a still from before sowing.`}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
