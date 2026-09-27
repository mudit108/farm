import Image from "next/image";
import { WheatMark } from "@/components/site/marks";
import heroPhoto from "@/public/images/story-card-bg.jpg";
import wheatEarPhoto from "@/public/images/wheat-ear-macro.jpg";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "31 Oct" from a plain YYYY-MM-DD, without a timezone-dependent Date parse. */
export function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

export type SeasonCard = { label: string; value: string; note: string };

/**
 * Homepage hero artwork: an arched field photo framed by a thin halo, a
 * wheat close-up, a live season card and a slowly turning seal. Geometry is
 * in container units (see .hero-art in site.css) so the whole composition
 * scales as one piece from phone to desktop.
 */
export function HeroArt({ card }: { card: SeasonCard | null }) {
  return (
    <div className="hero-art">
      <div className="ha-ring" aria-hidden="true" />
      <div className="ha-arch">
        <Image
          src={heroPhoto}
          alt="A farmer walking through ripe wheat at sunset"
          fill
          preload
          sizes="(min-width: 960px) 400px, 78vw"
          placeholder="blur"
          style={{ objectPosition: "100% 80%" }}
        />
      </div>
      <div className="ha-inset fade d6" aria-hidden="true">
        <Image src={wheatEarPhoto} alt="" fill sizes="220px" placeholder="blur" style={{ objectPosition: "36% 50%" }} />
      </div>
      {card && (
        <div className="ha-card fade d5">
          <span className="ha-card-k">{card.label}</span>
          <span className="ha-card-v">{card.value}</span>
          <span className="ha-card-s">{card.note}</span>
        </div>
      )}
      <div className="ha-seal fade d7" aria-hidden="true">
        <svg className="ha-seal-ring" viewBox="0 0 120 120">
          <defs>
            <path id="ha-seal-path" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
          </defs>
          <text>
            <textPath href="#ha-seal-path" textLength="284" lengthAdjust="spacing">
              GROWN IN SUJANGARH · RAJASTHAN ·
            </textPath>
          </text>
        </svg>
        <WheatMark size={30} />
      </div>
    </div>
  );
}
