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
  skipIf?: (answers: Record<string, string | number>) => boolean;
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
    skipIf: (answers) => answers.tried_before === "Non",
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

export const INTRO_MESSAGE =
  "Avant de te générer ton SaaS sur mesure, on a besoin de mieux te connaître — plus tu es précis, plus le résultat sera collé à toi. Ça prend 3-4 minutes.";

type Answer = string | number;
type Validation = string | ((answer: Answer) => string);

// Ton sobre et motivant, sans jamais comparer à une personne ou un archétype.
const VALIDATIONS: Record<string, Validation> = {
  age: (a) =>
    Number(a) >= 36
      ? "Ton âge, c'est de l'expérience en plus, un vrai atout pour se lancer."
      : "Cet âge est un vrai avantage pour se lancer, t'as le temps de ton côté.",
  motivation:
    "Cette motivation-là, c'est exactement celle qui pousse les gens à tenir dans la durée.",
  passion: "Cette niche a un vrai potentiel en ce moment, bon choix.",
  profitable_uninterested: (a) =>
    a === "Je passe mon tour"
      ? "Choisir un sujet qui te parle, c'est ce qui aide à tenir dans la durée."
      : "Cette flexibilité, c'est un vrai atout — ça élargit beaucoup les options possibles.",
  on_camera: (a) =>
    a === "À l'aise en vidéo"
      ? "Être à l'aise devant la caméra ouvre beaucoup de formats pour se faire connaître."
      : "Rester en retrait, ça marche très bien aussi — on adaptera le plan en conséquence.",

  current_situation:
    "Ta situation ne va pas t'empêcher d'avancer là-dessus, au contraire, c'est un bon point de départ.",
  current_income: "Ok, on en tient compte pour la suite.",
  tried_before: (a) =>
    a === "Non"
      ? "Pas de souci : tu pars sans mauvaises habitudes à défaire, c'est un bon point de départ."
      : "L'expérience compte, même quand ça a pas marché — on apprend de ça.",
  tried_before_result:
    "L'expérience compte, même quand ça a pas marché — on apprend de ça.",
  invested_before: (a) =>
    /^\s*(0|aucun|rien|non|jamais)/i.test(String(a))
      ? "Pas besoin d'avoir déjà investi pour bien démarrer, on part de là où tu en es."
      : "Ça montre que t'es prêt à mettre les moyens, c'est un bon signal.",
  skills: "Ces compétences vont vraiment servir, on va s'appuyer dessus.",

  income_goal: "Objectif noté — on construit le plan pour y aller étape par étape.",
  starting_budget: (a) =>
    Number(a) < 100
      ? "Démarrer avec peu, c'est tout à fait possible — on s'adapte à ton budget."
      : "Ce budget permet de bien démarrer, on s'en sert au mieux.",
  time_per_week: "Le temps dispo décide du rythme, on va caler le plan dessus.",
  speed_vs_solid: "Bien noté, ça oriente le type d'idée qu'on va te proposer.",
  audience: (a) =>
    a === "Je pars de zéro"
      ? "Partir de zéro, ça se fait très bien avec le bon plan."
      : "Avoir déjà une audience, c'est un vrai coup d'avance.",
  steady_vs_big: "Compris, on choisit un modèle cohérent avec ça.",
  timeline:
    "Se fixer un horizon clair, c'est ce qui permet de mesurer ses progrès.",

  solo_vs_pushed:
    "Bon à savoir, le plan sera pensé pour ta façon de travailler.",
  instinct_vs_calc:
    "Les deux approches ont leurs forces, on s'adapte à la tienne.",
  would_quit_reason:
    "Merci pour cette franchise, ça nous aide à prévoir des garde-fous.",
  time_constraints:
    "On en tient compte pour que le plan reste tenable au quotidien.",
  tech_comfort: "Parfait, on ajuste le niveau technique en conséquence.",
  solo_vs_partner:
    "Noté, ça influence la forme que peut prendre le projet.",
  existing_tools: "Ce que tu utilises déjà peut devenir un vrai raccourci.",
  anything_else:
    "Merci d'avoir pris le temps, c'est ce qui rend le résultat vraiment personnel.",
};

export function getValidation(questionId: string, answer: Answer): string {
  const validation = VALIDATIONS[questionId];
  if (!validation) return "Noté.";
  return typeof validation === "function" ? validation(answer) : validation;
}

export function getVisibleQuestions(
  answers: Record<string, string | number>
): Question[] {
  return QUESTIONS.filter((q) => !q.skipIf?.(answers));
}
