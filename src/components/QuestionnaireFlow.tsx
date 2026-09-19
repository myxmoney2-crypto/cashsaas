"use client";

import { useState, useTransition } from "react";
import {
  BLOCKS,
  INTRO_MESSAGE,
  getValidation,
  getVisibleQuestions,
  type Question,
} from "@/lib/questionnaire";
import type { QuestionnaireAnswers } from "@/lib/types";
import { submitQuestionnaire } from "@/app/questionnaire/actions";
import { FunnelSlider } from "@/components/FunnelSlider";

const inputClass =
  "w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent";

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
          className={`${inputClass} resize-none`}
        />
      );
    case "slider":
      return (
        <FunnelSlider
          min={question.min!}
          max={question.max!}
          step={question.step!}
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
          label={question.prompt}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={question.placeholder}
          className={inputClass}
        />
      );
    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className={inputClass}
        />
      );
  }
}

function isAnswered(value: string | number | undefined) {
  if (value === undefined) return false;
  return typeof value === "string" ? value.trim() !== "" : true;
}

export function QuestionnaireFlow() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!started) {
    return (
      <div className="w-full max-w-[640px] mx-auto px-6 py-12 flex flex-col gap-8 min-h-[70vh] justify-center">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-xs tracking-[2px] text-muted-2 font-semibold uppercase">
            Avant de commencer
          </span>
        </div>
        <p className="font-display font-semibold text-2xl md:text-[28px] text-foreground leading-snug">
          {INTRO_MESSAGE}
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="bg-accent text-white px-8 py-3.5 rounded-full font-semibold text-sm w-fit hover:opacity-90 transition-opacity"
        >
          Commencer →
        </button>
      </div>
    );
  }

  const questions = getVisibleQuestions(answers);
  const question = questions[index];
  const block = BLOCKS.find((b) => b.id === question.block)!;
  const isLast = index === questions.length - 1;
  const progress = ((index + 1) / questions.length) * 100;
  const answer = answers[question.id];
  const hasAnswer = isAnswered(answer);
  const validation = hasAnswer ? getValidation(question.id, answer) : null;

  function goNext() {
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    setError(null);
    // On n'envoie que les questions réellement posées (pas une réponse périmée
    // à une question sautée après un changement de réponse).
    const asked = Object.fromEntries(
      questions.filter((q) => isAnswered(answers[q.id])).map((q) => [q.id, answers[q.id]])
    );
    startTransition(async () => {
      const result = await submitQuestionnaire(asked);
      if (result?.error) {
        setError("Une erreur est survenue, réessaie.");
      }
    });
  }

  function goBack() {
    if (index === 0) setStarted(false);
    else setIndex((i) => i - 1);
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
            {index + 1} / {questions.length}
          </span>
        </div>
      </div>

      <h2 className="font-display font-semibold text-2xl md:text-[28px] text-foreground leading-snug">
        {question.prompt}
      </h2>

      <QuestionInput
        question={question}
        value={answer}
        onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
      />

      <div className="min-h-12" aria-live="polite">
        {validation && (
          <p key={validation} className="validation-in text-sm text-[#93A5FF] leading-relaxed">
            {validation}
          </p>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-muted-2 hover:text-foreground transition-colors"
        >
          ← Retour
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!hasAnswer || isPending}
          className="bg-accent text-white px-8 py-3.5 rounded-full font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isPending ? "Envoi..." : isLast ? "Envoyer mes réponses" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
