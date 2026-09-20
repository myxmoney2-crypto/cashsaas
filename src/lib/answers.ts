import { z } from "zod";
import {
  EXTRA_QUESTIONS,
  QUESTIONS,
  getVisibleQuestions,
  isComplete,
  type Answers,
} from "./questionnaire";

const schema = z.record(z.string(), z.union([z.string().max(1000), z.number()]));
const EXTRAS = new Map(EXTRA_QUESTIONS.map((q) => [q.id, q]));
const KNOWN_IDS = new Set([...QUESTIONS.map((q) => q.id), ...EXTRAS.keys()]);

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
    const extra = EXTRAS.get(id);
    // Les questions du pop-up n'acceptent que leurs propres choix ; les autres doivent être « posées ».
    if (extra ? !extra.choices.includes(String(answers[id])) : !asked.has(id)) delete answers[id];
  }

  return isComplete(answers) ? answers : null;
}
