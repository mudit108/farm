import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata: Metadata = { title: "Refund & Cancellation Policy | Mera Khet" };

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund & Cancellation Policy" lastUpdated="[Date to be finalized]">
      <DraftNotice />

      <h2>1. Before sowing begins</h2>
      <p>
        If you cancel your membership <strong>more than 14 days before
        the season&apos;s sowing date</strong>, you&apos;ll receive a{" "}
        <strong>50% refund</strong> to the original payment method, within{" "}
        <strong>[7–10]</strong> business days — at this point we&apos;ve
        already committed seed, labor, and plot-preparation costs against
        your allocation, which the retained half covers.
      </p>

      <h2>2. Within 14 days of sowing, or after sowing has begun</h2>
      <p>
        <strong>Membership fees are non-refundable</strong> once you&apos;re
        within 14 days of the season&apos;s sowing date, and for the rest
        of the season once sowing has actually started. Your plot
        allocation and the remainder of that season&apos;s benefits
        (updates, camera access, harvest) continue as normal — cancelling
        at this stage means forfeiting the membership, not receiving
        money back.
      </p>

      <h2>3. If we cancel or can&apos;t fulfill your allocation</h2>
      <p>
        In the rare case we&apos;re unable to allocate your plots at all
        (e.g. a season is called off before sowing), you&apos;ll receive a
        full refund, no deduction.
      </p>

      <h2>4. Crop shortfall or failure is not a cancellation</h2>
      <p>
        A lower-than-estimated harvest, or a partial or total crop loss, is
        a normal agricultural risk (see
        our <a href="/disclaimer" className="text-[var(--color-green)] underline">Disclaimer</a>) and is not, by itself, grounds for a refund
        under this policy — your membership already delivered the
        cultivation, monitoring, and harvest-fulfillment service it
        promised. Each member receives their share of whatever is harvested,
        as set out in the Membership Agreement.
      </p>

      <h2>5. Unpaid balance (paying in two parts)</h2>
      <p>
        If you chose to pay in two parts, the balance is due 45 days after
        your deposit. After the due date a late fee is added (₹2,000 for
        Kothi, ₹5,000 for Annakosh, ₹10,000 for Mahabhandar). If the
        balance is still unpaid 55 days after the deposit, your plots are
        released, and your deposit is treated as a cancellation made on
        that date under sections 1 and 2 above: a 50% refund of the deposit
        if that date is more than 14 days before the season&apos;s sowing
        date, otherwise no refund. The split-payment convenience fee and any
        late fee are not refundable.
      </p>

      <h2>6. How to cancel</h2>
      <p>
        Contact us via the <Link href="/#contact" className="text-[var(--color-green)] underline">contact form</Link>, including your registered
        email and plot number(s), and we&apos;ll confirm your refund
        eligibility and timeline based on the sections above.
      </p>
    </LegalPageLayout>
  );
}
