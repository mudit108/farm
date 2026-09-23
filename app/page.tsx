import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { SectionHead } from "@/components/site/heads";
import { CountUp, HeroMeter, Rule, Section } from "@/components/site/motion";
import { Arrow, Check, HeroWheat } from "@/components/site/marks";
import { CameraViewer } from "@/components/site/camera-viewer";
import { FaqPreview } from "@/components/site/faq";
import { ContactForm } from "@/components/site/contact-form";
import { whatsappHref } from "@/components/site/footer";
import { FieldBand, HarvestIcon, PlanCards, PlotMapGrid, PlotMapLegend, Ticker } from "@/components/site/blocks";
import { getCurrentMember } from "@/lib/current-member";
import { getPlanCards, getPlotCounts, getSeason } from "@/lib/public-data";
import { buildFaqs } from "@/lib/site-content";

export const dynamic = "force-dynamic";

// Old single-page anchors (/#pricing, /#register, /#contact, /#faq, /#story,
// /#how-it-works, /#live) are kept as section ids so existing links, emails
// and WhatsApp messages still land in the right place.

export default async function Home() {
  const [season, counts, plans, member] = await Promise.all([getSeason(), getPlotCounts(), getPlanCards(), getCurrentMember()]);
  const reserveHref = member.isLoggedIn ? "/dashboard/select-plot" : "/auth/signup";
  const collected = season?.fff_collected_inr ?? 0;
  const faqs = buildFaqs({
    prices: Object.fromEntries(plans.map((p) => [p.id, p.priceInr])),
    warehouseTonnes: season?.warehouse_capacity_tonnes ?? 30,
  });
  const pick = ["What do I receive with my membership?", "Is my plot legally owned by me?", "Is the farm organic?", "What are my options for the harvest?", "Can I cancel?"];
  const faqPreview = pick.map((q) => faqs.find((f) => f.q === q)).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <SiteFrame>
      <header className="hero">
        <div className="hero-texture" />
        <div className="hero-grid">
          <div>
            <p className="eyebrow fade">Apna Khet · Apni Pehchaan</p>
            <h1>
              <span className="line">
                <span>Your own wheat,</span>
              </span>
              <span className="line">
                <span>grown for you.</span>
              </span>
            </h1>
            <p className="hero-sub fade d4">
              A dedicated plot on real farmland in Sujangarh, Rajasthan — farmed by our team for one season, watched over on camera, and delivered
              home as your harvest.
            </p>
            <div className="hero-actions fade d5">
              <Link href={reserveHref} className="btn btn-primary">
                <span>{member.isLoggedIn ? "Choose your plots" : "Reserve Your Plot"}</span>
              </Link>
              <Link href="/how-it-works" className="btn btn-ghost">
                <span>See How It Works</span>
              </Link>
            </div>
            <HeroMeter filled={counts.filled} total={counts.total} />
          </div>
          <HeroWheat />
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span className="scroll-line" />
          <span>Scroll</span>
        </div>
      </header>

      <Ticker />

      <Section className="stats">
        <div className="mk-wrap">
          <div className="stats-grid">
            {[
              ["24×7 Camera Coverage", "Member camera access to the field from sowing through harvest.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><ellipse cx="15" cy="15" rx="13" ry="8" stroke="#B4872E" strokeWidth="1.6" /><circle cx="15" cy="15" r="3.4" fill="#B4872E" /></svg>],
              ["Soil-Tested Farming", "Fertiliser applied to the crop's actual need, never by guesswork.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M15 26C15 26 6 21 6 12C6 6 10 3 15 3C20 3 24 6 24 12C24 21 15 26 15 26Z" stroke="#B4872E" strokeWidth="1.6" /><line x1="15" y1="26" x2="15" y2="10" stroke="#B4872E" strokeWidth="1.6" /></svg>],
              ["RAJ 1482 Seed", "Bred for Rajasthan's conditions, on a ~140-day cycle.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="12" stroke="#B4872E" strokeWidth="1.6" strokeDasharray="3 3" /><circle cx="15" cy="15" r="4" fill="#B4872E" /></svg>],
              ["Seasonal Only", "One dedicated season at a time — no long contracts.", <svg key="i" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect x="4" y="6" width="22" height="20" rx="2.5" stroke="#B4872E" strokeWidth="1.6" /><line x1="4" y1="12" x2="26" y2="12" stroke="#B4872E" strokeWidth="1.6" /><line x1="10" y1="3" x2="10" y2="8" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" /><line x1="20" y1="3" x2="20" y2="8" stroke="#B4872E" strokeWidth="1.6" strokeLinecap="round" /></svg>],
            ].map(([title, text, icon], i) => (
              <div key={title as string} className={`card stat-card fade d${i + 1}`}>
                <div className="stat-icon">{icon}</div>
                <p className="stat-title">{title}</p>
                <p className="stat-text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="story" className="section">
        <div className="mk-wrap">
          <SectionHead
            center
            num="01 — The Farm"
            title={["Food should never", "be a mystery."]}
            lead="We come from a farming family that watched agriculture fade from our own generation. Mera Khet is our way back to those roots — and yours."
          />
          <div className="why-grid">
            {[
              ["Full Transparency", "Watch your exact plot's season through camera access and regular updates — no mystery in your food."],
              ["Soil-Tested, Not Guessed", "Fertiliser applied to each crop's actual needs, while we work toward certified-organic status by next season."],
              ["Whole Wheat, Milled Whole", "Bran and germ left intact — real roti and chapati quality, from a variety bred for this soil."],
            ].map(([h, p], i) => (
              <div key={h} className={`card why-card fade d${i * 2 + 1}`}>
                <div className="why-check">
                  <Check />
                </div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
          <div className="more-link fade d6">
            <Link href="/our-wheat" className="mk-link">
              What makes our wheat different <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <FieldBand />

      <Section id="how-it-works" className="section">
        <div className="mk-wrap">
          <SectionHead center num="02 — How It Works" title={["From land to harvest."]} />
          <div className="process-row">
            <div className="process-line" />
            {[
              ["Choose Your Plots", "1, 3, or 6 plots — the size that fits your family, your year, or your shop."],
              ["Get Your Allocation", "Pick your plot numbers on the live map, or let us assign them."],
              ["We Farm It", "Our team handles sowing, irrigation, and care through the whole season."],
              ["Watch It Grow", "Camera access and regular updates, right through to your harvest."],
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

      <Rule />

      <Section id="live" className="section">
        <div className="mk-wrap">
          <SectionHead
            center
            num="03 — The Camera"
            title={["Watch it from", "wherever you are."]}
            lead="Every plot sits under camera coverage. Once sowing begins, your member dashboard opens the view — the same one we use to run the farm."
          />
          <CameraViewer />
          <p className="cam-note">
            Real stills from the farm cameras — not a live stream. Live streaming to member dashboards is being rolled out; until it&apos;s live for
            your plot, you&apos;ll see recent photos, clearly labelled as photos.
          </p>
          <div className="more-link fade d6">
            <Link href="/the-farm" className="mk-link">
              See the farm and plan a visit <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="harvest" className="section">
        <div className="mk-wrap">
          <SectionHead
            center
            num="04 — Your Harvest"
            title={["Your harvest, your way."]}
            lead="When the season ends, the wheat from your plots is yours. You decide what happens to it."
          />
          <div className="harvest-grid">
            {(
              [
                ["raw", "Delivered raw", "Your grain, packed in 15, 30 or 50 kg bags and sent home 2–3 weeks after harvest, depending on where you are."],
                ["flour", "Milled into atta", "Processed before it ships — milled whole, with the bran and germ left in, the way roti is supposed to taste."],
                ["market", "Sold to market", "Want the value rather than the volume? We sell it on your behalf and send the proceeds straight to you."],
              ] as const
            ).map(([k, h, p], i) => (
              <div key={k} className={`card harvest-card fade d${i * 2 + 1}`}>
                <HarvestIcon kind={k} />
                <div className="harvest-body">
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="more-link fade d7" style={{ marginTop: 40 }}>
            <Link href="/how-it-works#harvest" className="mk-link">
              Everything that happens after harvest <Arrow />
            </Link>
          </div>
        </div>
      </Section>

      <Rule />

      <Section id="register" className="section">
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

      <Rule />

      <Section id="pricing" className="section">
        <div className="mk-wrap">
          <SectionHead center num="06 — Membership" title={["Choose your plot."]} lead="One season. Three sizes. The same transparency on every one." />
          <PlanCards />
          <p className="plans-note fade d6">
            Every plan includes soil-tested farming, on-site storage, and farm visit eligibility. Yield figures are estimates, not guarantees.
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
                <div className="fund-label">Contributed so far</div>
              </div>
              <div>
                <div className="fund-num">
                  <CountUp to={Math.round((collected / 1000) * 2)} />
                </div>
                <div className="fund-label">Families fed</div>
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

      <Rule />

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
