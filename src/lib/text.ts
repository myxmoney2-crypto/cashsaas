import type { GenerationResult } from "./types";

/** Le tiret cadratin fait « texte d'IA » : on le remplace par une virgule. */
export function stripEmDashes(text: string): string {
  return text.replace(/\s*—\s*/g, ", ");
}

/**
 * Met un texte en liste courte : un tableau reste tel quel, une chaîne (ancien format) est découpée
 * par lignes puis par phrases.
 */
export function toBullets(value: string | string[] | undefined | null): string[] {
  const items = Array.isArray(value)
    ? value
    : (value ?? "")
        .split(/\n+/)
        .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9])/));
  return items
    .map((item) => (typeof item === "string" ? item.replace(/^\s*[-•*]\s*/, "").trim() : ""))
    .filter(Boolean);
}

/** Nettoie les textes du résultat (jamais le code des fichiers) : tirets cadratins retirés, listes normalisées. */
export function cleanResultText(result: GenerationResult): GenerationResult {
  return {
    ...result,
    idea_name: stripEmDashes(result.idea_name),
    niche: stripEmDashes(result.niche),
    pitch: stripEmDashes(result.pitch),
    ...(result.underlying_need ? { underlying_need: stripEmDashes(result.underlying_need) } : {}),
    ...(result.market_signal ? { market_signal: stripEmDashes(result.market_signal) } : {}),
    tech_stack: toBullets(result.tech_stack).map(stripEmDashes),
    tools_recommendation: toBullets(result.tools_recommendation).map(stripEmDashes),
    acquisition_plan: (result.acquisition_plan ?? []).map((week) => ({
      ...week,
      title: stripEmDashes(week.title),
      description: stripEmDashes(week.description),
    })),
    pricing_options: result.pricing_options?.map((option) => ({
      ...option,
      rationale: stripEmDashes(option.rationale),
    })),
  };
}
