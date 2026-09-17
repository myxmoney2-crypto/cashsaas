import Anthropic from "@anthropic-ai/sdk";
import type { QuestionnaireAnswers, GenerationResult, Tier } from "./types";
import { TIERS } from "./tiers";
import { QUESTIONS } from "./questionnaire";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `Tu es un générateur d'idées de SaaS. Tu reçois les réponses d'un utilisateur à 26 questions sur sa situation réelle.

À partir de l'ENSEMBLE des réponses (jamais une seule question isolée), génère :

1. Une idée de SaaS ou de business précise, réaliste, réalisable seul dans le budget et le temps disponible indiqués. Si l'utilisateur a une passion ou une niche claire, ancre l'idée dedans. Sinon, propose un "produit gagnant" générique adapté à son profil.

2. Un scaffold de code fonctionnel (un fichier HTML/JS autonome avec intégration Supabase), pas seulement un texte à copier. Le code doit être prêt à être poussé sur un repo GitHub template.

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

  const message = await anthropic.messages.create({
    model: config.model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Voici les 26 réponses du questionnaire :\n\n${formatAnswers(answers)}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Aucune réponse texte du modèle");
  }

  const parsed = extractJson(textBlock.text) as GenerationResult;
  return parsed;
}
