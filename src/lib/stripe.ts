import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Construit le client Stripe à la demande plutôt qu'au chargement du module,
 * pour que l'absence de STRIPE_SECRET_KEY (ex: build Vercel sans les env vars
 * encore configurées) ne fasse pas planter le build sur des routes qui ne
 * l'appellent pas réellement à ce moment-là.
 */
export function getStripe(): Stripe {
  if (cached) return cached;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY est manquant — configure-le dans les variables d'environnement."
    );
  }

  cached = new Stripe(apiKey, { apiVersion: "2026-08-26.dahlia" });
  return cached;
}
