"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { startCheckout } from "@/app/pricing/actions";
import type { Duration } from "@/lib/tiers";
import {
  parseStoredAnswers,
  readRawStoredAnswers,
  subscribeStoredAnswers,
} from "@/lib/stored-answers";

type TierPrices = Record<
  Duration,
  { promoAmount: string; fullAmount: string; promoPerDay: string; fullPerDay: string }
>;

export type TierCard = {
  id: string;
  name: string;
  tagline: string;
  generations: string;
  /** Avantages en plus de `deliverables`, propres à ce palier (voir extraDeliverables dans lib/tiers.ts). */
  extra: string[];
  prices: TierPrices;
};

type Mode = "signup" | "login";

const inputClass =
  "bg-surface border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-accent";

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.2 3.2L13 5" />
    </svg>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function billingCadenceLabel(duration: Duration): string {
  return duration === 1 ? "Facturé tous les mois" : `Facturé tous les ${duration} mois`;
}

function TierButton({ tier, label, disabled }: { tier: string; label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="tier"
      value={tier}
      disabled={pending || disabled}
      className="mt-auto bg-accent text-white text-center py-3 rounded-full font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
    >
      {pending ? "Un instant..." : label}
    </button>
  );
}

export function PricingForm({
  tiers,
  durations,
  promoActive,
  promoRemainingMs,
  deliverables,
  email,
  isAdmin,
  hasServerAnswers,
  initialMode,
}: {
  tiers: TierCard[];
  durations: { id: Duration; label: string; days: number }[];
  /** État initial calculé côté serveur (heure serveur) ; le paiement revérifie toujours de son côté. */
  promoActive: boolean;
  promoRemainingMs: number;
  deliverables: string[];
  email: string | null;
  isAdmin: boolean;
  hasServerAnswers: boolean;
  initialMode: Mode;
}) {
  const router = useRouter();
  // undefined = pas encore hydraté (rendu serveur) ; null = hydraté mais rien de stocké.
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribeStoredAnswers,
    readRawStoredAnswers,
    () => undefined
  );
  const answers = useMemo(() => (raw === undefined ? null : parseStoredAnswers(raw)), [raw]);
  const hydrated = raw !== undefined;
  const nothingToSend = hydrated && !answers && !hasServerAnswers;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [duration, setDuration] = useState<Duration>(durations[0]?.id ?? 1);

  // Décompte purement visuel (le paiement revérifie toujours côté serveur, voir startCheckout) : part de
  // la valeur calculée par le serveur, puis avance seule, sans jamais relire l'horloge du navigateur —
  // changer l'heure de son appareil après le chargement de la page n'a donc aucun effet sur l'affichage.
  const [remainingMs, setRemainingMs] = useState(promoActive ? promoRemainingMs : 0);
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingMs((ms) => (ms <= 1000 ? 0 : ms - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const promoStillActive = remainingMs > 0;

  useEffect(() => {
    if (nothingToSend) router.replace("/questionnaire");
  }, [nothingToSend, router]);

  if (nothingToSend) {
    return <p className="text-muted text-sm">Redirection vers le questionnaire...</p>;
  }

  return (
    <form action={startCheckout} className="flex flex-col gap-8">
      <input type="hidden" name="answers" value={answers ? JSON.stringify(answers) : ""} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="duration" value={duration} />

      {isAdmin && (
        <div className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
          Mode admin : aucune facturation. Choisir un palier lance la génération tout de suite.
        </div>
      )}

      {email ? (
        <p className="text-sm text-muted">
          Connecté en tant que <span className="text-foreground">{email}</span>
        </p>
      ) : (
        <div className="flex flex-col gap-4 max-w-[420px]">
          <div className="flex gap-2" role="group" aria-label="Compte">
            {(
              [
                ["signup", "Créer mon compte"],
                ["login", "J'ai déjà un compte"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  mode === value
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-white/10 text-muted hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-2 text-sm text-muted-2">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted-2">
            Mot de passe
            <input
              type="password"
              name="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={inputClass}
            />
          </label>
        </div>
      )}

      {!isAdmin && (
        <label className="flex gap-3 items-start text-sm text-muted cursor-pointer max-w-[760px] border border-white/10 rounded-2xl p-5">
          <input
            type="checkbox"
            name="accept_immediate"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
          />
          <span>
            Je demande l’exécution immédiate du service (génération de mon résultat) avant la fin du délai de
            rétractation de 14 jours, et je reconnais que je perds mon droit de rétractation pour le contenu
            numérique dès qu’il m’a été livré. Cela ne m’empêche pas de demander un remboursement selon la{" "}
            <Link href="/remboursement" target="_blank" className="underline text-accent">
              garantie de remboursement
              <span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
            </Link>
            .
          </span>
        </label>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2" role="group" aria-label="Durée de l'abonnement">
            {durations.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={duration === d.id}
                onClick={() => setDuration(d.id)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  duration === d.id
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-white/10 text-muted hover:border-white/20"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {promoStillActive && (
            <div
              role="status"
              className="flex items-center gap-2 text-sm text-accent bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5"
            >
              <span>⚡ Tarif de lancement encore valable</span>
              <span className="font-mono font-semibold tabular-nums" aria-live="off">
                {formatCountdown(remainingMs)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => {
            const p = tier.prices[duration];
            const amount = promoStillActive ? p.promoAmount : p.fullAmount;
            const perDay = promoStillActive ? p.promoPerDay : p.fullPerDay;

            return (
              <div
                key={tier.id}
                className="bg-surface border border-white/[0.08] rounded-[20px] p-6 flex flex-col gap-5"
              >
                <div>
                  <div className="text-xs text-accent font-bold mb-1.5 uppercase tracking-wide">
                    {tier.tagline}
                  </div>
                  <div className="font-display text-xl font-semibold text-foreground">{tier.name}</div>

                  <div className="flex flex-col gap-1 mt-3">
                    {promoStillActive && (
                      <span className="text-sm text-muted-2 line-through decoration-red-400/80 decoration-2 w-fit">
                        {p.fullAmount}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-[36px] leading-none font-semibold text-foreground">
                        {amount}
                      </span>
                      <span className="text-sm text-muted-2">/ {duration} mois</span>
                    </div>
                    <div className="text-xs text-muted-2">soit {perDay} par jour</div>
                  </div>

                  <div className="text-xs text-muted mt-2">
                    {billingCadenceLabel(duration)}, résiliable à tout moment depuis ton tableau de bord
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl bg-accent/10 border border-accent/25 px-4 py-3 text-sm">
                  <div>
                    <span className="text-muted">Générations : </span>
                    <span className="text-foreground font-semibold">{tier.generations}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-2 font-semibold mb-2.5">
                      Inclus dans les 3 paliers
                    </div>
                    <ul className="flex flex-col gap-2.5 text-sm text-muted">
                      {deliverables.map((item) => (
                        <li key={item} className="flex gap-2.5">
                          <CheckIcon className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {tier.extra.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2.5">
                        En plus avec {tier.name}
                      </div>
                      <ul className="flex flex-col gap-2.5 text-sm text-foreground">
                        {tier.extra.map((item) => (
                          <li key={item} className="flex gap-2.5">
                            <CheckIcon className="w-4 h-4 mt-0.5 shrink-0 text-accent-2" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <TierButton
                  tier={tier.id}
                  disabled={!hydrated}
                  label={isAdmin ? `Générer avec ${tier.name} (test)` : `Choisir ${tier.name}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!isAdmin && (
        <p className="text-xs text-muted-2 max-w-[520px]">
          {email
            ? "Tu es redirigé vers le paiement sécurisé Stripe, puis ton résultat est généré."
            : "Ton compte est créé au clic, puis tu es redirigé vers le paiement sécurisé Stripe. Ton résultat est généré juste après."}
        </p>
      )}
    </form>
  );
}
