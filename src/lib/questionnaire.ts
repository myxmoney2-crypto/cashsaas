export type QuestionType = "textarea" | "choice" | "slider";

export type Answers = Record<string, string | number>;

export type Question = {
  id: string;
  block: number;
  type: QuestionType;
  prompt: string;
  choices?: string[];
  /** Plusieurs choix possibles ; la réponse est stockée jointe par ", " (donc pas de virgule dans les choix). */
  multi?: boolean;
  /** Choix qui désélectionne tous les autres (multi uniquement). */
  exclusive?: string;
  /** Ajoute une option « Autre » qui ouvre un champ texte (avec multi, sa saisie s'ajoute aux choix cochés). */
  allowOther?: boolean;
  /**
   * Trop de choix pour une grille de boutons (ex. domaines/passions) : affiche une recherche +
   * liste à cocher à la place. Réservé à `multi: true`.
   */
  searchable?: boolean;
  /** Nombre maximum de choix cochables (multi uniquement). */
  maxChoices?: number;
  /** La question peut rester sans réponse. */
  optional?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  skipIf?: (answers: Answers) => boolean;
};

export type Block = {
  id: number;
  title: string;
};

export const BLOCKS: Block[] = [
  { id: 1, title: "Toi et tes ambitions" },
  { id: 2, title: "Situation actuelle" },
  { id: 3, title: "Budget et rythme" },
  { id: 4, title: "Style de vie et personnalité" },
];

// L'ordre des `choices` sert de clé aux phrases de validation (src/lib/validations.ts) :
// si tu réordonnes ou ajoutes un choix, mets à jour les variantes correspondantes.
export const QUESTIONS: Question[] = [
  // Bloc 1 — Toi et tes ambitions (les questions chiffrées remontent tôt)
  {
    id: "age",
    block: 1,
    type: "choice",
    prompt: "Tu as quel âge ?",
    choices: [
      "18-24 ans",
      "25-29 ans",
      "30-34 ans",
      "35-44 ans",
      "45 ans et plus",
    ],
  },
  {
    id: "motivation",
    block: 1,
    type: "choice",
    prompt: "Qu'est-ce qui t'anime dans la vie ?",
    choices: [
      "Faire de l'argent avant tout",
      "Une passion précise",
      "La liberté et l'indépendance",
      "Prouver un truc à toi-même ou aux autres",
    ],
    multi: true,
  },
  {
    id: "current_income",
    block: 1,
    type: "choice",
    prompt: "Tu gagnes combien par mois actuellement ?",
    choices: [
      "Aucun revenu pour l'instant",
      "Moins de 1 000 €",
      "1 000 – 2 000 €",
      "2 000 – 3 500 €",
      "Plus de 3 500 €",
    ],
  },
  {
    id: "income_goal",
    block: 1,
    type: "slider",
    prompt: "Combien tu vises par mois, à terme ?",
    min: 1000,
    max: 50000,
    step: 500,
  },
  {
    id: "passion",
    block: 1,
    type: "choice",
    prompt: "T'as une passion ou un domaine qui te capte vraiment ?",
    choices: [
      "Sport",
      "Bien-être et méditation",
      "Cuisine et alimentation",
      "Mode",
      "Beauté et soins",
      "Jeux vidéo et esport",
      "Technologie et gadgets",
      "Argent et investissement",
      "Immobilier",
      "Voyage",
      "Musique",
      "Cinéma et séries",
      "Lecture et littérature",
      "Bricolage et DIY",
      "Photo et vidéo",
      "Art et création",
      "Coaching et développement personnel",
      "Éducation et pédagogie",
      "Santé",
      "Animaux",
      "Automobile et moto",
      "Parentalité et famille",
      "Événementiel (mariages, fêtes)",
      "Décoration et intérieur",
      "Jardinage et plantes",
      "Écologie et durabilité",
    ],
    multi: true,
    searchable: true,
    maxChoices: 5,
    allowOther: true,
  },
  {
    id: "profitable_uninterested",
    block: 1,
    type: "choice",
    prompt:
      "Si on te met dans un secteur qui rapporte gros mais qui t'intéresse pas, tu fonces quand même ou tu passes ton tour ?",
    choices: ["Je fonce quand même", "Je passe mon tour"],
  },
  {
    id: "on_camera",
    block: 1,
    type: "choice",
    prompt:
      "T'es à l'aise pour apparaître en vidéo (visage, voix), ou tu préfères rester anonyme derrière ton projet ?",
    choices: ["À l'aise en vidéo", "Je préfère rester anonyme"],
  },

  // Bloc 2 — Situation actuelle
  {
    id: "current_situation",
    block: 2,
    type: "choice",
    prompt: "T'en es où en ce moment ?",
    choices: ["Étudiant", "Salarié", "Déjà entrepreneur", "Autre"],
  },
  {
    id: "tried_before",
    block: 2,
    type: "choice",
    prompt: "T'as déjà tenté de lancer un projet ou un business avant ?",
    choices: ["Oui", "Non"],
  },
  {
    id: "tried_before_result",
    block: 2,
    type: "textarea",
    prompt: "Si oui, ça a donné quoi ?",
    placeholder: "Raconte brièvement...",
    skipIf: (answers) => answers.tried_before === "Non",
  },
  {
    id: "invested_before",
    block: 2,
    type: "choice",
    prompt:
      "T'as déjà investi de l'argent dans un projet avant ? Combien à peu près ?",
    choices: [
      "Rien du tout",
      "Moins de 100 €",
      "100 – 500 €",
      "500 – 2 000 €",
      "Plus de 2 000 €",
    ],
  },
  {
    id: "skills",
    block: 2,
    type: "choice",
    prompt:
      "T'as des compétences particulières que tu pourrais mettre à profit ?",
    choices: [
      "Design",
      "Code",
      "Vente",
      "Création de contenu",
      "Rédaction",
      "Aucune en particulier",
    ],
    multi: true,
    exclusive: "Aucune en particulier",
  },

  // Bloc 3 — Budget et rythme
  {
    id: "starting_budget",
    block: 3,
    type: "choice",
    prompt: "Budget de départ pour te lancer là-dedans ?",
    choices: [
      "Aucun budget",
      "Moins de 100 €",
      "100 – 500 €",
      "500 – 2 000 €",
      "Plus de 2 000 €",
    ],
  },
  {
    id: "time_per_day",
    block: 3,
    type: "choice",
    prompt: "Combien de temps tu peux vraiment y consacrer par jour ?",
    choices: ["15 min", "30 min", "1 h", "2 h", "3 h", "5 h et plus"],
  },
  {
    id: "speed_vs_solid",
    block: 3,
    type: "choice",
    prompt:
      "Tu veux du résultat rapide quitte à galérer plus tard, ou construire lentement mais solide ?",
    choices: ["Résultat rapide", "Lentement mais solide"],
  },
  {
    id: "audience",
    block: 3,
    type: "choice",
    prompt:
      "T'as déjà un moyen de toucher du monde (réseaux, audience, bouche à oreille) ou tu pars de zéro ?",
    choices: [
      "Je pars de zéro",
      "Une petite audience (moins de 1 000 personnes)",
      "Une audience moyenne (1 000 à 10 000 personnes)",
      "Une grosse audience (plus de 10 000 personnes)",
    ],
  },
  {
    id: "steady_vs_big",
    block: 3,
    type: "choice",
    prompt:
      "Tu préfères un truc qui rapporte petit à petit chaque mois, ou un gros coup rapide mais moins stable ?",
    choices: ["Petit à petit chaque mois", "Gros coup rapide"],
  },
  {
    id: "timeline",
    block: 3,
    type: "choice",
    prompt:
      "Sur combien de temps tu te donnes pour voir si ça marche, avant de passer à autre chose ?",
    choices: ["1 mois", "3 mois", "6 mois", "1 an", "Plus d'un an"],
  },

  // Bloc 4 — Style de vie et personnalité
  {
    id: "solo_vs_pushed",
    block: 4,
    type: "choice",
    prompt: "Tu bosses mieux seul ou t'as besoin d'être poussé/accompagné ?",
    choices: ["Mieux seul", "Besoin d'être accompagné"],
  },
  {
    id: "instinct_vs_calc",
    block: 4,
    type: "choice",
    prompt:
      "T'es plutôt du genre à foncer sans trop réfléchir, ou à tout calculer avant d'agir ?",
    choices: ["Je fonce", "Je calcule tout"],
  },
  {
    id: "would_quit_reason",
    block: 4,
    type: "choice",
    prompt: "Qu'est-ce qui te ferait abandonner un projet en cours de route ?",
    choices: [
      "Le manque de résultats rapides",
      "Le manque de temps",
      "Le manque d'argent",
      "La perte de motivation",
      "Le doute sur mes compétences",
    ],
    multi: true,
    allowOther: true,
  },
  {
    id: "time_constraints",
    block: 4,
    type: "choice",
    prompt:
      "T'as un truc dans ta vie de tous les jours (études, taf, famille) qui va te prendre beaucoup de temps en parallèle ?",
    choices: [
      "Mes études",
      "Un travail à temps plein",
      "Ma famille",
      "Un peu de tout ça",
      "Rien de particulier",
    ],
    multi: true,
    exclusive: "Rien de particulier",
    allowOther: true,
  },
  {
    id: "tech_comfort",
    block: 4,
    type: "choice",
    prompt:
      "T'es à l'aise avec la technique/le code, ou tu préfères que tout soit simplifié au max ?",
    choices: ["À l'aise avec la technique", "Tout simplifié au max"],
  },
  {
    id: "solo_vs_partner",
    block: 4,
    type: "choice",
    prompt:
      "Tu préfères rester 100 % solo sur le projet, ou t'es ouvert à t'associer avec quelqu'un ?",
    choices: ["100 % solo", "Ouvert à m'associer"],
  },
  {
    id: "existing_tools",
    block: 4,
    type: "choice",
    prompt:
      "T'as déjà des outils ou comptes que tu utilises régulièrement qu'on pourrait exploiter direct ?",
    choices: [
      "Instagram",
      "TikTok",
      "YouTube",
      "Une newsletter",
      "Un site ou un blog",
      "Aucun en particulier",
    ],
    multi: true,
    exclusive: "Aucun en particulier",
  },
  {
    id: "anything_else",
    block: 4,
    type: "textarea",
    prompt:
      "Y'a un truc que t'as pas pu dire dans les questions précédentes et qui compte pour toi ?",
    placeholder: "Facultatif",
    optional: true,
  },
];

export const INTRO_MESSAGE =
  "Avant de te générer ton SaaS sur mesure, on a besoin de mieux te connaître — plus tu es précis, plus le résultat sera collé à toi. Ça prend 3-4 minutes.";

/** Nombre de questions rapides posées APRÈS l'écran de simulation. */
export const TAIL_QUESTIONS = 3;

export function getVisibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.skipIf?.(answers));
}

/** Toutes les questions posées (donc non sautées) et non facultatives ont une réponse. */
export function isComplete(answers: Answers): boolean {
  return getVisibleQuestions(answers).every(
    (q) => q.optional || answers[q.id] !== undefined,
  );
}

/** Toutes les questions d'avant la simulation ont une réponse (celles dont elle a besoin y sont). */
export function isReadyForSimulation(answers: Answers): boolean {
  return getVisibleQuestions(answers)
    .slice(0, -TAIL_QUESTIONS)
    .every((q) => q.optional || answers[q.id] !== undefined);
}

/** La simulation a été vue : sa dernière question (le prix visé) a reçu une réponse. */
export function isSimulationDone(answers: Answers): boolean {
  return answers.target_price !== undefined;
}

/** Index de la première question sans réponse (ou de la dernière si tout est répondu). */
export function firstUnansweredIndex(answers: Answers): number {
  const questions = getVisibleQuestions(answers);
  const i = questions.findIndex(
    (q) => answers[q.id] === undefined || answers[q.id] === "",
  );
  return i === -1 ? questions.length - 1 : i;
}

export type ExtraQuestion = {
  id: string;
  prompt: string;
  choices: string[];
};

// Posées en pop-up pendant l'écran « calcul en cours » ; leurs réponses sont ajoutées aux autres.
// Facultatives pour la complétude (elles ne sont pas dans QUESTIONS).
export const EXTRA_QUESTIONS: ExtraQuestion[] = [
  {
    id: "daily_content",
    prompt: "Tu es prêt à poster du contenu tous les jours ?",
    choices: ["Oui", "Non"],
  },
  {
    // Sert au module d'acquisition de la mini-formation (clippers) ; pas d'impact sur la simulation.
    id: "clippers",
    prompt:
      "Tu serais prêt à passer par des clippers (des personnes payées pour poster des extraits de ton contenu sur TikTok) ?",
    choices: ["Oui", "Non", "Je ne sais pas encore"],
  },
  {
    // Sert au calcul de la simulation : le prix vient de la personne, il n'est jamais deviné.
    id: "target_price",
    prompt: "Tu vises quel prix pour ton produit ?",
    choices: ["9 €", "19 €", "29 €", "49 €", "99 €"],
  },
];

export const RECURRING_CHOICE = "Petit à petit chaque mois";

export function parsePrice(choice: string): number | null {
  const price = parseInt(choice, 10);
  return Number.isFinite(price) && price > 0 ? price : null;
}
