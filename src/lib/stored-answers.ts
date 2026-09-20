import type { Answers } from "./questionnaire";

// Les réponses restent dans le navigateur entre « Envoyer mes réponses » et la création du compte /
// le paiement. localStorage (et pas sessionStorage) pour survivre à un lien de confirmation d'email
// ouvert dans un autre onglet.
const KEY = "cashsaas:answers:v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CHANGE_EVENT = "cashsaas:answers-changed";

// L'événement « storage » ne part que vers les AUTRES onglets : on ajoute le nôtre pour l'onglet courant.
export function subscribeStoredAnswers(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function saveStoredAnswers(answers: Answers): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), answers }));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // stockage indisponible (navigation privée stricte) : le parcours échouera proprement à l'étape suivante
  }
}

/** Ajoute des réponses (ex. celles du pop-up de calcul) à celles déjà gardées. */
export function mergeStoredAnswers(extra: Answers): void {
  const current = parseStoredAnswers(readRawStoredAnswers());
  if (current) saveStoredAnswers({ ...current, ...extra });
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
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // rien à faire
  }
}
