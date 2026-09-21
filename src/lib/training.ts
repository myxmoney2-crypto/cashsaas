/*
 * Mini-formation « lancer ton SaaS » (acquisition, contenu), affichée à la fin du parcours de publication.
 * Le contenu n'est pas encore là : pour l'ajouter, il suffit de remplir TRAINING_MODULES ci-dessous.
 * Les fichiers audio et vidéo se déposent dans public/formation/ (servis depuis notre propre domaine,
 * donc sans cookie ni requête vers un service tiers) et se référencent par "/formation/nom-du-fichier".
 */

import type { Answers } from "./questionnaire";

export type TrainingKind = "video" | "audio" | "text";

export type TrainingModule = {
  id: string;
  title: string;
  kind: TrainingKind;
  /** Une ligne sous le titre. */
  summary?: string;
  /** Durée affichée, ex. "4 min". */
  duration?: string;
  /** Fichier audio ou vidéo, ex. "/formation/module-1.mp4". */
  src?: string;
  /** Vidéo : miniature affichée avant la lecture. */
  poster?: string;
  /** Vidéo : sous-titres au format .vtt (accessibilité). */
  captions?: string;
  /** Texte du module, ou transcription pour l'audio et la vidéo (un paragraphe par entrée). */
  body?: string[];
  /** Module écrit, découpé en sections (titre, paragraphes, puces). */
  sections?: TrainingSection[];
};

export type TrainingSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const TRAINING_MODULES: TrainingModule[] = [];

// Part du budget de départ gardée de côté pour les clés API (Claude, OpenAI...) du SaaS de la personne :
// sans crédit sur ces clés, son produit s'arrête de répondre à ses clients. Point de départ, pas une règle.
export const API_RESERVE_SHARE = 0.35;

// Le questionnaire donne une fourchette, pas un montant : on prend le bas de la fourchette (prudent), et 50 € pour « moins de 100 € ».
const BUDGET_BASE: [prefix: string, euros: number][] = [
  ["Aucun", 0],
  ["Moins de 100", 50],
  ["100", 100],
  ["500", 500],
  ["Plus de 2", 2000],
];

const euro = (n: number) => `${n.toLocaleString("fr-FR")} €`;

export function startingBudgetBase(answers: Answers | null): { label: string; base: number } | null {
  const label = answers?.starting_budget;
  if (typeof label !== "string") return null;
  const match = BUDGET_BASE.find(([prefix]) => label.startsWith(prefix));
  return match ? { label, base: match[1] } : null;
}

function budgetSection(answers: Answers | null, clippers: string | undefined): TrainingSection {
  const budget = startingBudgetBase(answers);
  if (!budget) {
    return {
      heading: "Répartir ton budget",
      paragraphs: [
        "Garde toujours une part de ton budget de côté pour les clés API de ton SaaS (Claude, OpenAI...), avant de dépenser le reste pour te faire connaître.",
      ],
    };
  }
  if (budget.base === 0) {
    return {
      heading: "Répartir ton budget",
      paragraphs: [
        "Tu n'as pas indiqué de budget de départ : commence par publier toi-même, gratuitement, sans clippers ni publicité.",
        "Dès que les premiers paiements arrivent, mets d'abord de côté de quoi payer les clés API de ton SaaS (Claude, OpenAI...). C'est elles qui font répondre ton produit à tes clients : sans crédit dessus, il s'arrête.",
      ],
    };
  }

  const acquisition = Math.round(budget.base * (1 - API_RESERVE_SHARE));
  const api = budget.base - acquisition;
  const acquisitionUse =
    clippers === "Oui"
      ? "payer tes clippers au résultat et tester du contenu."
      : "tester du contenu, et une petite publicité si tes vidéos marchent déjà.";
  return {
    heading: "Répartir ton budget",
    paragraphs: [
      `Tu as indiqué « ${budget.label} » au départ. La fourchette est large : pour rester prudent, on calcule sur ${euro(budget.base)}.`,
    ],
    bullets: [
      `Acquisition, ${Math.round((1 - API_RESERVE_SHARE) * 100)} % (${euro(acquisition)}) : ${acquisitionUse}`,
      `Clés API, ${Math.round(API_RESERVE_SHARE * 100)} % (${euro(api)}) : à garder de côté, sans y toucher. Si ton SaaS utilise une IA (Claude, OpenAI...), chaque utilisation d'un de tes clients consomme un peu de crédit sur TA clé. Sans crédit, ton SaaS ne peut plus servir ses clients.`,
      "Dans la console de ton fournisseur d'IA, fixe une limite de dépense mensuelle : elle t'évite une mauvaise surprise si l'usage explose.",
    ],
  };
}

/** Module d'acquisition : le contenu s'adapte aux réponses du questionnaire (budget, clippers). */
export function buildAcquisitionModule(answers: Answers | null): TrainingModule {
  const clippers = typeof answers?.clippers === "string" ? answers.clippers : undefined;
  const clippersIntro =
    clippers === "Oui"
      ? "Tu as répondu que tu es prêt à passer par des clippers : la partie suivante est faite pour toi."
      : clippers === "Non"
        ? "Tu as répondu que tu ne veux pas passer par des clippers : tu peux sauter cette partie et y revenir si tu changes d'avis."
        : "Tu ne sais pas encore si tu veux passer par des clippers : tu peux commencer sans, et les ajouter quand tu seras prêt.";

  return {
    id: "acquisition",
    kind: "text",
    title: "Trouver tes premiers clients avec TikTok",
    summary: "Plusieurs comptes, des clippers payés au résultat, et un budget réparti sans oublier tes clés API.",
    sections: [
      {
        heading: "Créer plusieurs comptes TikTok",
        paragraphs: [
          "Un seul compte, c'est un seul tirage : TikTok montre chaque vidéo à un petit groupe avant de la pousser plus loin. Avec plusieurs comptes, tu multiplies tes chances d'être vu par des publics différents.",
        ],
        bullets: [
          "Un angle par compte : par exemple les astuces, les coulisses de la construction de ton SaaS, les résultats, les réponses aux questions.",
          "Ne poste jamais la même vidéo telle quelle sur tous les comptes : TikTok pénalise les contenus dupliqués. Change le début, le texte, le montage.",
          "Pas de faux engagement (achat de likes ou de vues) : ça peut faire bloquer tes comptes.",
          "Relis les règles de TikTok sur les comptes multiples avant de te lancer : elles évoluent.",
          "Mets le lien vers ton site dans la bio de chaque compte quand TikTok le permet.",
        ],
      },
      {
        heading: "Passer par des clippers",
        paragraphs: [
          clippersIntro,
          "Un clipper est quelqu'un qui découpe et publie des extraits de ton contenu sur ses propres comptes. Tu le rémunères selon les résultats, pas au temps passé.",
        ],
      },
      {
        heading: "Rémunérer les clippers avec un lien de parrainage",
        paragraphs: [
          "Chaque clipper reçoit son propre lien vers ton site, avec son code, par exemple ton-site.com/?ref=code-du-clipper. Quand une personne arrive par ce lien puis achète, tu sais quel clipper l'a amenée, et tu le rémunères en conséquence.",
        ],
        bullets: [
          "Un code unique par clipper, jamais partagé.",
          "Compte les visites et les ventes de chaque code avant de payer.",
          "Le SaaS généré ne suit pas encore les codes de parrainage tout seul : c'est un ajout à faire (tu peux demander à Claude de lire le paramètre ?ref= et de l'enregistrer dans Supabase).",
          "Tarifs (par 1 000 vues ou commission en %) : les chiffres réels seront ajoutés ici prochainement.",
        ],
      },
      budgetSection(answers, clippers),
    ],
  };
}

export function getTrainingModules(answers: Answers | null): TrainingModule[] {
  return [buildAcquisitionModule(answers), ...TRAINING_MODULES];
}
