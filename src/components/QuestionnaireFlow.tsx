"use client";

import { useState, useTransition } from "react";
import {
  BLOCKS,
  INTRO_MESSAGE,
  getVisibleQuestions,
  type Question,
} from "@/lib/questionnaire";
import { getValidation } from "@/lib/validations";
import type { QuestionnaireAnswers } from "@/lib/types";
import { submitQuestionnaire } from "@/app/questionnaire/actions";
import { FunnelSlider } from "@/components/FunnelSlider";

const inputClass =
  "w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent";

type Value = string | number | undefined;

function ChoiceInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: Value;
  onChange: (value: string) => void;
}) {
  const choices = question.choices!;
  const text = typeof value === "string" ? value : "";
  const selected = question.multi ? text.split(", ").filter(Boolean) : [];
  const [otherOpen, setOtherOpen] = useState(
    Boolean(question.allowOther) && text !== "" && !choices.includes(text)
  );

  function toggleMulti(choice: string) {
    let next: string[];
    if (choice === question.exclusive) {
      next = selected.includes(choice) ? [] : [choice];
    } else {
      const others = selected.filter((c) => c !== question.exclusive);
      next = others.includes(choice) ? others.filter((c) => c !== choice) : [...others, choice];
    }
    onChange(choices.filter((c) => next.includes(c)).join(", "));
  }

  function pick(choice: string) {
    if (question.multi) {
      toggleMulti(choice);
      return;
    }
    setOtherOpen(false);
    onChange(choice);
  }

  const buttonClass = (active: boolean) =>
    `text-left px-5 py-4 rounded-2xl border transition-colors ${
      active
        ? "border-accent bg-accent/10 text-foreground"
        : "border-white/10 bg-surface text-muted hover:border-white/20"
    }`;

  const many = choices.length + (question.allowOther ? 1 : 0) >= 6 && !question.multi;

  return (
    <div className="flex flex-col gap-3">
      <div className={many ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"}>
        {choices.map((choice) => {
          const active = question.multi ? selected.includes(choice) : !otherOpen && text === choice;
          return (
            <button
              key={choice}
              type="button"
              aria-pressed={active}
              onClick={() => pick(choice)}
              className={buttonClass(active)}
            >
              {choice}
            </button>
          );
        })}
        {question.allowOther && (
          <button
            type="button"
            aria-pressed={otherOpen}
            onClick={() => {
              if (!otherOpen) {
                setOtherOpen(true);
                onChange("");
              }
            }}
            className={buttonClass(otherOpen)}
          >
            Autre
          </button>
        )}
      </div>
      {otherOpen && (
        <input
          type="text"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Précise en quelques mots"
          aria-label={`${question.prompt} — précision`}
          autoFocus
          className={inputClass}
        />
      )}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: Value;
  onChange: (value: string | number) => void;
}) {
  switch (question.type) {
    case "choice":
      return <ChoiceInput question={question} value={value} onChange={onChange} />;
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
    case "textarea":
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          aria-label={question.prompt}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      );
  }
}

function isAnswered(value: Value) {
  if (value === undefined) return false;
  return typeof value === "string" ? value.trim() !== "" : true;
}

export function QuestionnaireFlow() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Graine propre à chaque passage : les phrases de validation ne sont pas les mêmes d'une session à l'autre.
  const [seed] = useState(() => Math.random().toString(36).slice(2));

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
  const answered = isAnswered(answer);
  const validation = answered ? getValidation(question, answer, answers, seed) : null;

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

      <div className="flex flex-col gap-2">
        <h2 className="font-display font-semibold text-2xl md:text-[28px] text-foreground leading-snug">
          {question.prompt}
        </h2>
        {question.multi && <p className="text-sm text-muted-2">Plusieurs choix possibles</p>}
      </div>

      <QuestionInput
        key={question.id}
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
          disabled={(!answered && !question.optional) || isPending}
          className="bg-accent text-white px-8 py-3.5 rounded-full font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isPending ? "Envoi..." : isLast ? "Envoyer mes réponses" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
