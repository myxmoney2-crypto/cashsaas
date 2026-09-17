export type QuestionType = "text" | "textarea" | "choice" | "slider" | "number";

export type Question = {
  id: string;
  block: number;
  type: QuestionType;
  prompt: string;
  choices?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
};

export type Block = {
  id: number;
  title: string;
};

export const BLOCKS: Block[] = [
  { id: 1, title: "Identité et passions" },
  { id: 2, title: "Situation actuelle" },
  { id: 3, title: "Objectifs et budget" },
  { id: 4, title: "Style de vie et personnalité" },
];

export const QUESTIONS: Question[] = [
  // Bloc 1 — Identité et passions
  { id: "age", block: 1, type: "number", prompt: "Tu as quel âge ?", placeholder: "25" },
  {
    id: "motivation",
    block: 1,
    type: "choice",
    prompt: "Qu'est-ce qui t'anime le plus dans la vie ?",
    choices: [
      "Faire de l'argent avant tout",
      "Une passion précise",
      "La liberté et l'indépendance",
      "Prouver un truc à toi-même ou aux autres",
    ],
  },
  {
    id: "passion",
    block: 1,
    type: "textarea",
    prompt: "T'as une passion ou un domaine qui te capte vraiment ?",
    placeholder: "Décris-le en quelques mots...",
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
    id: "current_income",
    block: 2,
    type: "number",
    prompt: "Tu gagnes combien par mois actuellement ?",
    placeholder: "1500",
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
  },
  {
    id: "invested_before",
    block: 2,
    type: "text",
    prompt: "T'as déjà investi de l'argent dans un projet avant ? Combien à peu près ?",
    placeholder: "0 €, 500 €, ...",
  },
  {
    id: "skills",
    block: 2,
    type: "choice",
    prompt: "T'as des compétences particulières que tu pourrais mettre à profit ?",
    choices: ["Design", "Code", "Vente", "Création de contenu", "Autre"],
  },

  // Bloc 3 — Objectifs et budget
  {
    id: "income_goal",
    block: 3,
    type: "slider",
    prompt: "Combien tu vises par mois, à terme ?",
    min: 1000,
    max: 50000,
    step: 500,
  },
  {
    id: "starting_budget",
    block: 3,
    type: "number",
    prompt: "Budget de départ pour te lancer là-dedans ?",
    placeholder: "500",
  },
  {
    id: "time_per_week",
    block: 3,
    type: "number",
    prompt: "Combien de temps tu peux vraiment y consacrer par semaine ? (heures)",
    placeholder: "10",
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
    choices: ["J'ai déjà une audience", "Je pars de zéro"],
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
    type: "text",
    prompt: "Sur combien de temps tu te donnes pour voir si ça marche, avant de passer à autre chose ?",
    placeholder: "3 mois, 6 mois, 1 an...",
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
    prompt: "T'es plutôt du genre à foncer sans trop réfléchir, ou à tout calculer avant d'agir ?",
    choices: ["Je fonce", "Je calcule tout"],
  },
  {
    id: "would_quit_reason",
    block: 4,
    type: "textarea",
    prompt: "Qu'est-ce qui te ferait abandonner un projet en cours de route ?",
    placeholder: "...",
  },
  {
    id: "time_constraints",
    block: 4,
    type: "textarea",
    prompt:
      "T'as un truc dans ta vie de tous les jours (études, taf, famille) qui va te prendre beaucoup de temps en parallèle ?",
    placeholder: "...",
  },
  {
    id: "tech_comfort",
    block: 4,
    type: "choice",
    prompt: "T'es à l'aise avec la technique/le code, ou tu préfères que tout soit simplifié au max ?",
    choices: ["À l'aise avec la technique", "Tout simplifié au max"],
  },
  {
    id: "solo_vs_partner",
    block: 4,
    type: "choice",
    prompt: "Tu préfères rester 100 % solo sur le projet, ou t'es ouvert à t'associer avec quelqu'un ?",
    choices: ["100 % solo", "Ouvert à m'associer"],
  },
  {
    id: "existing_tools",
    block: 4,
    type: "textarea",
    prompt:
      "T'as déjà des outils ou comptes que tu utilises régulièrement (réseaux sociaux, logiciels) qu'on pourrait exploiter direct ?",
    placeholder: "...",
  },
  {
    id: "anything_else",
    block: 4,
    type: "textarea",
    prompt: "Y'a un truc que t'as pas pu dire dans les questions précédentes et qui compte pour toi ?",
    placeholder: "...",
  },
];
