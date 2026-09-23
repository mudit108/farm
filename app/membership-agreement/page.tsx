import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { DraftNotice } from "@/components/legal/draft-notice";
import { getHarvestDistribution } from "@/lib/harvest-distribution";

export const metadata: Metadata = { title: "Membership Agreement | Mera Khet" };

// Reads the live harvest-distribution setting, so Section 4 always
// matches what's actually configured at /admin/crops.
export const dynamic = "force-dynamic";

export default async function MembershipAgreementPage() {
  const distribution = await getHarvestDistribution();

  return (
    <LegalPageLayout title="Membership Agreement" lastUpdated="[Date to be finalized]">
      <DraftNotice />

      <p>
        This Membership Agreement (&quot;Agreement&quot;) is between{" "}
        <strong>MK Farms</strong> (&quot;Mera Khet,&quot;
        &quot;we,&quot; &quot;us&quot;) and the individual who purchases a
        seasonal farm plot membership (&quot;you,&quot; &quot;Member&quot;)
        through www.merakhet.in or its dashboard.
      </p>

      <h2>1. What you are purchasing</h2>
      <p>
        Your membership gives you a <strong>contractual allocation of, and
        participation in, a designated area of farm plots</strong> (1, 3,
        or 6 plots, each plot 7,260 sq ft) at Mera Khet&apos;s farm in
        Sujangarh, Rajasthan, for one crop season, together with the services
        described in Section 3.
      </p>
      <p>Your membership does <strong>not</strong>, unless a separate signed document explicitly states otherwise:</p>
      <ul>
        <li>Transfer legal ownership, title, or any registrable interest in agricultural land</li>
        <li>Guarantee any specific crop yield, wheat quantity, or quality</li>
        <li>Guarantee any financial return, profit, or resale value</li>
        <li>Create a partnership, joint venture, or employment relationship between you and Mera Khet</li>
      </ul>

      <h2>2. Seasonal, not annual</h2>
      <p>
        Membership covers exactly one crop season (currently: wheat, sown
        near Diwali through spring harvest). There is no automatic renewal
        and no ongoing commitment — you may choose to purchase a new
        membership for a future season, at the pricing then in effect.
      </p>

      <h2>3. What&apos;s included</h2>
      <ul>
        <li>Cultivation of your allocated plots by experienced local farmers, with fertilizer applied based on soil testing and crop need, and no harmful chemicals used for the purpose of increasing yield — see our <Link href="/disclaimer" className="text-[var(--color-green)] underline">Disclaimer</Link> for our current organic certification status</li>
        <li>Live camera access to the field your plots are in, via your dashboard, 24×7 from sowing to harvest, subject to weather and network connectivity at the farm (when the live stream is unavailable, the most recent photo is shown instead)</li>
        <li>The farm&apos;s test results, shared with members every month</li>
        <li>Periodic farm updates (photos, notes, crop-stage changes)</li>
        <li>Eligibility to request a farm visit, subject to scheduling and operational availability</li>
        <li>Your choice of harvest fulfillment: home delivery, processing into flour, or sale to market on your behalf (Section 7)</li>
        <li>Milling and packing of your harvest, done in-house at the farm, at no extra charge</li>
      </ul>

      <h2>4. How the harvest is divided</h2>
      {distribution.model === "pooled" ? (
        <>
          <p>
            The farm&apos;s <strong>total harvest for the season is pooled
            and divided by the total number of plots</strong>. Each
            member then receives a share proportional to the number of
            plots in their membership — a 1-plot member receives one
            share, a 3-plot member receives three, and so on.
          </p>
          <p>
            This means your share is <strong>not</strong> the literal
            output of the specific plot numbers assigned to you. It is an
            equal per-plot share of the whole farm&apos;s harvest. The
            practical effect is that you are not exposed to your own
            plots individually performing worse than the rest of the
            farm — but equally, your share depends on the farm&apos;s
            overall performance, not just your own plots.
          </p>
          {distribution.deductionPercent > 0 && (
            <p>
              <strong>{distribution.deductionPercent}%</strong> of the
              total harvest is retained before this division (for
              example, for seed stock or wastage allowance); the
              remainder is what gets divided among plots.
            </p>
          )}
        </>
      ) : (
        <p>
          Each member receives the actual harvest from the specific plots
          assigned to their membership.
          {distribution.deductionPercent > 0 && (
            <>
              {" "}<strong>{distribution.deductionPercent}%</strong> is
              retained before distribution (for example, for seed stock
              or wastage allowance).
            </>
          )}
        </p>
      )}

      <h2>5. Wheat quantity is an estimate, not a promise</h2>
      <p>
        The wheat ranges shown for each plan (e.g. 250–300 kg for a single
        plot) are <strong>typical-yield estimates</strong> based on
        expected yields for this variety and region, not commitments. Actual harvest depends
        on weather, soil conditions, pests, water availability,
        and other factors outside our control. If actual yield is lower
        than the estimated range, no refund or make-up delivery is owed
        solely on that basis — see Section 9 for how we handle more
        serious crop loss.
      </p>

      <h2>6. Payment</h2>
      <p>
        Membership fees are paid at the time of plot selection, via our
        payment processor (Razorpay), either in full or in two parts. Plots
        are only assigned to you once payment is verified. Prices are per
        season and may change between seasons; the price you paid for your
        current season&apos;s membership does not change after purchase.
      </p>
      <p>
        <strong>Paying in two parts.</strong> You may pay 50% of the price
        (plus a convenience fee of ₹300 for Kothi or ₹500 for Annakosh and
        Mahabhandar) to reserve, and your plots are assigned immediately.
        The remaining 50% is due <strong>45 days</strong> after the deposit.
        If it is not paid by the due date, a late fee is added:{" "}
        <strong>₹2,000</strong> for Kothi, <strong>₹5,000</strong> for
        Annakosh and <strong>₹10,000</strong> for Mahabhandar. If the
        balance and late fee are still unpaid <strong>55 days</strong> after
        the deposit, your plots are released and may be allocated to
        someone else, and your deposit is treated as a cancellation on that
        date under our Refund &amp; Cancellation Policy. The convenience fee
        and any late fee are not refundable.
      </p>
      <p>
        <strong>₹1,000 per plot</strong> of your membership price is
        earmarked toward the Feeding Families Fund — donating wheat to
        families in need. This is not an additional charge; it is part
        of the price shown to you at checkout, itemized there for
        transparency.
      </p>

      <h2>7. Receiving your harvest</h2>
      <p>You choose one of the following, from your dashboard, after the crop is harvested and weighed:</p>
      <ul>
        <li><strong>Home delivery</strong> of the raw harvest (delivery charges billed separately)</li>
        <li><strong>Processing</strong> into flour (atta), milled and packed in-house at the farm at no extra charge, then delivered to you (delivery charges billed separately)</li>
        <li><strong>Sale to the market</strong> on your behalf, with proceeds sent to you at prevailing market rates at the time of sale (not guaranteed in advance)</li>
      </ul>
      <p>
        For either delivery option, you may choose to receive your harvest
        as a single delivery or split into monthly instalments of a size
        you specify.
      </p>

      <h2>8. Certificates and plot approval</h2>
      <p>
        Plot allocation is confirmed at the time of payment. A formal
        membership certificate is issued once your allocation is reviewed
        and approved by our team, and is made available for download from
        your dashboard and sent to your registered email.
      </p>

      <h2>9. Crop failure and other agricultural risk</h2>
      <p>
        Agriculture is inherently seasonal and subject to weather, soil
        conditions, pests, water availability, and other natural factors
        beyond our control. We follow standard agronomic practices to
        manage this risk, but we do not guarantee against partial or total
        crop loss.
      </p>
      <p>
        If the crop is partly or wholly lost, each member receives their
        share of whatever is actually harvested, divided as described in
        Section 4. Membership fees are not refunded, credited or reduced
        because of a low or failed harvest, since the cultivation, care,
        monitoring and fulfilment services covered by this Agreement are
        still provided. Throughout the season we will keep members informed
        through the dashboard, camera access and monthly test results.
      </p>

      <h2>10. Cancellation and refunds</h2>
      <p>
        See our separate <a href="/refund-policy" className="text-[var(--color-green)] underline">Refund &amp; Cancellation Policy</a> for the specific terms and timelines.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Mera Khet&apos;s total
        liability to you under this Agreement is limited to the amount you
        paid for your current season&apos;s membership. We are not liable
        for indirect, incidental, or consequential losses.
      </p>

      <h2>12. Governing law</h2>
      <p>
        This Agreement is governed by the laws of India. Disputes are
        subject to the exclusive jurisdiction of the courts of{" "}
        <strong>[City, State]</strong>.
      </p>

      <h2>13. Changes to this Agreement</h2>
      <p>
        We may update this Agreement between seasons. Changes apply to
        memberships purchased after the update — not retroactively to a
        season you&apos;ve already paid for.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about this Agreement can be sent via our{" "}
        <Link href="/#contact" className="text-[var(--color-green)] underline">contact form</Link>.
      </p>
    </LegalPageLayout>
  );
}
