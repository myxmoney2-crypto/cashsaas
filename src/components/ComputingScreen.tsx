"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SimulatedDashboard } from "@/components/SimulatedDashboard";
import { EXTRA_QUESTIONS, RECURRING_CHOICE, isComplete } from "@/lib/questionnaire";
import { SIMULATION_DISCLAIMER, buildSimulation } from "@/lib/simulation";
import {
  mergeStoredAnswers,
  parseStoredAnswers,
  readRawStoredAnswers,
  subscribeStoredAnswers,
} from "@/lib/stored-answers";

const TOTAL_MS = 5200;
const TICK_MS = 50;
const STEP = (100 * TICK_MS) / TOTAL_MS;
// La barre s'arrête à ces paliers tant que la question correspondante n'a pas reçu de réponse.
const CHECKPOINTS: Record<string, number> = { daily_content: 30, target_price: 68 };
const STEP_LABELS: [number, string][] = [
  [0, "Lecture de tes réponses..."],
  [35, "Croisement avec ton objectif..."],
  [70, "Préparation de ton aperçu..."],
];

export function ComputingScreen() {
  const router = useRouter();
  // undefined = pas encore hydraté ; null = rien de stocké.
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribeStoredAnswers,
    readRawStoredAnswers,
    () => undefined
  );
  const answers = useMemo(() => (raw === undefined ? null : parseStoredAnswers(raw)), [raw]);
  const valid = answers !== null && isComplete(answers);
  const invalid = raw !== undefined && !valid;

  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (invalid) router.replace("/questionnaire");
  }, [invalid, router]);

  const pending = EXTRA_QUESTIONS.filter((q) => !answers?.[q.id]);
  const blockAt = pending.length ? Math.min(...pending.map((q) => CHECKPOINTS[q.id])) : 100;
  const blockRef = useRef(blockAt);
  useEffect(() => {
    blockRef.current = blockAt;
  }, [blockAt]);

  useEffect(() => {
    if (!valid) return;
    const timer = setInterval(() => {
      setProgress((p) => Math.min(100, p + STEP, blockRef.current));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [valid]);

  useEffect(() => {
    if (progress < 100) return;
    const timer = setTimeout(() => setShowResult(true), 600);
    return () => clearTimeout(timer);
  }, [progress]);

  const openQuestion = pending.find((q) => progress >= CHECKPOINTS[q.id]);
  const simulation = useMemo(() => (answers ? buildSimulation(answers) : null), [answers]);

  if (!valid) {
    return <p className="text-muted text-sm py-24">Chargement...</p>;
  }

  if (showResult) {
    return (
      <div className="w-full max-w-[600px] mx-auto px-6 py-12 flex flex-col items-center gap-7">
        <div className="text-center">
          <div className="text-xs tracking-[2px] text-muted-2 font-semibold uppercase mb-2">
            Ton aperçu est prêt
          </div>
          <h1 className="font-display font-semibold text-[28px] text-foreground m-0">
            Voilà à quoi ressemble ton objectif
          </h1>
        </div>

        {simulation && (
          <>
            <SimulatedDashboard
              goal={simulation.goal}
              price={simulation.price}
              count={simulation.count}
              recurring={simulation.recurring}
            />
            <div className="flex flex-col gap-3 text-center max-w-[520px]">
              <p className="text-foreground text-[17px] leading-relaxed m-0">{simulation.sentence}</p>
              {simulation.chips.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {simulation.chips.map((chip) => (
                    <span
                      key={chip}
                      className="text-xs text-muted bg-surface border border-white/10 rounded-full px-3 py-1"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[13px] text-muted leading-relaxed m-0">{SIMULATION_DISCLAIMER}</p>
            </div>
          </>
        )}

        <Link
          href="/pricing"
          className="bg-accent text-white px-8 py-4 rounded-full font-semibold text-base hover:opacity-90 transition-opacity"
        >
          Débloquer mon résultat →
        </Link>
      </div>
    );
  }

  const label = [...STEP_LABELS].reverse().find(([from]) => progress >= from)![1];
  const recurring = answers?.steady_vs_big === RECURRING_CHOICE;

  return (
    <div className="w-full max-w-[520px] mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
      <div className="text-xs tracking-[2px] text-muted-2 font-semibold uppercase">
        Calcul en cours
      </div>
      <h1 className="font-display font-semibold text-[28px] text-foreground m-0">
        On prépare ton aperçu
      </h1>

      <div
        role="progressbar"
        aria-label="Calcul en cours"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-2 to-accent"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex w-full justify-between text-sm text-muted" aria-live="polite">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(progress)} %</span>
      </div>

      {openQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/65 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="extra-question"
            className="validation-in w-full max-w-[420px] bg-surface border border-white/10 rounded-3xl p-7 flex flex-col gap-5 text-left shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="text-xs tracking-[2px] text-accent font-semibold uppercase">
              Une dernière précision
            </div>
            <h2
              id="extra-question"
              className="font-display font-semibold text-[22px] text-foreground leading-snug m-0"
            >
              {openQuestion.prompt}
            </h2>
            {openQuestion.id === "target_price" && (
              <p className="text-sm text-muted-2 m-0">
                {recurring ? "Par mois, en abonnement." : "Par vente, en une fois."}
              </p>
            )}
            <div
              className={
                openQuestion.choices.length > 2 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"
              }
            >
              {openQuestion.choices.map((choice, i) => (
                <button
                  key={choice}
                  type="button"
                  autoFocus={i === 0}
                  onClick={() => mergeStoredAnswers({ [openQuestion.id]: choice })}
                  className="px-5 py-4 rounded-2xl border border-white/10 bg-background text-foreground font-semibold hover:border-accent hover:bg-accent/10 transition-colors"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
