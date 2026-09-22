import { redirect } from "next/navigation";
import { PricingForm } from "@/components/PricingForm";
import { SectionLabel } from "@/components/SectionLabel";
import { createClient } from "@/lib/supabase/server";
import {
  DELIVERABLES,
  TIERS,
  TIER_ORDER,
  formatEuros,
  perDayAmount,
  regenerationsLabel,
} from "@/lib/tiers";

// La génération admin démarre depuis l'action de cette page (via after()) : elle a besoin de temps.
export const maxDuration = 300;

export default async function PricingPage(props: PageProps<"/pricing">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const initialMode = searchParams.mode === "login" ? "login" : "signup";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let hasServerAnswers = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, is_admin")
      .eq("id", user.id)
      .single();

    isAdmin = Boolean(profile?.is_admin);
    // Déjà abonné : pas de deuxième abonnement (les admins peuvent retester à volonté).
    if (profile?.subscription_status === "active" && !isAdmin) redirect("/dashboard");

    const { count } = await supabase
      .from("questionnaire_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasServerAnswers = Boolean(count);
  }

  const tiers = TIER_ORDER.map((id) => {
    const tier = TIERS[id];
    return {
      id,
      name: tier.name,
      tagline: tier.tagline,
      price: formatEuros(tier.price),
      perDay: perDayAmount(tier.price),
      generations: regenerationsLabel(tier.regenerationsPerMonth),
    };
  });

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[1000px] px-6 py-14 flex flex-col gap-8">
        <div>
          <SectionLabel>Tes réponses sont prêtes</SectionLabel>
          <h1 className="font-display font-semibold text-[34px] text-foreground m-0">
            Débloque ton résultat
          </h1>
          <p className="text-muted mt-3 max-w-[560px]">
            Crée ton compte et choisis ton palier : ton idée de SaaS, ton code et ton plan des 30
            premiers jours sont générés à partir de tes réponses dès que c&apos;est réglé.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <PricingForm
          tiers={tiers}
          deliverables={DELIVERABLES}
          email={user?.email ?? null}
          isAdmin={isAdmin}
          hasServerAnswers={hasServerAnswers}
          initialMode={initialMode}
        />
      </div>
    </div>
  );
}
