"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { startCheckout } from "@/app/pricing/actions";
import { parseStoredAnswers, readRawStoredAnswers } from "@/lib/stored-answers";

export type TierCard = {
  id: string;
  name: string;
  priceLabel: string;
  tagline: string;
  features: string[];
};

type Mode = "signup" | "login";

const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const inputClass =
  "bg-surface border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-accent";

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
  email,
  isAdmin,
  hasServerAnswers,
  initialMode,
}: {
  tiers: TierCard[];
  email: string | null;
  isAdmin: boolean;
  hasServerAnswers: boolean;
  initialMode: Mode;
}) {
  const router = useRouter();
  // undefined = pas encore hydraté (rendu serveur) ; null = hydraté mais rien de stocké.
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    readRawStoredAnswers,
    () => undefined
  );
  const answers = useMemo(() => (raw === undefined ? null : parseStoredAnswers(raw)), [raw]);
  const hydrated = raw !== undefined;
  const nothingToSend = hydrated && !answers && !hasServerAnswers;
  const [mode, setMode] = useState<Mode>(initialMode);

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="bg-surface border border-white/[0.08] rounded-[20px] p-6 flex flex-col gap-4"
          >
            <div>
              <div className="text-xs text-accent font-bold mb-1.5 uppercase tracking-wide">
                {tier.tagline}
              </div>
              <div className="font-display text-xl font-semibold text-foreground">{tier.name}</div>
              <div className="text-2xl font-display font-semibold text-foreground mt-2">
                {tier.priceLabel}
              </div>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              {tier.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <TierButton
              tier={tier.id}
              disabled={!hydrated}
              label={isAdmin ? `Générer avec ${tier.name} (test)` : `Choisir ${tier.name}`}
            />
          </div>
        ))}
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
