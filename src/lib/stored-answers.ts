import type { Answers } from "./questionnaire";

// Les réponses restent dans le navigateur entre « Envoyer mes réponses » et la création du compte /
// le paiement. localStorage (et pas sessionStorage) pour survivre à un lien de confirmation d'email
// ouvert dans un autre onglet.
const KEY = "cashsaas:answers:v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function saveStoredAnswers(answers: Answers): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), answers }));
  } catch {
    // stockage indisponible (navigation privée stricte) : le parcours échouera proprement à l'étape suivante
  }
}

export function readRawStoredAnswers(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseStoredAnswers(raw: string | null): Answers | null {
  if (!raw) return null;
  try {
    const { savedAt, answers } = JSON.parse(raw);
    if (typeof savedAt !== "number" || Date.now() - savedAt > TTL_MS) return null;
    if (typeof answers !== "object" || answers === null || Array.isArray(answers)) return null;
    return answers as Answers;
  } catch {
    return null;
  }
}

export function clearStoredAnswers(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}
