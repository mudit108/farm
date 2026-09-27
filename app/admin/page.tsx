import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Download,
  Grid3x3,
  HandCoins,
  Heart,
  IndianRupee,
  LifeBuoy,
  Mail,
  MapPin,
  Megaphone,
  Receipt,
  Sprout,
  UserPlus,
  Users,
  Video,
  Wheat,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel, PlotMap, ProgressBar, Facts } from "@/components/dashboard/ui";
import { listAllUsers } from "@/lib/supabase/list-all-users";
import { createServiceClient } from "@/lib/supabase/service";
import { membershipPlans, FEEDING_FAMILIES_PER_PLOT, todayInIndia } from "@/lib/demo-data";
import { daysBetween, formatDay } from "@/lib/season-timeline";
import { inr } from "@/lib/site-content";

export const dynamic = "force-dynamic";

// Same route segment as the admin layout, so its title template doesn't apply here.
export const metadata: Metadata = { title: { absolute: "Overview · Admin | Mera Khet" } };

type PlotRow = { plot_number: number; status: "available" | "filled"; user_id: string | null; claim_batch_id: string | null };
type PaymentRow = {
  id: string;
  user_id: string | null;
  plan_id: string;
  amount: number;
  status: string;
  payment_kind: "full" | "deposit" | "balance";
  claim_batch_id: string | null;
  created_at: string;
};
type Season = {
  season_label: string;
  current_stage: string;
  progress: number;
  sowing_date: string | null;
  estimated_harvest: string | null;
  registration_deadline: string | null;
  registrations_paused: boolean;
};

export default async function AdminOverview() {
  const supabase = createServiceClient();
  const today = todayInIndia();

  const [
    { data: plotsData },
    { data: usersData },
    { data: camerasData },
    { count: pendingVisits },
    { data: paymentsData },
    { data: seasonRows },
    { count: openSupport },
    { count: newContacts },
    { count: pendingHarvestChanges },
    { data: balancesData },
  ] = await Promise.all([
    supabase.from("khet_club_plots").select("plot_number, status, user_id, claim_batch_id").order("plot_number"),
    listAllUsers(supabase),
    supabase.from("khet_club_cameras").select("id, status"),
    supabase.from("khet_club_farm_visits").select("id", { count: "exact", head: true }).eq("status", "requested"),
    // Current season only — closing a season stamps its payments with archived_season_id.
    supabase
      .from("khet_club_payments")
      .select("id, user_id, plan_id, amount, status, payment_kind, claim_batch_id, created_at")
      .eq("status", "paid")
      .is("archived_season_id", null)
      .order("created_at", { ascending: false }),
    supabase.rpc("khet_club_get_season"),
    supabase.from("khet_club_support_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("khet_club_contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("khet_club_harvest_preference_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("khet_club_installment_plans").select("user_id, claim_batch_id, balance_due_inr, balance_due_date").eq("balance_paid", false),
  ]);

  const plots = (plotsData ?? []) as PlotRow[];
  const users = usersData?.users ?? [];
  const usersById = new Map(users.map((u) => [u.id, u]));
  const nameOf = (id: string | null) => {
    const u = id ? usersById.get(id) : undefined;
    return ((u?.user_metadata?.full_name as string | undefined) || u?.email || "Unknown").trim();
  };
  const season = (seasonRows as Season[] | null)?.[0] ?? null;

  // Plots and members
  const totalPlots = plots.length;
  const filledPlots = plots.filter((p) => p.status === "filled").length;
  const openPlots = totalPlots - filledPlots;
  const members = new Set(plots.filter((p) => p.user_id).map((p) => p.user_id)).size;
  const fillPct = totalPlots ? (filledPlots / totalPlots) * 100 : 0;

  // Money — the same rules as Finance: a 50/50 balance belongs to the purchase
  // its deposit started, so it counts toward revenue but not toward orders or
  // the Feeding Families Fund.
  const paid = (paymentsData ?? []) as PaymentRow[];
  const revenue = paid.reduce((s, p) => s + p.amount, 0) / 100;
  const orders = paid.filter((p) => p.payment_kind !== "balance");
  const plotsInPlan = new Map(membershipPlans.map((p) => [p.id, p.plots]));
  const fund = orders.reduce((s, p) => s + (plotsInPlan.get(p.plan_id) ?? 0) * FEEDING_FAMILIES_PER_PLOT, 0);
  const needsReview = orders.filter((p) => !p.claim_batch_id).length;

  // Balances past their due date whose plots are still held
  const heldBatches = new Set(plots.filter((p) => p.claim_batch_id).map((p) => `${p.user_id}:${p.claim_batch_id}`));
  const overdue = ((balancesData ?? []) as { user_id: string; claim_batch_id: string; balance_due_inr: number; balance_due_date: string }[]).filter(
    (b) => b.balance_due_date < today && heldBatches.has(`${b.user_id}:${b.claim_batch_id}`)
  );
  const overdueTotal = overdue.reduce((s, b) => s + b.balance_due_inr, 0);

  const cameras = (camerasData ?? []) as { id: string; status: string }[];
  const camerasOnline = cameras.filter((c) => c.status === "online").length;

  const attention = [
    { n: pendingVisits ?? 0, icon: MapPin, label: "Farm visit requests", hint: "Waiting for approve or decline", href: "/admin/visits", urgent: false },
    { n: openSupport ?? 0, icon: LifeBuoy, label: "Member support messages", hint: "Open, not yet answered", href: "/admin/communications?tab=support", urgent: true },
    { n: newContacts ?? 0, icon: Mail, label: "New contact-form messages", hint: "From the website", href: "/admin/communications?tab=contact", urgent: false },
    { n: pendingHarvestChanges ?? 0, icon: Wheat, label: "Harvest choice changes", hint: "Members asking to switch", href: "/admin/members?tab=harvest", urgent: false },
    { n: needsReview, icon: AlertTriangle, label: "Paid orders with no plots", hint: "Refund or assign plots by hand", href: "/admin/income", urgent: true },
    {
      n: overdue.length,
      icon: HandCoins,
      label: "Overdue 50/50 balances",
      hint: overdue.length ? `${inr(overdueTotal)} past due — follow up` : "Nothing past due",
      href: "/admin/income",
      urgent: true,
    },
  ];
  const openItems = attention.filter((a) => a.n > 0);

  const sowing = season?.sowing_date ?? null;
  const harvest = season?.estimated_harvest ?? null;
  const deadline = season?.registration_deadline ?? null;
  const bookingsOpen = !season?.registrations_paused && !(deadline && today > deadline);
  const sowingLine =
    sowing && today < sowing
      ? `sowing in ${daysBetween(today, sowing)} day${daysBetween(today, sowing) === 1 ? "" : "s"}`
      : sowing && harvest && today <= harvest
        ? `day ${daysBetween(sowing, today) + 1} of the season`
        : "";

  const recentPayments = paid.slice(0, 5);
  const newestAccounts = [...users].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 5);
  const holders = new Set(plots.filter((p) => p.user_id).map((p) => p.user_id));
  const planName = (id: string) => membershipPlans.find((p) => p.id === id)?.name ?? id;
  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

  return (
    <div>
      <PageHeader
        eyebrow={`Admin · ${season?.season_label ?? "Mera Khet"}`}
        title="Farm overview"
        subtitle={`Sujangarh, Rajasthan${sowingLine ? ` · ${sowingLine}` : ""}`}
      />

      <div className="mk-page-pad space-y-6">
        {/* Key numbers */}
        <div className="mk-kpis">
          <div className="mk-kpi is-dark">
            <div className="mk-kpi-head">
              <span className="mk-kpi-label">Plots reserved</span>
              <span className="mk-kpi-icon" aria-hidden="true">
                <Grid3x3 className="h-4 w-4" />
              </span>
            </div>
            <p className="mk-kpi-value">
              {filledPlots} <small>/ {totalPlots}</small>
            </p>
            <ProgressBar value={fillPct} label="Plots reserved" />
            <p className="mk-kpi-sub mt-2">
              {openPlots} still open · {Math.round(fillPct)}% full
            </p>
          </div>
          <div className="mk-kpi">
            <div className="mk-kpi-head">
              <span className="mk-kpi-label">Members</span>
              <span className="mk-kpi-icon" aria-hidden="true">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <p className="mk-kpi-value">{members}</p>
            <p className="mk-kpi-sub">
              holding plots · {users.length} account{users.length === 1 ? "" : "s"} in total
            </p>
          </div>
          <div className="mk-kpi">
            <div className="mk-kpi-head">
              <span className="mk-kpi-label">Revenue this season</span>
              <span className="mk-kpi-icon" aria-hidden="true">
                <IndianRupee className="h-4 w-4" />
              </span>
            </div>
            <p className="mk-kpi-value">{inr(revenue)}</p>
            <p className="mk-kpi-sub">
              {orders.length} order{orders.length === 1 ? "" : "s"} paid
              {orders.length ? ` · avg ${inr(revenue / orders.length)}` : ""}
            </p>
          </div>
          <div className="mk-kpi">
            <div className="mk-kpi-head">
              <span className="mk-kpi-label">Feeding Families</span>
              <span className="mk-kpi-icon" aria-hidden="true">
                <Heart className="h-4 w-4" />
              </span>
            </div>
            <p className="mk-kpi-value">{inr(fund)}</p>
            <p className="mk-kpi-sub">earmarked from paid orders</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Panel
            icon={CalendarCheck}
            label="Needs attention"
            action={<span className="mk-chip">{openItems.length ? `${openItems.length} to check` : "All clear"}</span>}
          >
            <div className="mk-attn">
              {attention.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className={a.n === 0 ? "mk-attn-row is-clear" : a.urgent ? "mk-attn-row is-urgent" : "mk-attn-row"}
                >
                  <span className="mk-attn-icon" aria-hidden="true">
                    <a.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="mk-attn-body">
                    <b>{a.label}</b>
                    <span>{a.hint}</span>
                  </span>
                  <span className="mk-attn-count">{a.n === 0 ? <CheckCircle2 className="mx-auto h-4 w-4" aria-label="None" /> : a.n}</span>
                </Link>
              ))}
            </div>
            {openItems.length === 0 && (
              <p className="mk-allclear">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Nothing waiting on you right now.
              </p>
            )}
          </Panel>

          <Panel
            icon={Grid3x3}
            label="The farm, plot by plot"
            action={
              <Link href="/admin/members?tab=plots" className="mk-more">
                All plots <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {plots.length > 0 ? (
              <>
                <PlotMap grid={plots.map((p) => ({ plot_number: p.plot_number, status: p.status }))} mine={[]} size="lg" />
                <p className="mk-map-legend">
                  <span>
                    <i className="is-taken" /> Reserved · {filledPlots}
                  </span>
                  <span>
                    <i /> Available · {openPlots}
                  </span>
                </p>
              </>
            ) : (
              <p className="mk-list-empty">No plots set up yet — set the farm size on Crops &amp; Season.</p>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            icon={Sprout}
            label="Season"
            action={
              <Link href="/admin/crops" className="mk-more">
                Edit <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {season ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="mk-big" style={{ marginBottom: 0 }}>{season.current_stage}</p>
                  <span className={bookingsOpen ? "mk-status-pill is-open" : "mk-status-pill is-closed"}>
                    {season.registrations_paused ? "Bookings paused" : bookingsOpen ? "Bookings open" : "Bookings closed"}
                  </span>
                </div>
                <div className="my-4">
                  <ProgressBar value={season.progress} label="Season progress" />
                  <p className="mk-muted mt-2">{season.progress}% through the season</p>
                </div>
                <Facts
                  items={[
                    { label: "Sowing", value: sowing ? formatDay(sowing) : "Not set" },
                    { label: "Harvest (est.)", value: harvest ? formatDay(harvest) : "Not set" },
                    { label: "Bookings close", value: deadline ? formatDay(deadline) : "No deadline" },
                    { label: "Cameras online", value: `${camerasOnline} of ${cameras.length}` },
                  ]}
                />
              </>
            ) : (
              <p className="mk-list-empty">Season details couldn&apos;t be loaded.</p>
            )}
          </Panel>

          <Panel
            icon={Receipt}
            label="Latest payments"
            action={
              <Link href="/admin/income" className="mk-more">
                Finance <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {recentPayments.length ? (
              <ul className="mk-list">
                {recentPayments.map((p) => (
                  <li key={p.id}>
                    <span className="mk-list-avatar" aria-hidden="true">
                      {nameOf(p.user_id).charAt(0).toUpperCase()}
                    </span>
                    <span className="mk-list-main">
                      <b>{nameOf(p.user_id)}</b>
                      <span>
                        {planName(p.plan_id)}
                        {p.payment_kind === "deposit" ? " · 50% deposit" : p.payment_kind === "balance" ? " · balance" : ""}
                      </span>
                    </span>
                    <span className="mk-list-side">
                      <b>{inr(p.amount / 100)}</b>
                      {shortDate(p.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mk-list-empty">No paid orders this season yet.</p>
            )}
          </Panel>

          <Panel
            icon={UserPlus}
            label="Newest accounts"
            action={
              <Link href="/admin/members?tab=accounts" className="mk-more">
                Accounts <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {newestAccounts.length ? (
              <ul className="mk-list">
                {newestAccounts.map((u) => {
                  const name = ((u.user_metadata?.full_name as string | undefined) || u.email || "Unknown").trim();
                  return (
                    <li key={u.id}>
                      <span className="mk-list-avatar" aria-hidden="true">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <span className="mk-list-main">
                        <b>{name}</b>
                        <span>{holders.has(u.id) ? "Holds plots" : (u.user_metadata?.city as string | undefined) || "No plot yet"}</span>
                      </span>
                      <span className="mk-list-side">{u.created_at ? shortDate(u.created_at) : ""}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mk-list-empty">No accounts yet.</p>
            )}
          </Panel>
        </div>

        <Panel icon={Megaphone} label="Shortcuts">
          <div className="mk-tools">
            <Link href="/admin/communications?tab=updates" className="mk-tool">
              <Megaphone className="h-5 w-5" aria-hidden="true" />
              <span>
                <b>Post a farm update</b>
                <span>Shows on every member&apos;s dashboard.</span>
              </span>
            </Link>
            <Link href="/admin/members" className="mk-tool">
              <Users className="h-5 w-5" aria-hidden="true" />
              <span>
                <b>Assign an offline plan</b>
                <span>Phone or walk-in reservations.</span>
              </span>
            </Link>
            <Link href="/admin/cctv" className="mk-tool">
              <Video className="h-5 w-5" aria-hidden="true" />
              <span>
                <b>Cameras</b>
                <span>
                  {camerasOnline} of {cameras.length} online — add or assign.
                </span>
              </span>
            </Link>
            <a href="/api/admin/export/all" className="mk-tool">
              <Download className="h-5 w-5" aria-hidden="true" />
              <span>
                <b>Export everything</b>
                <span>All data as CSVs in one ZIP. Contains personal data — store it securely.</span>
              </span>
            </a>
          </div>
        </Panel>
      </div>
    </div>
  );
}
