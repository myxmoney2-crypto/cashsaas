import { RECURRING_CHOICE, parsePrice, type Answers } from "./questionnaire";

export type Simulation = {
  goal: number;
  price: number | null;
  recurring: boolean;
  /** Nombre de clients (ou de ventes) qu'il faudrait pour atteindre l'objectif au prix visé. */
  count: number | null;
  sentence: string;
  chips: string[];
};

export const SIMULATION_DISCLAIMER =
  "Simulation : ce chiffre est l'objectif que tu as indiqué, présenté comme s'il était atteint. Ce ne sont ni de vrais paiements ni de vrais clients, et aucun résultat n'est garanti.";

export const formatNumber = (n: number) => n.toLocaleString("fr-FR");

/**
 * Tout vient des réponses de la personne : objectif (entonnoir), prix visé (pop-up),
 * abonnement ou vente unique (« petit à petit chaque mois » / « gros coup »). Rien n'est deviné.
 */
export function buildSimulation(answers: Answers): Simulation | null {
  const goal = answers.income_goal;
  if (typeof goal !== "number" || !Number.isFinite(goal) || goal <= 0) return null;

  const price = parsePrice(String(answers.target_price ?? ""));
  const recurring = answers.steady_vs_big === RECURRING_CHOICE;
  const count = price ? Math.round(goal / price) : null;

  let sentence = `C'est l'objectif de ${formatNumber(goal)} € par mois que tu as indiqué.`;
  if (price && count) {
    sentence = recurring
      ? `Ça représente par exemple environ ${formatNumber(count)} clients qui payent ${price} € par mois sur ton site.`
      : `Ça représente par exemple environ ${formatNumber(count)} ventes à ${price} € sur ton site.`;
  }

  const chips: string[] = [];
  if (typeof answers.timeline === "string") chips.push(`Ton horizon : ${answers.timeline}`);
  if (typeof answers.starting_budget === "string") {
    chips.push(`Ton budget de départ : ${answers.starting_budget}`);
  }

  return { goal, price, recurring, count, sentence, chips };
}
