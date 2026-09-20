import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { SectionLabel } from "@/components/SectionLabel";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ClearStoredAnswers } from "@/components/ClearStoredAnswers";
import { OnboardingSteps } from "@/components/OnboardingSteps";
import { RegenerateButton } from "@/components/RegenerateButton";
import { createClient } from "@/lib/supabase/server";
import { openBillingPortal } from "./actions";
import { TIERS } from "@/lib/tiers";
import type { Generation, GenerationResult, Tier } from "@/lib/types";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// Une génération « pending » depuis plus longtemps que ça est considérée comme perdue
// (fonction interrompue) : on propose de relancer au lieu d'attendre indéfiniment.
const PENDING_TIMEOUT_MS = 6 * 60 * 1000;

function isExpired(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > PENDING_TIMEOUT_MS;
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const justPaid = searchParams.checkout === "success";
  const billingError =
    typeof searchParams.billing_error === "string" ? searchParams.billing_error : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, is_admin, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.subscription_tier || profile.subscription_status !== "active") {
    // Retour de Stripe : le webhook qui active l'abonnement peut arriver quelques
    // secondes après la redirection, on attend au lieu de renvoyer vers /pricing.
    if (!justPaid) redirect("/pricing");

    return (
      <div className="w-full flex flex-col items-center">
        <Header />
        <AutoRefresh intervalMs={3000} />
        {justPaid && <ClearStoredAnswers />}
        <div className="w-full max-w-[640px] px-6 py-20 flex flex-col gap-4">
          <SectionLabel>Paiement reçu</SectionLabel>
          <h1 className="font-display font-semibold text-[32px] text-foreground m-0">
            On active ton abonnement...
          </h1>
          <p className="text-muted">
            Cette page se met à jour toute seule dès que Stripe a confirmé le paiement. Ta
            génération démarre ensuite automatiquement.
          </p>
        </div>
      </div>
    );
  }

  const tier = profile.subscription_tier as Tier;
  const isAdmin = Boolean(profile.is_admin);
  // Les comptes admin (tests) n'ont pas d'abonnement Stripe : pas de portail.
  const canManageBilling = !isAdmin && Boolean(profile.stripe_customer_id);

  const { data: latest } = await supabase
    .from("generations")
    .select("status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<Generation, "status" | "created_at">>();

  const { data: done } = await supabase
    .from("generations")
    .select("result")
    .eq("user_id", user.id)
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<Generation, "result">>();

  const { data: usage } = await supabase
    .from("regenerations_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonth())
    .maybeSingle();

  const cap = TIERS[tier].regenerationsPerMonth;
  const remaining = Math.max(0, cap - (usage?.count ?? 0));
  const result = (done?.result ?? null) as GenerationResult | null;
  const failed =
    latest?.status === "failed" || (latest?.status === "pending" && isExpired(latest.created_at));
  const inProgress = !failed && (!latest || latest.status === "pending");

  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      {justPaid && <ClearStoredAnswers />}
      <div className="w-full max-w-[900px] px-6 py-14 flex flex-col gap-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <SectionLabel>
              Palier {TIERS[tier].name}
              {isAdmin ? " · admin" : ""}
            </SectionLabel>
            <h1 className="font-display font-semibold text-[32px] text-foreground m-0">
              {result ? result.idea_name : failed ? "La génération a échoué" : "Génération en cours..."}
            </h1>
            {result && (
              <p className="text-muted mt-2 max-w-[560px]">{result.pitch}</p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3">
            <RegenerateButton remaining={isAdmin ? null : remaining} />
            {canManageBilling && (
              <form action={openBillingPortal}>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full font-semibold text-sm border border-white/20 text-foreground hover:bg-white/5 transition-colors"
                >
                  Gérer mon abonnement
                </button>
              </form>
            )}
          </div>
        </div>

        {billingError && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3 -mt-6">
            {billingError}
          </div>
        )}
        {canManageBilling && !billingError && (
          <p className="text-sm text-muted -mt-6 max-w-[560px]">
            « Gérer mon abonnement » ouvre le portail sécurisé de Stripe : tu peux y résilier en quelques
            clics, sans frais (la résiliation prend effet à la fin de la période payée), changer de carte et
            télécharger tes factures.
          </p>
        )}

        {inProgress && (
          <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-muted text-sm">
            <AutoRefresh intervalMs={5000} />
            {result ? "Une nouvelle génération est en cours : " : "Ta génération est en cours : "}
            elle peut prendre une à deux minutes, cette page se met à jour toute seule.
          </div>
        )}

        {failed && (
          <div className="bg-red-950/40 border border-red-900 rounded-2xl p-6 text-sm text-red-300">
            La génération n&apos;a pas abouti. Clique sur « Régénérer » ci-dessus pour relancer : un
            essai raté ne consomme pas ton quota du mois.
          </div>
        )}

        {result && (
          <>
            <section className="flex flex-col gap-4">
              <h2 className="font-display font-semibold text-xl text-foreground">
                Stack technique recommandée
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="text-sm text-muted-2 bg-surface border border-white/10 rounded-full px-4 py-1.5"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted leading-relaxed">
                {result.tools_recommendation}
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display font-semibold text-xl text-foreground">
                Ton code ({result.code_files.length} fichier
                {result.code_files.length > 1 ? "s" : ""})
              </h2>
              <div className="flex flex-col gap-2">
                {result.code_files.map((file) => (
                  <details
                    key={file.path}
                    className="bg-surface border border-white/[0.08] rounded-xl px-4 py-3"
                  >
                    <summary className="text-sm text-foreground font-mono cursor-pointer">
                      {file.path}
                    </summary>
                    <pre className="mt-3 text-xs text-muted overflow-x-auto whitespace-pre-wrap">
                      {file.content}
                    </pre>
                  </details>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display font-semibold text-xl text-foreground">
                Ton plan des 30 premiers jours
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.acquisition_plan.map((week) => (
                  <div
                    key={week.week}
                    className="bg-surface border border-white/[0.08] rounded-2xl p-5"
                  >
                    <div className="text-xs text-accent font-bold mb-2">
                      SEMAINE {week.week}
                    </div>
                    <div className="text-[15px] font-semibold text-foreground mb-1.5">
                      {week.title}
                    </div>
                    <div className="text-sm text-muted leading-relaxed">
                      {week.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="flex flex-col gap-4">
          <div>
            <SectionLabel>Mise en ligne</SectionLabel>
            <h2 className="font-display font-semibold text-xl text-foreground m-0">
              Déploie sur tes propres comptes
            </h2>
          </div>
          <OnboardingSteps />
        </section>

        {isAdmin && (
          <Link href="/questionnaire" className="text-sm text-accent hover:opacity-80 w-fit">
            Refaire un test (nouveau questionnaire) →
          </Link>
        )}

        <Link href="/" className="text-sm text-muted-2 hover:text-foreground w-fit">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
