import { SectionLabel } from "@/components/SectionLabel";
import { TrainingPanel } from "@/components/TrainingPanel";

export const metadata = {
  title: "Mini-formation : lancer ton SaaS",
  robots: { index: false, follow: false },
};

export default function FormationPage() {
  return (
    <div className="w-full max-w-[760px] mx-auto px-6 py-14 flex flex-col gap-8">
      <div>
        <SectionLabel>Après la mise en ligne</SectionLabel>
        <h1 className="font-display font-semibold text-[32px] text-foreground m-0">
          Lance ton SaaS : contenu et acquisition
        </h1>
        <p className="text-muted mt-3">
          Ton site est en ligne : voici comment le faire connaître et trouver tes premiers clients.
        </p>
      </div>
      <TrainingPanel />
    </div>
  );
}
