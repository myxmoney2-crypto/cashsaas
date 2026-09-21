import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { SectionLabel } from "@/components/SectionLabel";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ClearStoredAnswers } from "@/components/ClearStoredAnswers";
import { DownloadFileButton } from "@/components/DownloadFileButton";
import { PublishWizard } from "@/components/PublishWizard";
import { PricingScenarios } from "@/components/PricingScenarios";
import { RegenerateButton } from "@/components/RegenerateButton";
import { createClient } from "@/lib/supabase/server";
import { GITHUB_TOKEN_COOKIE, githubConfigured } from "@/lib/github";
import { cleanResultText } from "@/lib/text";
import { openBillingPortal } from "./actions";
import { TIERS } from "@/lib/tiers";
import type { Generation, GenerationResult, Tier } from "@/lib/types";

// La création du dépôt GitHub (action du tableau de bord) enchaîne plusieurs appels : on laisse de la marge.
export const maxDuration = 60;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// Une génération « pending » depuis plus longtemps que ça est considérée comme perdue
// (fonction interrompue) : on propose de relancer au lieu d'attendre indéfiniment.
const PENDING_TIMEOUT_MS = 5 * 60 * 1000;

function isExpired(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > PENDING_TIMEOUT_MS;
}

function elapsedSeconds(createdAt: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 1000));
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const justPaid = searchParams.checkout === "success";
  const billingError =
    typeof searchParams.billing_error === "string" ? searchParams.billing_error : null;
  const openWizard = searchParams.construire === "1";
  const githubError = typeof searchParams.gh_error === "string" ? searchParams.gh_error : null;

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

  const { data: latest, error: latestError } = await supabase
    .from("generations")
    .select("status, created_at, error")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<Generation, "status" | "created_at" | "error">>();

  const { data: done } = await supabase
    .from("generations")
    .select("result, code_repo_url")
    .eq("user_id", user.id)
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<Generation, "result" | "code_repo_url">>();

  const { data: usage } = await supabase
    .from("regenerations_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonth())
    .maybeSingle();

  const cap = TIERS[tier].regenerationsPerMonth;
  const remaining = Math.max(0, cap - (usage?.count ?? 0));
  const result = done?.result ? cleanResultText(done.result as GenerationResult) : null;
  const githubConnected = Boolean((await cookies()).get(GITHUB_TOKEN_COOKIE)?.value);
  const schemaSql = result?.code_files.find((file) => file.path === "supabase/schema.sql")?.content ?? null;
  const failed =
    latest?.status === "failed" || (latest?.status === "pending" && isExpired(latest.created_at));
  // Si l'état ne peut pas être lu (colonne absente, cache de schéma...), on l'affiche au lieu de
  // tourner indéfiniment sur « en cours ».
  const inProgress = !latestError && !failed && (!latest || latest.status === "pending");

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
            {isAdmin && latest?.status === "pending" && (
              <span className="block mt-2 text-muted-2">
                Admin : démarrée il y a {elapsedSeconds(latest.created_at)} s.
              </span>
            )}
          </div>
        )}

        {latestError && (
          <div className="bg-red-950/40 border border-red-900 rounded-2xl p-6 text-sm text-red-300">
            Impossible de lire l&apos;état de ta génération pour le moment.
            {isAdmin && <span className="block mt-2 font-mono text-xs">{latestError.message}</span>}
          </div>
        )}

        {failed && (
          <div className="bg-red-950/40 border border-red-900 rounded-2xl p-6 text-sm text-red-300">
            La génération n&apos;a pas abouti. Clique sur « Régénérer » ci-dessus pour relancer : un
            essai raté ne consomme pas ton quota du mois.
            {isAdmin && (
              <span className="block mt-2 font-mono text-xs">
                {latest?.error ?? "Aucun motif enregistré : la fonction a probablement été interrompue."}
              </span>
            )}
          </div>
        )}

        {result && (
          <>
            <section className="flex flex-col gap-4">
              <h2 className="font-display font-semibold text-xl text-foreground">
                Stack technique recommandée
              </h2>
              <ul className="flex flex-col gap-2 text-sm text-muted leading-relaxed list-disc pl-5 m-0">
                {(result.tech_stack as string[]).map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
              <h3 className="font-display font-semibold text-base text-foreground mt-2 mb-0">
                Budget et outils
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-muted leading-relaxed list-disc pl-5 m-0">
                {(result.tools_recommendation as string[]).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>

            {result.pricing_options && result.pricing_options.length > 0 && (
              <PricingScenarios options={result.pricing_options} goal={result.monthly_goal_eur} />
            )}

            <section className="flex flex-col gap-4">
              <h2 className="font-display font-semibold text-xl text-foreground">
                Ton code ({result.code_files.length} fichier
                {result.code_files.length > 1 ? "s" : ""})
              </h2>
              <div className="flex flex-col gap-3">
                {result.code_files.map((file) => (
                  <div key={file.path} className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <details className="flex-1 min-w-0 bg-surface border border-white/[0.08] rounded-xl px-4 py-3">
                      <summary className="text-sm text-foreground font-mono cursor-pointer">
                        {file.path}
                      </summary>
                      <pre className="mt-3 text-xs text-muted overflow-x-auto whitespace-pre-wrap">
                        {file.content}
                      </pre>
                    </details>
                    <DownloadFileButton path={file.path} content={file.content} />
                  </div>
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

        {result && (
          <PublishWizard
            ideaName={result.idea_name}
            repoUrl={done?.code_repo_url ?? null}
            githubConnected={githubConnected}
            githubError={githubError}
            githubEnabled={githubConfigured()}
            schemaSql={schemaSql}
            initialOpen={openWizard}
          />
        )}

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
