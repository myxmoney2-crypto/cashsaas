import { z } from "zod";
import { QUESTIONS, getVisibleQuestions, type Answers } from "./questionnaire";

const schema = z.record(z.string(), z.union([z.string().max(1000), z.number()]));
const KNOWN_IDS = new Set(QUESTIONS.map((q) => q.id));

/** Toutes les questions posées (donc non sautées) et non facultatives ont une réponse. */
export function isComplete(answers: Answers): boolean {
  return getVisibleQuestions(answers).every((q) => q.optional || answers[q.id] !== undefined);
}

/**
 * Valide les réponses reçues du navigateur (JSON) : on ne fait pas confiance au client.
 * Retourne null si le format est invalide ou si le questionnaire est incomplet ;
 * ne garde que les questions connues et réellement posées.
 */
export function parseAnswers(raw: unknown): Answers | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 30000) return null;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) return null;

  const answers: Answers = {};
  for (const [id, value] of Object.entries(parsed.data)) {
    if (!KNOWN_IDS.has(id)) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) answers[id] = trimmed;
    } else if (Number.isFinite(value)) {
      answers[id] = value;
    }
  }

  const asked = new Set(getVisibleQuestions(answers).map((q) => q.id));
  for (const id of Object.keys(answers)) {
    if (!asked.has(id)) delete answers[id];
  }

  return isComplete(answers) ? answers : null;
}
