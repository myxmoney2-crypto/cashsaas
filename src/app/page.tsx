import Link from "next/link";
import { Header } from "@/components/Header";
import { Ticker } from "@/components/Ticker";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Faq } from "@/components/Faq";
import { SectionLabel } from "@/components/SectionLabel";
import { TechBackdrop } from "@/components/TechBackdrop";
import { Typewriter } from "@/components/Typewriter";

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

const HERO_PHRASES = [
  "Crée l'idée qui génère du cash.",
  "Ton SaaS, ton code, ton plan des 30 jours.",
  "Encaisse tes premiers paiements.",
];

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center relative overflow-hidden">
      <TechBackdrop />

      <Header />
      <Ticker />

      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-16 py-12 md:py-14 grid md:grid-cols-[1.1fr_0.9fr] items-center gap-12 relative">
        <div className="flex flex-col gap-6">
          <SectionLabel>Le tri qui te lance en un jour</SectionLabel>
          <h1 className="font-display font-semibold text-[38px] md:text-[54px] leading-[1.12] m-0">
            <span className="text-foreground">Crée ton business</span>{" "}
            <span className="text-muted-2">et encaisse</span>{" "}
            <span className="text-foreground">tes premiers revenus.</span>
          </h1>
          <Typewriter phrases={HERO_PHRASES} />
          <Link
            href="/questionnaire"
            className="bg-accent text-white px-8 py-4 rounded-full font-semibold text-base w-fit hover:opacity-90 transition-opacity"
          >
            Créer mon SaaS →
          </Link>
        </div>

        <div className="flex flex-col items-center md:items-end md:pr-6 py-4 gap-3">
          <PhoneMockup />
          <p className="text-[11px] text-muted-2 m-0">Illustration</p>
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
