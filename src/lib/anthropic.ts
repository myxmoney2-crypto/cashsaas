import Anthropic from "@anthropic-ai/sdk";
import type {
  GeneratedCodeFile,
  QuestionnaireAnswers,
  GenerationResult,
  PricingOption,
  Tier,
} from "./types";
import { TIERS, type Tuning } from "./tiers";
import { EXTRA_QUESTIONS, QUESTIONS } from "./questionnaire";
import { cleanResultText } from "./text";

// Génération en deux temps (voir generateForTier) : un appel dédié à l'idée (avec toute la réflexion
// qu'il faut pour creuser), puis un appel dédié au code (avec tout le budget de tokens pour bien
// l'écrire), plutôt qu'un seul appel qui doit se partager entre les deux. Budgets larges : le coût par
// génération reste marginal face au prix payé, ce n'est plus la contrainte.
const IDEA_MAX_TOKENS = 16_000;
const CODE_MAX_TOKENS = 48_000;
// Chaque appel a son propre délai, chacun annulé proprement avant l'échéance suivante :
// idée (80s) + code (160s) < garde de runGeneration (270s) < coupure Vercel (300s).
const IDEA_DEADLINE_MS = 80_000;
const CODE_DEADLINE_MS = 160_000;

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

const IDEA_SYSTEM_PROMPT = `Tu es un stratège produit qui invente des idées de SaaS ambitieuses et rentables, taillées pour une personne précise. Tu reçois les réponses d'un utilisateur à un questionnaire sur sa situation réelle (26 questions, plus 3 questions complémentaires dont le prix qu'il vise pour son produit et s'il est prêt à passer par des clippers).

RÈGLE ABSOLUE : ne propose jamais la version la plus simple ou la plus évidente d'une idée liée au domaine indiqué. Sont interdits par défaut, sauf si l'utilisateur a explicitement demandé ce type d'outil : un traqueur de dépenses, une checklist, un journal ou carnet de suivi, une simple calculatrice, un générateur de contenu générique sans mécanique propre. Si ta première idée ressemble à ça, rejette-la et cherche encore.

MÉTHODE, dans cet ordre, avant de choisir l'idée finale :
1. Identifie le besoin profond réel derrière le domaine et le profil de la personne : pas "il aime le sport", mais par exemple maîtrise et sentiment de compétence, reconnaissance sociale, sécurité financière, appartenance à une communauté. Inspire-toi de la pyramide de Maslow pour nommer ce besoin (champ underlying_need).
2. Identifie une dynamique ou une tendance actuelle dans ce domaine (nouvel usage, frustration répandue, comportement en croissance) sur laquelle l'idée peut s'appuyer (champ market_signal).
3. Invente une idée qui a un vrai mécanisme de valeur, c'est-à-dire qui calcule, recommande, prédit, optimise ou automatise quelque chose, jamais un outil qui se contente d'afficher ce que la personne a saisi à la main. Demande-toi qui précisément (le profil, les compétences, le budget, le temps, l'audience de l'utilisateur) doit vouloir payer pour ça, et pourquoi il ne peut pas déjà l'obtenir gratuitement ou à la main ailleurs.

Exemple de calibrage du niveau de profondeur attendu, à ne jamais copier tel quel (l'idée réelle doit varier à chaque génération, voir plus bas) : pour un profil passionné de sport et intéressé par les paris sportifs, l'idée plate serait "un traqueur de mes mises". L'idée attendue ressemble plutôt à un outil qui analyse les matchs à venir, donne un pronostic avec un pourcentage de confiance estimé, et suggère une répartition d'un budget donné entre plusieurs paris selon ces pronostics. Retiens le principe (un vrai mécanisme d'analyse et de recommandation, pas un simple registre), pas l'idée elle-même.

Si l'idée touche à l'argent réel (paris, trading, investissement, crédit...) : n'implémente jamais de mise, de pari ou de transaction réelle, et prévois toujours dans le pitch et le code_brief une mention claire que les estimations sont indicatives et ne constituent pas un conseil financier.

À partir de l'ENSEMBLE des réponses (jamais une seule question isolée), génère :

1. L'idée elle-même (voir méthode ci-dessus), précise, réaliste, réalisable seul dans le budget et le temps disponible indiqués. Si l'utilisateur a une passion ou une niche claire, ancre l'idée dedans ; s'il en cite plusieurs, cherche une idée à leur croisement plutôt que d'en choisir une seule. Sinon, propose un "produit gagnant" générique adapté à son profil. Deux profils différents, même très proches, ne doivent jamais systématiquement recevoir la même idée : varie l'angle d'attaque d'une génération à l'autre (le public visé à l'intérieur de la niche, le problème précis résolu, le modèle économique).

2. Un code_brief qui servira à un autre appel, chargé d'écrire le code : le mécanisme cœur en 1 à 3 phrases (ce que la personne peut réellement FAIRE sur la page, pas juste lire), la liste ordonnée des sections/écrans attendus, et une note sur les données d'exemple à afficher (clairement présentées comme des exemples, jamais comme des données réelles).

3. Des recommandations d'outils adaptées au budget déclaré (si budget serré : tiers gratuits Vercel/Supabase ; si budget confortable : paliers payants). Dans tech_stack, chaque entrée est une courte ligne « Outil : à quoi il sert ». Dans tools_recommendation, un tableau de 3 à 6 courtes phrases (une idée par phrase, dont une sur le budget), jamais un paragraphe.

4. Un plan d'accompagnement sur 30 jours, découpé en 4 semaines, adapté au temps disponible par jour et au format de contenu choisi (avec ou sans apparition à l'écran).

5. De 2 à 3 scénarios de prix pour atteindre l'objectif de revenu mensuel indiqué par l'utilisateur (sa réponse à « Combien tu vises par mois »), afin de montrer que l'objectif est atteignable de plusieurs façons selon le prix choisi. Pour chaque scénario : le prix en euros (price_eur), s'il est mensuel (abonnement) ou unique (vente ponctuelle) (billing), et une justification courte de 1 à 2 phrases adaptée à ton idée et à son audience (rationale). Si l'utilisateur a indiqué le prix qu'il vise, l'un des scénarios doit être exactement ce prix. Ne donne PAS le nombre de clients : il est calculé automatiquement (objectif ÷ prix). Ce sont des ordres de grandeur pour illustrer, jamais une promesse : n'écris aucune garantie de revenus.

Règle d'écriture : n'utilise jamais le tiret cadratin (—) dans les textes ; préfère la virgule, le point ou les deux-points.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{
  "underlying_need": string,
  "market_signal": string,
  "idea_name": string,
  "niche": string,
  "pitch": string,
  "tech_stack": string[],
  "tools_recommendation": string[],
  "acquisition_plan": [{ "week": number, "title": string, "description": string }],
  "pricing_options": [{ "price_eur": number, "billing": "mensuel" | "unique", "rationale": string }],
  "code_brief": {
    "core_mechanic": string,
    "key_sections": string[],
    "sample_data_note": string
  }
}`;

const CODE_SYSTEM_PROMPT = `Tu écris le code d'une idée de SaaS déjà décidée (fournie dans le message), pour quelqu'un qui code peu ou pas. Livre un scaffold fonctionnel et soigné dans code_files :

- un fichier "index.html" autonome (HTML + CSS + JS dans le même fichier, aucun framework, aucune étape de build), qui sera placé à la racine d'un site statique déjà déployé sur Vercel ;
- il utilise Supabase via le CDN https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 et lit sa configuration UNIQUEMENT dans window.ENV.SUPABASE_URL et window.ENV.SUPABASE_ANON_KEY (le fichier /config.js, fourni par le template, se charge avec <script src="/config.js"></script> avant ton script) ; n'écris jamais de clé en dur ;
- une vraie authentification Supabase : inscription, connexion, déconnexion, et une interface qui change réellement selon que la personne est connectée ou non (non connectée : présentation de l'idée et du pitch ; connectée : l'outil lui-même, celui décrit dans le code_brief) ;
- la mécanique cœur décrite dans le code_brief doit être réellement interactive (elle calcule, filtre, recommande, trie... jamais du texte statique), avec des données d'exemple clairement présentées comme telles dans l'interface, jamais comme des données réelles ou en direct ;
- un vrai système visuel : une palette de couleurs cohérente adaptée au sujet de l'idée (pas forcément celle de CashSaaS), une typographie soignée, une mise en page structurée en sections claires, et un rendu correct sur mobile ;
- si des tables sont nécessaires, ajoute aussi un fichier "supabase/schema.sql" (rejouable sans risque, RLS activé, policies adaptées à la clé anon) ; ne réutilise pas la table "leads" du template sauf si elle convient vraiment ;
- si l'idée touche à l'argent réel, aucune mise, aucun pari, aucune transaction réelle implémentée : seulement une mention visible dans l'interface que ce sont des estimations indicatives, pas un conseil financier ;
- le code doit être complet et fonctionner tel quel, sans dépendance supplémentaire.

Règle d'écriture : n'utilise jamais le tiret cadratin (—) dans les textes visibles à l'écran ; préfère la virgule, le point ou les deux-points.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{ "code_files": [{ "path": string, "content": string }] }`;

type CodeBrief = {
  core_mechanic?: string;
  key_sections?: string[];
  sample_data_note?: string;
};

/** Ce que produit le premier appel (idée) : GenerationResult sans code_files, plus le brief pour le second appel. */
type IdeaDraft = Omit<GenerationResult, "code_files"> & { code_brief?: CodeBrief };

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

/** Un seul appel Claude, en flux continu, avec son propre délai. Partagé par l'appel idée et l'appel code. */
async function callClaude(params: {
  phase: "idée" | "code";
  model: string;
  tuning: Tuning;
  maxTokens: number;
  deadlineMs: number;
  system: string;
  userContent: string;
}): Promise<Anthropic.Message> {
  const { phase, model, tuning, maxTokens, deadlineMs, system, userContent } = params;
  const startedAt = Date.now();
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), deadlineMs);

  let message: Anthropic.Message;
  try {
    const stream = getAnthropic().messages.stream(
      {
        model,
        max_tokens: maxTokens,
        ...(tuning.thinking ? { thinking: { type: tuning.thinking } } : {}),
        ...(tuning.effort ? { output_config: { effort: tuning.effort } } : {}),
        system,
        messages: [{ role: "user", content: userContent }],
      },
      { signal: controller.signal }
    );
    message = await stream.finalMessage();
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        `Délai dépassé (${Math.round(deadlineMs / 1000)} s) à l'étape ${phase} : la génération a été interrompue`
      );
    }
    throw err;
  } finally {
    clearTimeout(deadline);
  }

  console.log(`[anthropic] réponse reçue (${phase})`, {
    model,
    tuning,
    seconds: Math.round((Date.now() - startedAt) / 1000),
    outputTokens: message.usage.output_tokens,
    maxTokens,
    thinkingBlocks: message.content.filter((block) => block.type === "thinking").length,
    stopReason: message.stop_reason,
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error(`Réponse du modèle tronquée à l'étape ${phase} (max_tokens atteint)`);
  }
  return message;
}

function textOf(message: Anthropic.Message): string {
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Aucune réponse texte du modèle");
  }
  return textBlock.text;
}

async function generateIdea(
  model: string,
  tuning: Tuning,
  answers: QuestionnaireAnswers
): Promise<IdeaDraft> {
  const message = await callClaude({
    phase: "idée",
    model,
    tuning,
    maxTokens: IDEA_MAX_TOKENS,
    deadlineMs: IDEA_DEADLINE_MS,
    system: IDEA_SYSTEM_PROMPT,
    userContent: `Voici les réponses au questionnaire :\n\n${formatAnswers(answers)}`,
  });
  return extractJson(textOf(message)) as IdeaDraft;
}

async function generateCode(
  model: string,
  tuning: Tuning,
  answers: QuestionnaireAnswers,
  idea: IdeaDraft
): Promise<GeneratedCodeFile[]> {
  const brief = idea.code_brief ?? {};
  const briefText = `Idée à coder :
- Nom : ${idea.idea_name}
- Niche : ${idea.niche}
- Pitch : ${idea.pitch}
- Stack recommandée : ${(idea.tech_stack ?? []).join(", ")}
- Mécanique cœur : ${brief.core_mechanic ?? ""}
- Sections attendues : ${(brief.key_sections ?? []).join(", ")}
- Données d'exemple : ${brief.sample_data_note ?? ""}

Réponses au questionnaire, pour le contexte (budget, aisance technique, temps disponible...) :

${formatAnswers(answers)}`;

  const message = await callClaude({
    phase: "code",
    model,
    tuning,
    maxTokens: CODE_MAX_TOKENS,
    deadlineMs: CODE_DEADLINE_MS,
    system: CODE_SYSTEM_PROMPT,
    userContent: briefText,
  });
  const parsed = extractJson(textOf(message)) as { code_files?: GeneratedCodeFile[] };
  if (!Array.isArray(parsed.code_files) || parsed.code_files.length === 0) {
    throw new Error("Aucun fichier de code dans la réponse du modèle");
  }
  return parsed.code_files;
}

export async function generateForTier(
  tier: Tier,
  answers: QuestionnaireAnswers
): Promise<GenerationResult> {
  const config = TIERS[tier];

  // Deux appels séparés, l'un après l'autre : le code doit être écrit à partir de l'idée décidée par le
  // premier appel (même nom, mêmes fonctionnalités), donc il ne peut pas partir en même temps qu'elle.
  const idea = await generateIdea(config.model, config.ideaTuning, answers);
  const codeFiles = await generateCode(config.model, config.codeTuning, answers, idea);

  // code_brief n'a servi qu'à guider l'appel code : il ne fait pas partie du résultat final (le rest
  // ci-dessous l'exclut réellement de ideaFields, pas juste au niveau des types).
  const { code_brief, ...ideaFields } = idea;
  void code_brief;
  const parsed: GenerationResult = { ...ideaFields, code_files: codeFiles };

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
