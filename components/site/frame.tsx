import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/motion";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { getCurrentMember } from "@/lib/current-member";
import { getSeason } from "@/lib/public-data";

/** Nav + footer + motion shell shared by every public page. */
export async function SiteFrame({ children }: { children: ReactNode }) {
  const [member, season] = await Promise.all([getCurrentMember(), getSeason()]);
  return (
    <SiteShell>
      <SiteNav isLoggedIn={member.isLoggedIn} firstName={member.firstName} registrationsPaused={season?.registrations_paused ?? false} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter contactEmail={season?.contact_email ?? null} contactPhone={season?.contact_phone ?? null} />
    </SiteShell>
  );
}

export { PageHero, SectionHead } from "@/components/site/heads";
