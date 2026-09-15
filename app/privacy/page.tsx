import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata: Metadata = { title: "Privacy Policy | Mera Khet" };

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="[Date to be finalized]">
      <DraftNotice />

      <p>
        This Privacy Policy explains what personal information{" "}
        <strong>MK Farms</strong> (&quot;Mera Khet,&quot;
        &quot;we,&quot; &quot;us&quot;) collects through this website and
        dashboard, and how it&apos;s used.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> full name, email address, phone number, and password (stored securely, hashed — we never see or store your plaintext password)</li>
        <li><strong>Membership details:</strong> which plots and plans you&apos;ve purchased, your harvest delivery preference, and your farm visit requests</li>
        <li><strong>Payment details:</strong> transaction ID, amount, and status from our payment processor (Razorpay). We do not store your card, UPI, or bank account details — those are handled entirely by Razorpay</li>
        <li><strong>Messages:</strong> anything you submit via the contact form, WhatsApp, or the in-dashboard support form</li>
        <li><strong>Usage data:</strong> basic technical logs (e.g. sign-in times) generated automatically by our infrastructure providers</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To create and manage your account and plot allocation</li>
        <li>To process payments and issue your membership certificate</li>
        <li>To send farm updates, delivery notifications, and respond to your messages — by email and/or WhatsApp, using the contact details you provide</li>
        <li>To improve the site and diagnose technical issues</li>
      </ul>
      <p>We do not sell your personal information to third parties.</p>

      <h2>3. Who we share it with</h2>
      <p>We use the following service providers to run Mera Khet, each of whom processes your data only as needed to provide their service to us:</p>
      <ul>
        <li><strong>Supabase</strong> — database hosting and account authentication</li>
        <li><strong>Razorpay</strong> — payment processing</li>
        <li><strong>Resend</strong> — transactional email delivery</li>
        <li><strong>Meta (WhatsApp Business Platform)</strong> — WhatsApp messages you receive from us</li>
      </ul>
      <p>
        We don&apos;t share your information with other members, and camera
        access is scoped so members only ever see their own plot&apos;s
        camera, never another member&apos;s.
      </p>

      <h2>4. Analytics and cookies</h2>
      <p>
        On our public pages, we use analytics tools to understand how
        people find and use the site — how many visitors we get, which
        pages they read, and where they lose interest. This helps us
        improve the site. Depending on what we have enabled, these may
        include:
      </p>
      <ul>
        <li><strong>Microsoft Clarity</strong> — anonymized heatmaps and session replays showing how visitors scroll and click</li>
        <li><strong>Plausible Analytics</strong> — privacy-focused, cookie-free visitor statistics</li>
        <li><strong>Google Analytics</strong> — visitor statistics (IP addresses anonymized)</li>
      </ul>
      <p>
        These tools run <strong>only on our public pages</strong>. We
        deliberately do not run them on your member dashboard, on the
        admin area, or on login and signup pages — so your plot details,
        delivery address, payment history and support messages are never
        captured by session recording or passed to an analytics provider.
      </p>
      <p>
        You can block these tools with any standard ad or tracker blocker,
        or by enabling &quot;Do Not Track&quot; in your browser. Doing so
        will not affect your membership or any part of the service.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We retain account and membership data for as long as your account
        is active, and as needed to meet our legal and accounting
        obligations after a season ends. You can request deletion of your
        account by contacting us (Section 7).
      </p>

      <h2>6. Your rights</h2>
      <p>You can:</p>
      <ul>
        <li>Access and update your profile information from your dashboard at any time</li>
        <li>Request a copy of the personal data we hold about you</li>
        <li>Request deletion of your account, subject to any records we&apos;re legally required to keep (e.g. payment records)</li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        For any privacy question or request, reach us via our{" "}
        <Link href="/#contact" className="text-[var(--color-green)] underline">contact form</Link>.
        {" "}<strong>[If required for your business under applicable rules, name a designated Grievance Officer and their contact details here.]</strong>
      </p>

      <h2>8. Changes</h2>
      <p>We may update this policy from time to time; the &quot;last updated&quot; date above will reflect the most recent change.</p>
    </LegalPageLayout>
  );
}
