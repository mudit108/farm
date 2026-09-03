import { Reveal } from "@/components/ui/reveal";

export function LegalTrust() {
  return (
    <section className="border-b border-[var(--color-ink)]/10 bg-[var(--color-bg-deep)] py-16">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal>
          <h2 className="font-display text-2xl">
            What does a &ldquo;plot allocation&rdquo; mean?
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            <p>
              Your Mera Khet membership gives you a contractual allocation
              of, and participation in, a designated area of farm plots
              (1, 3, or 6 plots — each plot 7,260 sq ft), according to the
              terms of your membership agreement.
            </p>
            <p>We do not claim, promise, or imply:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Guaranteed returns</li>
              <li>Guaranteed crop yield or wheat quantity</li>
              <li>Guaranteed profits</li>
              <li>Legal ownership of agricultural land</li>
            </ul>
            <p>
              unless those rights are explicitly provided under your final
              signed legal agreement. Wheat quantities shown for each plan
              (250–300 / 750–900 / 1,500–1,800 kg) are typical-yield estimates, not
              commitments.
            </p>
            <p className="font-medium text-[var(--color-ink)]">
              Agriculture is seasonal and subject to weather, soil
              conditions, pests, water availability and other natural
              factors.
            </p>
            <p>
              Every plot at Mera Khet is cultivated 100% organically — no
              synthetic pesticides or chemical fertilizers are used.
              Formal organic certification, where applicable, will be
              noted on your membership documents.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
