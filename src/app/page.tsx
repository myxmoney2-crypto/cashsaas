import Link from "next/link";
import { Header } from "@/components/Header";
import { Ticker } from "@/components/Ticker";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Faq } from "@/components/Faq";
import { SectionLabel } from "@/components/SectionLabel";
import { TIERS, TIER_ORDER } from "@/lib/tiers";

const PLAN_WEEKS = [
  {
    label: "SEMAINE 1",
    title: "Lancement",
    body: "Ton SaaS est déployé, Stripe connecté, prêt à recevoir tes premiers visiteurs.",
  },
  {
    label: "SEMAINE 2",
    title: "Premiers contenus",
    body: "Les formats et hooks qui marchent pour ta niche, prêts à tourner.",
  },
  {
    label: "SEMAINE 3",
    title: "Ajustement",
    body: "On resserre le message et le prix selon ce qui convertit vraiment.",
  },
  {
    label: "SEMAINE 4",
    title: "Scale",
    body: "Tu doubles la cadence sur ce qui marche et tu stabilises tes revenus.",
  },
];

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center relative overflow-hidden">
      <svg
        width="1280"
        height="640"
        className="absolute top-0 left-0 opacity-[0.28] pointer-events-none hidden md:block"
        viewBox="0 0 1280 640"
      >
        <line x1="1040" y1="90" x2="1160" y2="200" stroke="var(--accent)" strokeWidth="1" />
        <line x1="1160" y1="200" x2="1080" y2="340" stroke="var(--accent-2)" strokeWidth="1" />
        <circle cx="1040" cy="90" r="3" fill="var(--accent)" />
        <circle cx="1160" cy="200" r="3" fill="var(--accent)" />
        <circle cx="1080" cy="340" r="3" fill="var(--accent-2)" />
      </svg>

      <Header />
      <Ticker />

      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-16 pt-14 relative">
        <SectionLabel>Le tri qui te lance en un jour</SectionLabel>
        <h1 className="font-display font-semibold text-[38px] md:text-[54px] leading-[1.12] max-w-[900px] m-0">
          <span className="text-foreground">Crée ton business</span>{" "}
          <span className="text-muted-2">et encaisse</span>{" "}
          <span className="text-foreground">tes premiers revenus.</span>
        </h1>
      </div>

      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-16 pt-7 pb-16 flex flex-col md:flex-row items-start gap-10 relative">
        <div className="flex-1 flex flex-col gap-6 pt-3">
          <p className="text-[17px] leading-relaxed text-muted max-w-[420px] m-0">
            Un SaaS taillé pour toi, le code déjà écrit, et un plan pour{" "}
            <strong className="text-[#C7CCD6]">tes 30 premiers jours.</strong>
          </p>

          <Link
            href="/questionnaire"
            className="bg-accent text-white px-8 py-4 rounded-full font-semibold text-base w-fit hover:opacity-90 transition-opacity"
          >
            Créer mon SaaS →
          </Link>

          <div className="flex gap-7 pt-2 flex-wrap">
            {[
              ["26", "questions"],
              ["3", "paliers d'IA"],
              ["30", "jours de plan"],
              ["0€", "chez nous"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="font-display text-2xl font-semibold text-foreground">
                  {value}
                </div>
                <div className="text-xs text-muted-2">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 md:flex-[0.85] flex justify-center md:justify-end w-full">
          <PhoneMockup />
        </div>
      </div>

      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-16 py-14 flex flex-col gap-6 border-t border-white/[0.08] mt-2">
        <div>
          <SectionLabel>Après la génération</SectionLabel>
          <h2 className="font-display font-semibold text-[30px] text-foreground m-0">
            Ton plan des 30 premiers jours
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_WEEKS.map((week) => (
            <div
              key={week.label}
              className="bg-surface border border-white/[0.08] rounded-[20px] p-[22px]"
            >
              <div className="text-xs text-accent font-bold mb-2.5">{week.label}</div>
              <div className="text-[15px] font-semibold text-foreground mb-1.5">
                {week.title}
              </div>
              <div className="text-[13px] text-muted leading-relaxed">{week.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-16 pb-16 flex flex-col gap-6">
        <div>
          <SectionLabel>Paliers</SectionLabel>
          <h2 className="font-display font-semibold text-[30px] text-foreground m-0">
            Choisis ton palier
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIER_ORDER.map((tierId) => {
            const tier = TIERS[tierId];
            return (
              <div
                key={tier.id}
                className="bg-surface border border-white/[0.08] rounded-[20px] p-6 flex flex-col gap-4"
              >
                <div>
                  <div className="text-xs text-accent font-bold mb-1.5 uppercase tracking-wide">
                    {tier.tagline}
                  </div>
                  <div className="font-display text-xl font-semibold text-foreground">
                    {tier.name}
                  </div>
                  <div className="text-2xl font-display font-semibold text-foreground mt-2">
                    {tier.priceLabel}
                  </div>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-muted">
                  {tier.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <Link
                  href="/questionnaire"
                  className="mt-auto bg-foreground text-background text-center py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Choisir {tier.name}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div id="faq" className="w-full max-w-[1280px] mx-auto px-6 md:px-16 pb-16 flex flex-col gap-5">
        <div>
          <SectionLabel>Questions fréquentes</SectionLabel>
          <h2 className="font-display font-semibold text-[30px] text-foreground m-0">
            Ce qu&apos;on te demande souvent
          </h2>
        </div>
        <Faq />
      </div>
    </div>
  );
}
