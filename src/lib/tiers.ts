import type { Tier } from "./types";

export type Tuning = { thinking?: "disabled"; effort?: "low" | "medium" | "high" };

export type TierConfig = {
  id: Tier;
  name: string;
  model: string;
  /**
   * Réglage de la « réflexion » du modèle, séparé par appel (voir lib/anthropic.ts : génération en deux
   * temps, idée puis code). Elle consomme le même budget de tokens que le texte écrit : sur ces modèles
   * elle est active par défaut et peut avaler une grosse part de max_tokens.
   *  - thinking "disabled" : réflexion coupée (Sonnet 5) ;
   *  - effort : réflexion allégée, sans la couper (Opus 5 : la couper a un défaut connu, texte parasite dans la réponse) ;
   *  - rien : soit la réflexion par défaut du modèle s'applique (Sonnet 5 / Opus 5 : activée), soit le
   *    modèle n'en a pas (Haiku 4.5, qui rejette aussi le paramètre d'effort).
   * ideaTuning laisse la réflexion la plus généreuse possible (c'est elle qui invente l'idée) ;
   * codeTuning la coupe ou l'allège (le code a besoin du budget de tokens pour écrire, pas réfléchir).
   */
  ideaTuning: Tuning;
  codeTuning: Tuning;
  /** Régénérations possibles par mois, en plus de la génération faite à l'achat. */
  regenerationsPerMonth: number;
  tagline: string;
};

export const TIERS: Record<Tier, TierConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    model: "claude-haiku-4-5-20251001",
    ideaTuning: {},
    codeTuning: {},
    regenerationsPerMonth: 1,
    tagline: "Pour tester l'idée",
  },
  pro: {
    id: "pro",
    name: "Pro",
    model: "claude-sonnet-5",
    ideaTuning: {}, // réflexion active par défaut : c'est elle qui doit creuser l'idée
    codeTuning: { thinking: "disabled" },
    regenerationsPerMonth: 3,
    tagline: "Le plus populaire",
  },
  premium: {
    id: "premium",
    name: "Premium",
    model: "claude-opus-5",
    ideaTuning: { effort: "high" },
    codeTuning: { effort: "medium" },
    regenerationsPerMonth: 10,
    tagline: "Le plus complet",
  },
};

/** Ce qui est réellement livré : identique pour les 3 paliers. */
export const DELIVERABLES = [
  "Une idée de SaaS personnalisée, générée à partir de ton questionnaire",
  "Le code de ton site, réellement généré (pas juste un prompt à copier)",
  "Dépôt GitHub créé automatiquement à partir de notre template, avec ton code déjà dedans",
  "Assistant de mise en ligne guidé, étape par étape (Supabase, Vercel)",
  "Scénarios de tarification pour atteindre ton objectif de revenu",
  "Ton plan d'action des 30 premiers jours",
];

export function formatEuros(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Prix par jour en euros, ex. « 0,41 € », pour un montant total couvrant `days` jours. */
export function perDayFromTotal(totalAmount: number, days: number): string {
  const cents = Math.round((totalAmount / days) * 100);
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
}

export function regenerationsLabel(count: number): string {
  return `Génération à l'achat + ${count} régénération${count > 1 ? "s" : ""} par mois`;
}

export const TIER_ORDER: Tier[] = ["starter", "pro", "premium"];

/** Position d'un palier pour comparer « au moins tel palier » (ex. accès à la mini-formation). */
export const TIER_RANK: Record<Tier, number> = { starter: 0, pro: 1, premium: 2 };

/**
 * Avantages supplémentaires par palier, EN PLUS de DELIVERABLES : ils s'empilent (Premium affiche les
 * siens en plus de ceux de Pro) et reposent uniquement sur des différences réelles déjà dans le code
 * (modèle et réglage de réflexion par palier dans TIERS, nombre de régénérations, accès à /formation).
 * Aucune fonctionnalité pas encore construite (ex. chat support) n'y figure.
 */
export function extraDeliverables(tier: Tier): string[] {
  if (tier === "pro") {
    return [
      "Idée et code plus détaillés, analyse plus poussée de ton marché",
      `Jusqu'à ${TIERS.pro.regenerationsPerMonth} régénérations par mois pour ajuster ton résultat`,
      "Accès à la mini-formation acquisition (comptes TikTok, clippers, budget)",
    ];
  }
  if (tier === "premium") {
    return [
      "Analyse la plus poussée de ta niche, idée et code les plus aboutis",
      `Jusqu'à ${TIERS.premium.regenerationsPerMonth} régénérations par mois pour ajuster ton résultat`,
      "Accès complet à la mini-formation, y compris les prochains modules ajoutés",
    ];
  }
  return [];
}

// ---------- Tarification : 3 paliers × 3 durées × promo/plein tarif (18 prix Stripe) ----------

export type Duration = 1 | 3 | 12;

/** `days` = durée réelle approximative couverte par ce palier, pour calculer un prix par jour honnête. */
export const DURATIONS: { id: Duration; label: string; days: number }[] = [
  { id: 1, label: "1 mois", days: 30 },
  { id: 3, label: "3 mois", days: 91 },
  { id: 12, label: "12 mois", days: 365 },
];

type PriceEntry = { amount: number; priceId: string | undefined };
type DurationPrices = Record<Duration, PriceEntry>;

/**
 * L'offre de lancement (« promo ») est le tarif normal affiché sur le site tant que le minuteur de
 * 10 minutes n'est pas expiré (voir lib/promo.ts) ; passé ce délai, le plein tarif s'applique — y
 * compris si le paiement a lieu après coup (vérifié côté serveur dans pricing/actions.ts, jamais
 * seulement côté client). Les Price ID viennent des variables d'environnement, jamais codés en dur ici.
 */
export const PRICING: Record<Tier, { promo: DurationPrices; full: DurationPrices }> = {
  starter: {
    promo: {
      1: { amount: 14.9, priceId: process.env.STRIPE_PRICE_STARTER_1M_PROMO },
      3: { amount: 29.9, priceId: process.env.STRIPE_PRICE_STARTER_3M_PROMO },
      12: { amount: 89.9, priceId: process.env.STRIPE_PRICE_STARTER_12M_PROMO },
    },
    full: {
      1: { amount: 29.8, priceId: process.env.STRIPE_PRICE_STARTER_1M_FULL },
      3: { amount: 59.8, priceId: process.env.STRIPE_PRICE_STARTER_3M_FULL },
      12: { amount: 179.8, priceId: process.env.STRIPE_PRICE_STARTER_12M_FULL },
    },
  },
  pro: {
    promo: {
      1: { amount: 29.9, priceId: process.env.STRIPE_PRICE_PRO_1M_PROMO },
      3: { amount: 59.9, priceId: process.env.STRIPE_PRICE_PRO_3M_PROMO },
      12: { amount: 179.9, priceId: process.env.STRIPE_PRICE_PRO_12M_PROMO },
    },
    full: {
      1: { amount: 59.8, priceId: process.env.STRIPE_PRICE_PRO_1M_FULL },
      3: { amount: 119.8, priceId: process.env.STRIPE_PRICE_PRO_3M_FULL },
      12: { amount: 359.8, priceId: process.env.STRIPE_PRICE_PRO_12M_FULL },
    },
  },
  premium: {
    promo: {
      1: { amount: 44.9, priceId: process.env.STRIPE_PRICE_PREMIUM_1M_PROMO },
      3: { amount: 89.9, priceId: process.env.STRIPE_PRICE_PREMIUM_3M_PROMO },
      12: { amount: 269.9, priceId: process.env.STRIPE_PRICE_PREMIUM_12M_PROMO },
    },
    full: {
      1: { amount: 89.8, priceId: process.env.STRIPE_PRICE_PREMIUM_1M_FULL },
      3: { amount: 179.8, priceId: process.env.STRIPE_PRICE_PREMIUM_3M_FULL },
      12: { amount: 539.8, priceId: process.env.STRIPE_PRICE_PREMIUM_12M_FULL },
    },
  },
};

export function amountFor(tier: Tier, duration: Duration, promo: boolean): number {
  return PRICING[tier][promo ? "promo" : "full"][duration].amount;
}

export function priceIdFor(tier: Tier, duration: Duration, promo: boolean): string | undefined {
  return PRICING[tier][promo ? "promo" : "full"][duration].priceId;
}

/** Utilisé par le webhook Stripe (renouvellement, changement de palier) : la durée n'importe pas ici. */
export function tierFromPriceId(priceId: string): Tier | null {
  for (const tier of TIER_ORDER) {
    const { promo, full } = PRICING[tier];
    for (const { id: duration } of DURATIONS) {
      if (promo[duration].priceId === priceId || full[duration].priceId === priceId) return tier;
    }
  }
  return null;
}
