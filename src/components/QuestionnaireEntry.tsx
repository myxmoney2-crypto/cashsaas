"use client";

import { useMemo, useSyncExternalStore } from "react";
import { QuestionnaireFlow } from "@/components/QuestionnaireFlow";
import { parseStoredAnswers, readRawStoredAnswers, subscribeStoredAnswers } from "@/lib/stored-answers";

/**
 * Point d'entrée du questionnaire. Avec `resume` (retour de l'écran de simulation), on relit les réponses
 * gardées dans le navigateur et on reprend à la première question restante.
 */
export function QuestionnaireEntry({ resume }: { resume: boolean }) {
  // undefined = pas encore hydraté ; null = rien de stocké.
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribeStoredAnswers,
    readRawStoredAnswers,
    () => undefined
  );
  const stored = useMemo(() => (raw === undefined ? null : parseStoredAnswers(raw)), [raw]);

  if (!resume) return <QuestionnaireFlow />;
  if (raw === undefined) return <p className="text-muted text-sm py-24">Chargement...</p>;
  return <QuestionnaireFlow initialAnswers={stored ?? undefined} />;
}
