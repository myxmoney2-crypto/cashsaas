import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionLabel } from "@/components/SectionLabel";
import { TrainingPanel } from "@/components/TrainingPanel";
import { createClient } from "@/lib/supabase/server";
import { getTrainingModules } from "@/lib/training";
import type { QuestionnaireResponse, Tier } from "@/lib/types";

export const metadata = {
  title: "Mini-formation : lancer ton SaaS",
  robots: { index: false, follow: false },
};

export default async function FormationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/formation");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.subscription_tier || profile.subscription_status !== "active") {
    redirect("/pricing");
  }
  const tier = profile.subscription_tier as Tier;

  // Le module d'acquisition s'adapte aux réponses (budget, clippers) : on lit les dernières de la personne.
  const { data: response } = await supabase
    .from("questionnaire_responses")
    .select("answers")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<QuestionnaireResponse, "answers">>();

  const modules = getTrainingModules(response?.answers ?? null, tier);

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

      {tier === "starter" ? (
        <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-3 items-start">
          <p className="text-sm text-muted leading-relaxed m-0">
            La mini-formation (comptes TikTok, clippers, répartition de ton budget) est disponible à partir
            du palier Pro.
          </p>
          <Link href="/dashboard" className="text-sm text-accent font-semibold hover:opacity-80">
            Passer à Pro ou Premium depuis « Gérer mon abonnement » →
          </Link>
        </div>
      ) : (
        <TrainingPanel modules={modules} />
      )}
    </div>
  );
}
