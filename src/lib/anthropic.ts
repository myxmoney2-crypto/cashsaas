import Anthropic from "@anthropic-ai/sdk";
import type { QuestionnaireAnswers, GenerationResult, Tier } from "./types";
import { TIERS } from "./tiers";
import { QUESTIONS } from "./questionnaire";

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

  cached = new Anthropic({ apiKey });
  return cached;
}

const SYSTEM_PROMPT = `Tu es un générateur d'idées de SaaS. Tu reçois les réponses d'un utilisateur à 26 questions sur sa situation réelle.

À partir de l'ENSEMBLE des réponses (jamais une seule question isolée), génère :

1. Une idée de SaaS ou de business précise, réaliste, réalisable seul dans le budget et le temps disponible indiqués. Si l'utilisateur a une passion ou une niche claire, ancre l'idée dedans. Sinon, propose un "produit gagnant" générique adapté à son profil.

2. Un scaffold de code fonctionnel, livré dans code_files :
   - un fichier "index.html" autonome (HTML + CSS + JS dans le même fichier, aucun framework, aucune étape de build), qui sera placé à la racine d'un site statique déjà déployé sur Vercel ;
   - il utilise Supabase via le CDN https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 et lit sa configuration UNIQUEMENT dans window.ENV.SUPABASE_URL et window.ENV.SUPABASE_ANON_KEY (le fichier /config.js, fourni par le template, se charge avec <script src="/config.js"></script> avant ton script) ; n'écris jamais de clé en dur ;
   - si des tables sont nécessaires, ajoute aussi un fichier "supabase/schema.sql" (rejouable sans risque, RLS activé, policies adaptées à la clé anon) ; ne réutilise pas la table "leads" du template sauf si elle convient vraiment ;
   - le code doit être complet et fonctionner tel quel, sans dépendance supplémentaire.

3. Des recommandations d'outils adaptées au budget déclaré (si budget serré : tiers gratuits Vercel/Supabase ; si budget confortable : paliers payants).

4. Un plan d'accompagnement sur 30 jours, découpé en 4 semaines, adapté au temps disponible par semaine et au format de contenu choisi (avec ou sans apparition à l'écran).

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{
  "idea_name": string,
  "niche": string,
  "pitch": string,
  "tech_stack": string[],
  "code_files": [{ "path": string, "content": string }],
  "tools_recommendation": string,
  "acquisition_plan": [{ "week": number, "title": string, "description": string }]
}`;

function formatAnswers(answers: QuestionnaireAnswers): string {
  return QUESTIONS.map((q) => {
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

  const message = await getAnthropic().messages.create({
    model: config.model,
    max_tokens: 12000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Voici les 26 réponses du questionnaire :\n\n${formatAnswers(answers)}`,
      },
    ],
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error("Réponse du modèle tronquée (max_tokens atteint)");
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Aucune réponse texte du modèle");
  }

  const parsed = extractJson(textBlock.text) as GenerationResult;
  return parsed;
}
