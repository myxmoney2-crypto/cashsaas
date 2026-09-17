import type { Tier } from "./types";

export type TierConfig = {
  id: Tier;
  name: string;
  price: number;
  priceLabel: string;
  stripePriceId: string | undefined;
  model: string;
  regenerationsPerMonth: number;
  tagline: string;
  features: string[];
};

export const TIERS: Record<Tier, TierConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 14.9,
    priceLabel: "14,90 €/mois",
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
    model: "claude-haiku-4-5-20251001",
    regenerationsPerMonth: 1,
    tagline: "Pour tester l'idée",
    features: [
      "1 génération / mois",
      "Idée + code + plan 30 jours",
      "Déploiement sur tes propres comptes",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 29.9,
    priceLabel: "29,90 €/mois",
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    model: "claude-sonnet-5",
    regenerationsPerMonth: 3,
    tagline: "Le plus populaire",
    features: [
      "3 générations / mois",
      "Modèle plus puissant (Sonnet)",
      "Idée + code + plan 30 jours",
      "Déploiement sur tes propres comptes",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 59.9,
    priceLabel: "59,90 €/mois",
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM,
    model: "claude-opus-5",
    regenerationsPerMonth: 10,
    tagline: "Régénérations illimitées*",
    features: [
      "Régénérations \"illimitées\" (10/mois)",
      "Modèle le plus puissant (Opus)",
      "Idée + code + plan 30 jours",
      "Déploiement sur tes propres comptes",
    ],
  },
};

export const TIER_ORDER: Tier[] = ["starter", "pro", "premium"];

export function tierFromPriceId(priceId: string): Tier | null {
  for (const tier of TIER_ORDER) {
    if (TIERS[tier].stripePriceId === priceId) return tier;
  }
  return null;
}
