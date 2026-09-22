import Anthropic from "@anthropic-ai/sdk";
import type { QuestionnaireAnswers, GenerationResult, PricingOption, Tier } from "./types";
import { TIERS } from "./tiers";
import { EXTRA_QUESTIONS, QUESTIONS } from "./questionnaire";
import { cleanResultText } from "./text";

// Budget de sortie généreux (idée + code complet + plan) : on ne paie que les tokens réellement écrits.
// Au-delà d'environ 21 000 tokens le SDK exige l'envoi en flux continu (streaming), utilisé ci-dessous.
const GENERATION_MAX_TOKENS = 32_000;
// Le délai du SDK ne couvre pas la durée d'un flux : on l'annule nous-mêmes, avant la garde de 270 s de
// runGeneration et la coupure Vercel à 300 s, pour que l'échec soit enregistré proprement.
const STREAM_DEADLINE_MS = 255_000;

let cached: Anthropic | null = null;

/**
 * Construit le client Anthropic à la demande plutôt qu'au chargement du
 * module, pour que l'absence d'ANTHROPIC_API_KEY (ex: build Vercel sans les
 * env vars encore configurées) ne fasse pas planter le build.
 */
function getAnthropic(): Anthropic {
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY est manquant — configure-le dans les variables d'environnement."
    );
  }

  // Délai borné et aucune relance automatique : la fonction Vercel est tuée à 300 s (maxDuration), et une
  // relance après un long délai la ferait dépasser. Un échec est enregistré proprement et se relance à la main.
  cached = new Anthropic({ apiKey, timeout: 250_000, maxRetries: 0 });
  return cached;
}

const SYSTEM_PROMPT = `Tu es un générateur d'idées de SaaS. Tu reçois les réponses d'un utilisateur à un questionnaire sur sa situation réelle (26 questions, plus 3 questions complémentaires dont le prix qu'il vise pour son produit et s'il est prêt à passer par des clippers).

À partir de l'ENSEMBLE des réponses (jamais une seule question isolée), génère :

1. Une idée de SaaS ou de business précise, réaliste, réalisable seul dans le budget et le temps disponible indiqués. Si l'utilisateur a une passion ou une niche claire, ancre l'idée dedans ; s'il en cite plusieurs (les réponses sur ses moteurs et ses passions peuvent en contenir plusieurs), cherche une idée à leur croisement plutôt que d'en choisir une seule. Sinon, propose un "produit gagnant" générique adapté à son profil.

2. Un scaffold de code fonctionnel, livré dans code_files :
   - un fichier "index.html" autonome (HTML + CSS + JS dans le même fichier, aucun framework, aucune étape de build), qui sera placé à la racine d'un site statique déjà déployé sur Vercel ;
   - il utilise Supabase via le CDN https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 et lit sa configuration UNIQUEMENT dans window.ENV.SUPABASE_URL et window.ENV.SUPABASE_ANON_KEY (le fichier /config.js, fourni par le template, se charge avec <script src="/config.js"></script> avant ton script) ; n'écris jamais de clé en dur ;
   - si des tables sont nécessaires, ajoute aussi un fichier "supabase/schema.sql" (rejouable sans risque, RLS activé, policies adaptées à la clé anon) ; ne réutilise pas la table "leads" du template sauf si elle convient vraiment ;
   - le code doit être complet et fonctionner tel quel, sans dépendance supplémentaire.

3. Des recommandations d'outils adaptées au budget déclaré (si budget serré : tiers gratuits Vercel/Supabase ; si budget confortable : paliers payants). Dans tech_stack, chaque entrée est une courte ligne « Outil : à quoi il sert ». Dans tools_recommendation, un tableau de 3 à 6 courtes phrases (une idée par phrase, dont une sur le budget), jamais un paragraphe.

4. Un plan d'accompagnement sur 30 jours, découpé en 4 semaines, adapté au temps disponible par jour et au format de contenu choisi (avec ou sans apparition à l'écran).

5. De 2 à 3 scénarios de prix pour atteindre l'objectif de revenu mensuel indiqué par l'utilisateur (sa réponse à « Combien tu vises par mois »), afin de montrer que l'objectif est atteignable de plusieurs façons selon le prix choisi. Pour chaque scénario : le prix en euros (price_eur), s'il est mensuel (abonnement) ou unique (vente ponctuelle) (billing), et une justification courte de 1 à 2 phrases adaptée à ton idée et à son audience (rationale). Si l'utilisateur a indiqué le prix qu'il vise, l'un des scénarios doit être exactement ce prix. Ne donne PAS le nombre de clients : il est calculé automatiquement (objectif ÷ prix). Ce sont des ordres de grandeur pour illustrer, jamais une promesse : n'écris aucune garantie de revenus.

Règle d'écriture : n'utilise jamais le tiret cadratin (—) dans les textes ; préfère la virgule, le point ou les deux-points.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{
  "idea_name": string,
  "niche": string,
  "pitch": string,
  "tech_stack": string[],
  "code_files": [{ "path": string, "content": string }],
  "tools_recommendation": string[],
  "acquisition_plan": [{ "week": number, "title": string, "description": string }],
  "pricing_options": [{ "price_eur": number, "billing": "mensuel" | "unique", "rationale": string }]
}`;

function formatAnswers(answers: QuestionnaireAnswers): string {
  return [...QUESTIONS, ...EXTRA_QUESTIONS].map((q) => {
    const value = answers[q.id];
    if (value === undefined || value === "") return null;
    return `- ${q.prompt}\n  → ${value}`;
  })
    .filter(Boolean)
    .join("\n");
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Réponse du modèle sans JSON exploitable");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function generateForTier(
  tier: Tier,
  answers: QuestionnaireAnswers
): Promise<GenerationResult> {
  const config = TIERS[tier];

  const startedAt = Date.now();
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), STREAM_DEADLINE_MS);

  let message: Anthropic.Message;
  try {
    const stream = getAnthropic().messages.stream(
      {
        model: config.model,
        max_tokens: GENERATION_MAX_TOKENS,
        ...(config.tuning.thinking ? { thinking: { type: config.tuning.thinking } } : {}),
        ...(config.tuning.effort ? { output_config: { effort: config.tuning.effort } } : {}),
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Voici les réponses au questionnaire :\n\n${formatAnswers(answers)}`,
          },
        ],
      },
      { signal: controller.signal }
    );
    message = await stream.finalMessage();
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        `Délai dépassé (${Math.round(STREAM_DEADLINE_MS / 1000)} s) : la génération a été interrompue`
      );
    }
    throw err;
  } finally {
    clearTimeout(deadline);
  }

  console.log("[anthropic] réponse reçue", {
    model: config.model,
    tuning: config.tuning,
    seconds: Math.round((Date.now() - startedAt) / 1000),
    outputTokens: message.usage.output_tokens,
    maxTokens: GENERATION_MAX_TOKENS,
    thinkingBlocks: message.content.filter((block) => block.type === "thinking").length,
    stopReason: message.stop_reason,
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error("Réponse du modèle tronquée (max_tokens atteint)");
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Aucune réponse texte du modèle");
  }

  const parsed = extractJson(textBlock.text) as GenerationResult;

  // Le nombre de clients est calculé ici (objectif ÷ prix), pas par le modèle : pas d'erreur d'arithmétique.
  const goal =
    typeof answers.income_goal === "number" && answers.income_goal > 0 ? answers.income_goal : null;
  parsed.monthly_goal_eur = goal;
  parsed.pricing_options = normalizePricingOptions(parsed.pricing_options, goal);
  return cleanResultText(parsed);
}

/** Nettoie les scénarios proposés par le modèle et calcule le nombre de clients pour chacun. */
export function normalizePricingOptions(raw: unknown, goal: number | null): PricingOption[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<number>();
  const options: PricingOption[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { price_eur, billing, rationale } = item as Record<string, unknown>;
    const price = typeof price_eur === "number" ? Math.round(price_eur * 100) / 100 : NaN;
    if (!Number.isFinite(price) || price <= 0 || price > 10000 || seen.has(price)) continue;
    seen.add(price);
    options.push({
      price_eur: price,
      billing: billing === "unique" ? "unique" : "mensuel",
      clients: goal ? Math.max(1, Math.round(goal / price)) : null,
      rationale: typeof rationale === "string" ? rationale.trim().slice(0, 400) : "",
    });
  }
  return options.sort((a, b) => a.price_eur - b.price_eur).slice(0, 3);
}
