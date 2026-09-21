import { SectionLabel } from "@/components/SectionLabel";
import { TrainingPanel } from "@/components/TrainingPanel";
import { createClient } from "@/lib/supabase/server";
import { getTrainingModules } from "@/lib/training";
import type { QuestionnaireResponse } from "@/lib/types";

export const metadata = {
  title: "Mini-formation : lancer ton SaaS",
  robots: { index: false, follow: false },
};

export default async function FormationPage() {
  // Le module d'acquisition s'adapte aux réponses (budget, clippers) : on lit les dernières de la personne.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: response } = user
    ? await supabase
        .from("questionnaire_responses")
        .select("answers")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle<Pick<QuestionnaireResponse, "answers">>()
    : { data: null };

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
      <TrainingPanel modules={getTrainingModules(response?.answers ?? null)} />
    </div>
  );
}
