import Link from "next/link";

function toWhatsAppDigits(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11) return digits;
  return null;
}

export function whatsappHref(phone: string | null, text = "Hi, I have a question about Mera Khet.") {
  const d = toWhatsAppDigits(phone);
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(text)}` : null;
}

export function SiteFooter({ contactEmail, contactPhone }: { contactEmail: string | null; contactPhone: string | null }) {
  const wa = whatsappHref(contactPhone);
  return (
    <footer className="footer">
      <div className="mk-wrap">
        <div className="footer-inner">
          <div>
            <p className="footer-brand">Mera Khet</p>
            <p className="footer-tag">Apna Khet. Apni Pehchaan. · #MyMeraKhet</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <p className="footer-h">Explore</p>
              <Link href="/the-farm">The Farm</Link>
              <Link href="/how-it-works">How It Works</Link>
              <Link href="/our-wheat">Our Wheat</Link>
            </div>
            <div className="footer-col">
              <p className="footer-h">Membership</p>
              <Link href="/plans">Plans &amp; Pricing</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/auth/login">Member login</Link>
              <Link href="/dashboard/farm-visit">Farm visits</Link>
            </div>
            <div className="footer-col">
              <p className="footer-h">Contact</p>
              <span>Sujangarh, Rajasthan</span>
              {contactEmail && <a href={`mailto:${contactEmail}`}>{contactEmail}</a>}
              {contactPhone && <a href={`tel:${contactPhone.replace(/\s/g, "")}`}>{contactPhone}</a>}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>
              )}
              <Link href="/#contact">Contact form</Link>
            </div>
          </div>
        </div>
        <p className="footer-legal">
          <Link href="/terms">Terms of Service</Link> · <Link href="/privacy">Privacy Policy</Link> ·{" "}
          <Link href="/membership-agreement">Membership Agreement</Link> · <Link href="/refund-policy">Refund &amp; Cancellation</Link> ·{" "}
          <Link href="/disclaimer">Disclaimer</Link>
          <br />© {new Date().getFullYear()} Mera Khet (MK Farms). All rights reserved.
        </p>
      </div>
    </footer>
  );
}
