import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { SectionLabel } from "@/components/SectionLabel";
import { AutoRefresh } from "@/components/AutoRefresh";
import { OnboardingSteps } from "@/components/OnboardingSteps";
import { RegenerateButton } from "@/components/RegenerateButton";
import { createClient } from "@/lib/supabase/server";
import { TIERS } from "@/lib/tiers";
import type { Generation, GenerationResult, Tier } from "@/lib/types";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const justPaid = searchParams.checkout === "success";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
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

  const { data: generation } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Generation>();

  const { data: usage } = await supabase
    .from("regenerations_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonth())
    .maybeSingle();

  const cap = TIERS[tier].regenerationsPerMonth;
  const remaining = Math.max(0, cap - (usage?.count ?? 0));
  const result = generation?.result as GenerationResult | null;

  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      <div className="w-full max-w-[900px] px-6 py-14 flex flex-col gap-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <SectionLabel>Palier {TIERS[tier].name}</SectionLabel>
            <h1 className="font-display font-semibold text-[32px] text-foreground m-0">
              {result ? result.idea_name : "Génération en cours..."}
            </h1>
            {result && (
              <p className="text-muted mt-2 max-w-[560px]">{result.pitch}</p>
            )}
          </div>
          <RegenerateButton remaining={remaining} />
        </div>

        {!generation && (
          <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-muted text-sm">
            <AutoRefresh intervalMs={5000} />
            Ta génération est en cours : elle peut prendre une à deux minutes, cette page se
            met à jour toute seule. Si rien n&apos;apparaît au bout de quelques minutes, clique
            sur « Régénérer » ci-dessus.
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
          <OnboardingSteps codeRepoUrl={generation?.code_repo_url} />
        </section>

        <Link href="/" className="text-sm text-muted-2 hover:text-foreground w-fit">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
