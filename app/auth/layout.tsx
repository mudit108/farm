import Image from "next/image";
import Link from "next/link";
import { WheatMark } from "@/components/site/marks";
import entrance from "@/public/images/cctv/cam-farm-entrance.jpg";

/**
 * Login, signup and password screens. Split layout matching the public
 * site: a real farm photo on the left (hidden on phones), the form on the
 * right. Only presentation lives here — each page's form logic is unchanged.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mk-member mk-auth">
      <div className="mk-auth-photo" aria-hidden="true">
        <Image src={entrance} alt="" fill priority sizes="55vw" placeholder="blur" style={{ objectPosition: "center 42%" }} />
        <div className="mk-auth-quote">
          <p className="q">Apna Khet.<br />Apni Pehchaan.</p>
          <p className="s">Sujangarh, Rajasthan · The farm entrance</p>
        </div>
      </div>
      <main className="mk-auth-main">
        <div className="mk-auth-inner">
          <Link href="/" className="mk-auth-brand">
            <WheatMark size={24} />
            Mera Khet
          </Link>
          {children}
          <Link href="/" className="mk-auth-back">
            ← Back to merakhet.in
          </Link>
        </div>
      </main>
    </div>
  );
}
