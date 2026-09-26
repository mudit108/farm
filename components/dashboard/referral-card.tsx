import { Gift, MessageCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { CopyButton } from "@/components/dashboard/copy-button";
import { createServiceClient } from "@/lib/supabase/service";
import { getOrCreateReferralCode, getReferralSettings } from "@/lib/payments/referrals";

type Reward = { id: string; referee_user_id: string; reward_inr: number; status: string; created_at: string };

/**
 * "Invite a friend" on My Farm. Only shown while the admin has the
 * referral program switched on, and only to members who hold plots.
 * Uses the service client server-side, scoped strictly to this member.
 */
export async function ReferralCard({ userId, fullName }: { userId: string; fullName: string | null }) {
  const admin = createServiceClient();
  const settings = await getReferralSettings(admin);
  if (!settings.enabled) return null;

  const code = await getOrCreateReferralCode(admin, userId, fullName);
  if (!code) return null;

  const { data } = await admin
    .from("khet_club_referral_rewards")
    .select("id, referee_user_id, reward_inr, status, created_at")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false });
  const rewards = (data ?? []) as Reward[];

  // First names only — a member sees who joined through them, not their
  // email or phone.
  const firstNames = new Map<string, string>();
  for (const r of rewards) {
    const { data: u } = await admin.auth.admin.getUserById(r.referee_user_id);
    const name = ((u?.user?.user_metadata?.full_name as string) ?? "").trim().split(/\s+/)[0];
    firstNames.set(r.referee_user_id, name || "A friend");
  }

  const earned = rewards.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.reward_inr, 0);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.merakhet.in";
  const link = `${site}/auth/signup?ref=${code}`;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const message =
    `I've got my own wheat plot at Mera Khet in Rajasthan 🌾 — sign up with my link and get ${inr(settings.friend_discount_inr)} off your plot: ${link}` +
    ` (or use code ${code} at checkout)`;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-[var(--color-brown)]" />
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Invite friends</p>
      </div>
      <p className="mt-2 text-sm">
        Your friend gets <strong>{inr(settings.friend_discount_inr)} off</strong> their first plot, and you get{" "}
        <strong>{inr(settings.referrer_reward_inr)}</strong> for every friend who joins.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-brown)]/50 bg-[var(--color-gold)]/10 px-3 py-1.5 font-mono-data text-base font-semibold tracking-wider">
          {code}
        </span>
        <CopyButton text={code} label="Copy code" />
        <CopyButton text={link} label="Copy link" />
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-green)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
        </a>
      </div>

      {rewards.length > 0 ? (
        <div className="mt-5 border-t border-[var(--color-ink)]/10 pt-4">
          <p className="text-xs text-[var(--color-ink-soft)]">
            {rewards.length} friend{rewards.length === 1 ? "" : "s"} joined · {inr(earned)} earned
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {rewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <span>
                  {firstNames.get(r.referee_user_id)} · {inr(r.reward_inr)}
                </span>
                <Badge tone={r.status === "paid" ? "green" : r.status === "cancelled" ? "brown" : "gold"}>
                  {r.status === "paid" ? "Paid to you" : r.status === "cancelled" ? "Cancelled" : "Pending"}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-[var(--color-ink-soft)]">
            Rewards are paid out by our team after your friend&apos;s purchase is confirmed.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[var(--color-ink-soft)]">No friends have joined with your code yet.</p>
      )}
    </Card>
  );
}
