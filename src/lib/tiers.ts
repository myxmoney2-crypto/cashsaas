import type { Tier } from "./types";

export type TierConfig = {
  id: Tier;
  name: string;
  /** Prix mensuel réel, en euros (doit correspondre au prix Stripe). */
  price: number;
  stripePriceId: string | undefined;
  model: string;
  /** Régénérations possibles par mois, en plus de la génération faite à l'achat. */
  regenerationsPerMonth: number;
  tagline: string;
};

export const TIERS: Record<Tier, TierConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 14.9,
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
    model: "claude-haiku-4-5-20251001",
    regenerationsPerMonth: 1,
    tagline: "Pour tester l'idée",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 29.9,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    model: "claude-sonnet-5",
    regenerationsPerMonth: 3,
    tagline: "Le plus populaire",
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 59.9,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM,
    model: "claude-opus-5",
    regenerationsPerMonth: 10,
    tagline: "Le plus complet",
  },
};

/** Ce qui est réellement livré : identique pour les 3 paliers. */
export const DELIVERABLES = [
  "Une idée de SaaS personnalisée, générée à partir de ton questionnaire",
  "Le code de ton site, réellement généré (pas juste un prompt à copier)",
  "Connexion à ton GitHub : ton propre dépôt créé à partir de notre template",
  "Bouton « Deploy to Vercel » : mise en ligne sur ton compte en un clic",
  "Guide pas à pas : ajout de ton code, Stripe et nom de domaine",
  "Ton plan d'action des 30 premiers jours",
];

export function formatEuros(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Équivalent quotidien réel du prix mensuel : prix × 12 mois ÷ 365 jours, arrondi au centime. */
export function perDayLabel(monthlyPrice: number): string {
  const cents = Math.round(((monthlyPrice * 12) / 365) * 100);
  return cents < 100
    ? `${cents} centimes par jour`
    : `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € par jour`;
}

export function regenerationsLabel(count: number): string {
  return `Génération à l'achat + ${count} régénération${count > 1 ? "s" : ""} par mois`;
}

export const TIER_ORDER: Tier[] = ["starter", "pro", "premium"];

export function tierFromPriceId(priceId: string): Tier | null {
  for (const tier of TIER_ORDER) {
    if (TIERS[tier].stripePriceId === priceId) return tier;
  }
  return null;
}
