"use client";

import { useMemo, useState, useTransition } from "react";
import { BLOCKS, QUESTIONS, type Question } from "@/lib/questionnaire";
import type { QuestionnaireAnswers } from "@/lib/types";
import { submitQuestionnaire } from "@/app/questionnaire/actions";

const VALIDATIONS = [
  "Noté.",
  "C'est pris en compte.",
  "Bien reçu.",
  "Ça affine ton profil.",
  "Compris.",
];

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
}) {
  switch (question.type) {
    case "choice":
      return (
        <div className="flex flex-col gap-3">
          {question.choices!.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => onChange(choice)}
              className={`text-left px-5 py-4 rounded-2xl border transition-colors ${
                value === choice
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-white/10 bg-surface text-muted hover:border-white/20"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      );
    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className="w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent resize-none"
        />
      );
    case "slider": {
      const current = typeof value === "number" ? value : (question.min ?? 0);
      return (
        <div className="flex flex-col gap-4">
          <div className="font-display text-3xl font-semibold text-foreground">
            {current.toLocaleString("fr-FR")} €
          </div>
          <input
            type="range"
            min={question.min}
            max={question.max}
            step={question.step}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>
      );
    }
    case "number":
      return (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={question.placeholder}
          className="w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent"
        />
      );
    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className="w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent"
        />
      );
  }
}

export function QuestionnaireFlow() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [validation, setValidation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const question = QUESTIONS[index];
  const block = BLOCKS.find((b) => b.id === question.block)!;
  const isLast = index === QUESTIONS.length - 1;
  const progress = useMemo(() => ((index + 1) / QUESTIONS.length) * 100, [index]);
  const hasAnswer =
    answers[question.id] !== undefined && answers[question.id] !== "";

  function setAnswer(value: string | number) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function goNext() {
    setValidation(VALIDATIONS[index % VALIDATIONS.length]);
    if (isLast) {
      setError(null);
      startTransition(async () => {
        const result = await submitQuestionnaire(answers);
        if (result?.error) {
          setError("Une erreur est survenue, réessaie.");
        }
      });
      return;
    }
    setTimeout(() => {
      setValidation(null);
      setIndex((i) => i + 1);
    }, 350);
  }

  function goBack() {
    if (index === 0) return;
    setValidation(null);
    setIndex((i) => i - 1);
  }

  return (
    <div className="w-full max-w-[640px] mx-auto px-6 py-12 flex flex-col gap-8 min-h-[80vh] justify-center">
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-2">
          <span>
            Bloc {block.id} — {block.title}
          </span>
          <span>
            {index + 1} / {QUESTIONS.length}
          </span>
        </div>
      </div>

      <h2 className="font-display font-semibold text-2xl md:text-[28px] text-foreground leading-snug">
        {question.prompt}
      </h2>

      <QuestionInput question={question} value={answers[question.id]} onChange={setAnswer} />

      {validation && (
        <p className="text-sm text-accent">{validation}</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="text-sm text-muted-2 disabled:opacity-30 hover:text-foreground transition-colors"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!hasAnswer || isPending}
          className="bg-accent text-white px-8 py-3.5 rounded-full font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isPending ? "Envoi..." : isLast ? "Terminer" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
