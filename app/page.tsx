import { Nav } from "@/components/farm/nav";
import { Hero } from "@/components/farm/hero";
import { HowItWorks } from "@/components/farm/how-it-works";
import { HalfAcre } from "@/components/farm/half-acre";
import { SeasonalCrops } from "@/components/farm/seasonal-crops";
import { HarvestOptions } from "@/components/farm/harvest-options";
import { LiveFarm } from "@/components/farm/live-farm";
import { DashboardPreview } from "@/components/farm/dashboard-preview";
import { FarmUpdates } from "@/components/farm/farm-updates";
import { Transparency } from "@/components/farm/transparency";
import { VisitAndLocation } from "@/components/farm/visit-and-location";
import { Pricing } from "@/components/farm/pricing";
import { LegalTrust } from "@/components/farm/legal-trust";
import { Faq } from "@/components/farm/faq";
import { FinalCta } from "@/components/farm/final-cta";
import { Contact, Footer } from "@/components/farm/contact-and-footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <HalfAcre />
      <SeasonalCrops />
      <HarvestOptions />
      <LiveFarm />
      <DashboardPreview />
      <FarmUpdates />
      <Transparency />
      <VisitAndLocation />
      <Pricing />
      <LegalTrust />
      <Faq />
      <FinalCta />
      <Contact />
      <Footer />
    </main>
  );
}
