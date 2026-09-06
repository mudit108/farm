import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata: Metadata = { title: "Terms of Service | Mera Khet" };

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="[Date to be finalized]">
      <DraftNotice />

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the
        Mera Khet website and dashboard, operated by{" "}
        <strong>MK Farms</strong> (&quot;Mera Khet,&quot;
        &quot;we,&quot; &quot;us&quot;). By creating an account or using
        this site, you agree to these Terms. The commercial terms of an
        actual membership purchase are covered separately in our{" "}
        <a href="/membership-agreement" className="text-[var(--color-green)] underline">Membership Agreement</a>.
      </p>

      <h2>1. Accounts</h2>
      <p>
        You must provide accurate information when creating an account and
        keep your login credentials confidential. You&apos;re responsible
        for activity under your account. Tell us right away if you
        suspect unauthorized access.
      </p>

      <h2>2. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the site for any unlawful purpose</li>
        <li>Attempt to access another member&apos;s account, plot data, or dashboard</li>
        <li>Interfere with the site&apos;s normal operation (e.g. automated scraping of plot data, attempting to bypass access controls)</li>
        <li>Misrepresent your identity when registering</li>
      </ul>

      <h2>3. Content and intellectual property</h2>
      <p>
        Text, photos, and design on this site belong to Mera Khet or are
        used with permission, and may not be reproduced without our
        written consent. Photos and camera snapshots shown to you as a
        member are for your personal, non-commercial use.
      </p>

      <h2>4. Accuracy of information</h2>
      <p>
        We try to keep crop stage, weather, and plot availability
        information accurate and current, but we don&apos;t guarantee it
        is error-free at every moment — treat dashboard data as
        informational, not as the sole basis for time-sensitive decisions.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        Certain features rely on third-party providers — payments
        (Razorpay), messaging (WhatsApp Business, email delivery) — whose
        own terms also apply to those interactions.
      </p>

      <h2>6. Termination</h2>
      <p>
        We may suspend or terminate an account that violates these Terms.
        This does not affect any membership already validly purchased,
        which continues to be governed by the Membership Agreement for
        that season.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        The site and dashboard are provided &quot;as is.&quot; To the
        maximum extent permitted by law, we are not liable for indirect or
        consequential damages arising from your use of the site.
      </p>

      <h2>8. Governing law</h2>
      <p>
        These Terms are governed by the laws of India, with disputes
        subject to the courts of <strong>[City, State]</strong>.
      </p>

      <h2>9. Changes</h2>
      <p>We may update these Terms from time to time; continued use of the site after a change means you accept the updated Terms.</p>

      <h2>10. Contact</h2>
      <p>
        Questions can be sent via our{" "}
        <Link href="/#contact" className="text-[var(--color-green)] underline">contact form</Link>.
      </p>
    </LegalPageLayout>
  );
}
