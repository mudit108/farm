import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata: Metadata = { title: "Disclaimer | Mera Khet" };

export default function DisclaimerPage() {
  return (
    <LegalPageLayout title="Disclaimer" lastUpdated="[Date to be finalized]">
      <DraftNotice />

      <h2>Not a guaranteed-return investment</h2>
      <p>
        Mera Khet is a farm plot membership, not a financial investment
        product. We do not claim, promise, or imply guaranteed returns,
        guaranteed crop yield, guaranteed profits, or legal ownership of
        agricultural land. Membership terms are governed by our{" "}
        <a href="/membership-agreement" className="text-[var(--color-green)] underline">Membership Agreement</a>.
      </p>

      <h2>Agricultural risk</h2>
      <p>
        Farming outcomes depend on weather, soil, pests, water
        availability, and other natural factors we don&apos;t control.
        Wheat quantities shown per plan are typical-yield estimates, not
        commitments — actual harvest can be higher or lower.
      </p>

      <h2>Organic Claims and Certification Status</h2>
      <p>
        Fertilizer is applied based on soil testing and each
        crop&apos;s actual needs, rather than indiscriminate use. This
        is Mera Khet&apos;s first season, and we do not currently hold
        formal third-party organic certification. We are actively
        working toward it, aiming to reach certified organic status by
        next season, and will name the certifying body here once
        obtained. Until then, please treat any mention of &quot;organic&quot;
        on this site as a stated goal, not a current or certified
        status.
      </p>

      <h2>Health and nutrition information</h2>
      <p>
        Any nutritional or health-related statements on this site (for
        example, about whole wheat atta retaining more fiber and
        micronutrients than refined flour, or about a particular wheat
        variety&apos;s reputation for roti quality) describe general,
        well-established facts about wheat and whole grains, or the
        documented reputation of the named variety — they are not medical
        advice, and are not claims that consuming our wheat treats,
        prevents, or cures any condition. Consult a qualified professional
        for dietary advice specific to your health.
      </p>

      <h2>Live camera and photos</h2>
      <p>
        Where a plot&apos;s live camera stream isn&apos;t yet connected,
        we show a recent photo instead — clearly labeled as such, not
        presented as a live feed. Photos on the public website are real
        photos from Mera Khet&apos;s farm and operations, used to
        illustrate the farm generally rather than any one member&apos;s
        specific plot.
      </p>

      <h2>Third-party services</h2>
      <p>
        Payment processing, messaging, and hosting are provided by
        third-party services (see our{" "}
        <a href="/privacy" className="text-[var(--color-green)] underline">Privacy Policy</a>). We aren&apos;t responsible for outages or
        issues originating from those providers, though we&apos;ll work to
        resolve their impact on your experience.
      </p>
    </LegalPageLayout>
  );
}
