import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { SectionHead } from "@/components/site/heads";
import { DeliveryStrip } from "@/components/site/delivery-strip";
import { DELIVERY_ZONES_DOTS } from "@/lib/delivery-zones";
import { CountUp, HeroMeter, Section } from "@/components/site/motion";
import { Arrow } from "@/components/site/marks";
import { CameraViewer } from "@/components/site/camera-viewer";
import { FaqPreview } from "@/components/site/faq";
import { ContactForm } from "@/components/site/contact-form";
import { whatsappHref } from "@/components/site/footer";
import { PlanCards, PlotMapGrid, PlotMapLegend, Ticker } from "@/components/site/blocks";
import { HeroArt, shortDate, type SeasonCard } from "@/components/site/home";
import farmerTeamPhoto from "@/public/images/farmer-team-field.jpg";
import wheatEarPhoto from "@/public/images/wheat-ear-macro.jpg";
import harvestRawPhoto from "@/public/images/harvest-delivered-raw.jpg";
import harvestFlourPhoto from "@/public/images/harvest-milled-atta.jpg";
import harvestMarketPhoto from "@/public/images/harvest-sold-market.jpg";
import { getCurrentMember } from "@/lib/current-member";
import { getPlanCards, getPlotCounts, getSeason } from "@/lib/public-data";
import { buildFaqs } from "@/lib/site-content";
import { todayInIndia } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Old single-page anchors (/#pricing, /#register, /#contact, /#faq, /#story,
// /#how-it-works, /#live) are kept as section ids so existing links, emails
// and WhatsApp messages still land in the right place.

export default async function Home() {
  const [season, counts, plans, member] = await Promise.all([getSeason(), getPlotCounts(), getPlanCards(), getCurrentMember()]);
  const reserveHref = member.isLoggedIn ? "/dashboard/select-plot" : "/auth/signup";
  const reserveLabel = member.isLoggedIn ? "Choose your plots" : "Reserve Your Plot";
  const collected = season?.fff_collected_inr ?? 0;
  const faqs = buildFaqs({
    prices: Object.fromEntries(plans.map((p) => [p.id, p.priceInr])),
    warehouseTonnes: season?.warehouse_capacity_tonnes ?? 30,
  });
  const pick = ["What do I receive with my membership?", "Is my plot legally owned by me?", "Is the farm organic?", "What are my options for the harvest?", "Can I cancel?"];
  const faqPreview = pick.map((q) => faqs.find((f) => f.q === q)).filter((f): f is NonNullable<typeof f> => Boolean(f));

  // Season facts for the hero card and the closing call to action. Dates in
  // the past are dropped rather than shown as if they were still ahead.
  const today = todayInIndia();
  const sowing = season?.sowing_date && season.sowing_date >= today ? season.sowing_date : null;
  const deadline = season?.registration_deadline && season.registration_deadline >= today ? season.registration_deadline : null;
  const deadlinePassed = !!season?.registration_deadline && season.registration_deadline < today;
  const plotsKnown = counts.total > 0;
  const open = Math.max(counts.total - counts.filled, 0);
  const bookingsOpen = !season?.registrations_paused && !deadlinePassed && (!plotsKnown || open > 0);

  const seasonCard: SeasonCard | null = season
    ? sowing
      ? { label: "Sowing begins", value: shortDate(sowing), note: season.season_label }
      : { label: "In the field now", value: season.current_stage, note: season.season_label }
    : null;

  const dates =
    deadline && sowing
      ? `Bookings close ${shortDate(deadline)}, and sowing begins ${shortDate(sowing)}.`
      : deadline
        ? `Bookings close ${shortDate(deadline)}.`
        : sowing
          ? `Sowing begins ${shortDate(sowing)}.`
          : "";
  const closerText = bookingsOpen
    ? [plotsKnown ? `${open} of ${counts.total} plots are still open.` : "", dates].filter(Boolean).join(" ") ||
      "Reserve a plot and follow it from sowing to harvest."
    : season?.registrations_paused
      ? "Bookings are paused for now. Send us a note and we'll tell you the moment they reopen."
      : `${deadlinePassed ? "Bookings for this season have closed." : "Every plot this season is taken."} Send us a note and we'll let you know when the next season opens.`;

  return (
    <SiteFrame>
      <header className="hero home-hero">
        <div className="hero-texture" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow fade">Apna Khet · Apni Pehchaan</p>
            <h1>
              <span className="line">
                <span>Your own wheat,</span>
              </span>
              <span className="line">
                <span>
                  grown <em>for you.</em>
                </span>
              </span>
            </h1>
            <p className="hero-sub fade d4">
              A dedicated plot on real farmland in Sujangarh, Rajasthan — farmed for one season by experienced farmers from our village, watched on a
              live camera, and your share of the harvest milled, packed and sent home.
            </p>
            <div className="hero-actions fade d5">
              <Link href={reserveHref} className="btn btn-primary">
                <span>{reserveLabel}</span>
              </Link>
              <Link href="/how-it-works" className="btn btn-ghost">
                <span>See How It Works</span>
              </Link>
            </div>
            <HeroMeter filled={counts.filled} total={counts.total} />
            <p className="hero-sub fade d5" style={{ fontSize: 14, marginTop: 14 }}>
              Delivering this season in {DELIVERY_ZONES_DOTS} — more cities coming soon.
            </p>
          </div>
          <HeroArt card={seasonCard} />
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span className="scroll-line" />
          <span>Scroll</span>
        </div>
      </header>

      <Ticker />

      <Section className="stats">
        <div className="mk-wrap">
          <div className="stats-panel">
            {[
              ["24×7 Camera Coverage", "A live view of the field on your dashboard, from sowing through harvest.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><ellipse cx="15" cy="15" rx="13" ry="8" stroke="#B4872E" strokeWidth="1.6" /><circle cx="15" cy="15" r="3.4" fill="#B4872E" /></svg>],
              ["Tested Every Month", "Farm test results shared with every member, every month.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M15 26C15 26 6 21 6 12C6 6 10 3 15 3C20 3 24 6 24 12C24 21 15 26 15 26Z" stroke="#B4872E" strokeWidth="1.6" /><line x1="15" y1="26" x2="15" y2="10" stroke="#B4872E" strokeWidth="1.6" /></svg>],
              ["RAJ 1482 Seed", "Bred for Rajasthan's conditions, on a ~140-day cycle.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="12" stroke="#B4872E" strokeWidth="1.6" strokeDasharray="3 3" /><circle cx="15" cy="15" r="4" fill="#B4872E" /></svg>],
              ["Seasonal Only", "One dedicated season at a time — no long contracts.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect x="4" y="6" width="22" height="20" rx="2.5" stroke="#B4872E" strokeWidth="1.6" /><line x1="4" y1="12" x2="26" y2="12" stroke="#B4872E" strokeWidth="1.6" /><line x1="10" y1="3" x2="10" y2="8" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" /><line x1="20" y1="3" x2="20" y2="8" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" /></svg>],
            ].map(([title, text, icon], i) => (
              <div key={title as string} className={`stat-cell fade d${i + 1}`}>
                <div className="stat-icon">{icon}</div>
                <p className="stat-title">{title}</p>
                <p className="stat-text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="story" className="section tint">
        <div className="mk-wrap">
          <div className="story-wrap">
            <div className="story-media fade">
              <div className="story-photo">
                <Image
                  src={farmerTeamPhoto}
                  alt="Two farmers walking through a wheat field"
                  fill
                  sizes="(min-width: 960px) 470px, 100vw"
                  placeholder="blur"
                  style={{ objectPosition: "center 26%" }}
                />
              </div>
              <div className="story-note fade d4">
                <span className="story-note-k">Farmed by</span>
                <span className="story-note-v">Our own village&apos;s farmers</span>
                <span className="story-note-s">Not outsourced labour.</span>
              </div>
            </div>
            <div className="story-copy">
              <SectionHead
                num="01 — The Farm"
                title={["Food should never", "be a mystery."]}
                lead="We come from a farming family that watched agriculture fade from our own generation. Mera Khet is our way back to those roots — farmed by experienced farmers from our own village, and creating work there too."
                style={{ marginBottom: 36 }}
              />
              <ol className="story-points">
                {[
                  ["Full Transparency", "A live camera, monthly farm test results and regular updates — no mystery in your food."],
                  ["No Shortcuts for Yield", "No harmful chemicals used just to push the yield. Next wheat season, we plan to farm 100% organically."],
                  ["Whole Wheat, Milled Whole", "Bran and germ left intact — real roti and chapati quality, from a variety bred for this soil."],
                ].map(([h, p], i) => (
                  <li key={h} className={`fade d${i + 4}`}>
                    <span className="sp-num">0{i + 1}</span>
                    <div>
                      <h3>{h}</h3>
                      <p>{p}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="story-more fade d7">
                <Link href="/our-wheat" className="mk-link">
                  What makes our wheat different <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="how-it-works" className="section home-steps">
        <div className="mk-wrap">
          <SectionHead center num="02 — How It Works" title={["From land to harvest."]} />
          <div className="process-row">
            <div className="process-line" />
            {[
              ["Choose Your Plots", "1, 3, or 6 plots — the size that fits your family, your year, or your shop."],
              ["Get Your Allocation", "Pick your plot numbers on the live map, or let us assign them."],
              ["We Farm It", "Experienced farmers from our village handle sowing, irrigation and care all season."],
              ["Watch It Grow", "A live camera, monthly test results and updates, right through to harvest."],
            ].map(([t, x], i) => (
              <div key={t} className={`step fade d${i * 2 + 1}`}>
                <div className="step-num">{i + 1}</div>
                <p className="step-title">{t}</p>
                <p className="step-text">{x}</p>
              </div>
            ))}
          </div>
          <div className="more-link fade d8">
            <Link href="/how-it-works" className="mk-link">
              See the full season, stage by stage <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <Section id="live" className="section dark-panel">
        <div className="mk-wrap">
          <SectionHead
            center
            num="03 — The Camera"
            title={["Watch it from", "wherever you are."]}
            lead="From sowing, your dashboard shows the field live, 24×7 — the same cameras we use to run the farm."
          />
          <CameraViewer />
          <p className="cam-note">
            These are real stills from the farm cameras, taken before sowing. Members watch live from their dashboard once sowing begins. Live video
            depends on the weather and the network at the farm — if it drops, you&apos;ll see the latest photo, clearly labelled as a photo.
          </p>
          <div className="more-link fade d6">
            <Link href="/the-farm" className="mk-link">
              See the farm and plan a visit <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <Section id="harvest" className="section home-harvest">
        <div className="mk-wrap">
          <SectionHead
            center
            num="04 — Your Harvest"
            title={["Your harvest, your way."]}
            lead="When the season ends, your share of the harvest is yours. You decide what happens to it."
          />
          <div className="harvest-grid">
            {[
              { k: "raw", h: "Delivered raw", p: "Your grain, packed in 15, 30 or 50 kg bags and sent home starting 2 weeks after harvest (free for 15 kg bags; ₹150 per 30 kg bag, ₹250 per 50 kg bag).", photo: harvestRawPhoto, alt: "Sacks of raw wheat grain, ready to be packed for home delivery" },
              { k: "flour", h: "Milled into atta", p: "Milled and packed in-house at the farm, included in your plan — whole, with the bran and germ left in.", photo: harvestFlourPhoto, alt: "Packets of whole wheat atta, milled and packed, ready to ship" },
              { k: "market", h: "Sold to market", p: "Won't use it all? We sell the surplus at the day's market rate and send you what it fetches — well below what the plan costs, so not a return.", photo: harvestMarketPhoto, alt: "Wheat grain being weighed on a traditional scale at a grain market" },
            ].map(({ k, h, p, photo, alt }, i) => (
              <div key={k} className={`card harvest-card fade d${i * 2 + 1}`}>
                <div className="photo-slot filled harvest-photo">
                  <Image src={photo} alt={alt} fill sizes="(min-width: 960px) 33vw, 100vw" placeholder="blur" />
                  <span className="harvest-tag">Option {i + 1}</span>
                </div>
                <div className="harvest-body">
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="more-link fade d7" style={{ marginTop: 44 }}>
            <Link href="/how-it-works#harvest" className="mk-link">
              Everything that happens after harvest <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <Section id="register" className="section tint">
        <div className="mk-wrap">
          <div className="map-wrap">
            <div>
              <SectionHead
                num="05 — Availability"
                title={["The live", "plot map."]}
                lead={`${counts.total || 80} plots make up this season. Yours is assigned to you by number, then tracked and watched from sowing to harvest.`}
                style={{ marginBottom: 0 }}
              />
              <PlotMapLegend />
            </div>
            <PlotMapGrid />
          </div>
        </div>
      </Section>

      <Section id="pricing" className="section">
        <div className="mk-wrap">
          <SectionHead center num="06 — Membership" title={["Choose your plot."]} lead="One season. Three sizes. The same transparency on every one." />
          <PlanCards />
          <DeliveryStrip />
          <p className="plans-note fade d6">
            Every plan includes in-house milling and packing, on-site storage and farm visits. The harvest is shared equally per plot, and yields are estimates, not guarantees.
          </p>
          <div className="more-link fade d7" style={{ marginTop: 30 }}>
            <Link href="/plans" className="mk-link">
              Compare plans, find your size, or pay in two parts <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <Section className="fund" id="fund">
        <div className="mk-wrap">
          <div className="fund-inner fade">
            <div className="fund-copy">
              <h2>
                <span className="line">
                  <span>The Feeding Families Fund</span>
                </span>
              </h2>
              <p>₹1,000 from every plot goes to donating wheat to families in need — automatically, from the price you already pay, on every plan.</p>
            </div>
            <div className="fund-stats">
              <div>
                <div className="fund-num">
                  <CountUp to={collected} format="inr" />
                </div>
                <div className="fund-label">Set aside so far</div>
              </div>
              <div>
                <div className="fund-num">₹1,000</div>
                <div className="fund-label">Per plot, given as wheat after harvest</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="faq" className="section" style={{ paddingTop: 0 }}>
        <div className="mk-wrap">
          <SectionHead center num="07 — Questions" title={["Answers, before you ask."]} />
          <FaqPreview items={faqPreview} />
          <div className="more-link fade d6">
            <Link href="/faq" className="mk-link">
              See all {faqs.length} questions, searchable <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <Section className="closer">
        <div className="closer-panel">
          <Image src={wheatEarPhoto} alt="" fill sizes="100vw" placeholder="blur" className="closer-img" style={{ objectPosition: "32% 50%" }} />
          <div className="closer-shade" aria-hidden="true" />
          <div className="mk-wrap closer-copy">
            <p className="eyebrow fade">{season?.season_label || "This season"}</p>
            <h2>
              <span className="line">
                <span>{bookingsOpen ? "Your plot is" : "Be first in line"}</span>
              </span>
              <span className="line">
                <span>
                  <em>{bookingsOpen ? "waiting." : "next season."}</em>
                </span>
              </span>
            </h2>
            <p className="closer-text fade d4">{closerText}</p>
            <div className="hero-actions fade d5">
              {bookingsOpen && (
                <Link href={reserveHref} className="btn btn-gold">
                  <span>{reserveLabel}</span>
                </Link>
              )}
              <Link href="#contact" className={bookingsOpen ? "btn btn-glass" : "btn btn-gold"}>
                <span>Ask us a question</span>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section id="contact" className="section">
        <div className="mk-wrap">
          <div className="contact">
            <div className="contact-copy">
              <SectionHead num="Talk to Us" title={["Ask us anything."]} style={{ marginBottom: 0 }} />
              <p className="fade d4">Questions about membership, allocation, a gifted plot or a farm visit? Send us a note — a real person reads every one.</p>
              <div className="contact-lines fade d5">
                <p className="contact-line">Sujangarh, Rajasthan, India</p>
                {season?.contact_email && (
                  <p className="contact-line">
                    <a href={`mailto:${season.contact_email}`}>{season.contact_email}</a>
                  </p>
                )}
                {season?.contact_phone && (
                  <p className="contact-line">
                    <a href={`tel:${season.contact_phone.replace(/\s/g, "")}`}>{season.contact_phone}</a>
                  </p>
                )}
              </div>
            </div>
            <ContactForm whatsapp={whatsappHref(season?.contact_phone ?? null)} />
          </div>
        </div>
      </Section>
    </SiteFrame>
  );
}
