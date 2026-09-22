import { createServiceRoleClient } from "./supabase/server";
import { readVisitorId } from "./visitor";

// Même fonction utilisée pour l'affichage (page /pricing) ET pour la vérification au moment du paiement
// (startCheckout) : une seule source de vérité, jamais deux logiques qui pourraient diverger.
export const PROMO_WINDOW_MS = 10 * 60 * 1000;

export type PromoState = { active: boolean; remainingMs: number };

/**
 * État du minuteur de l'offre de lancement pour le visiteur courant, calculé avec l'heure du SERVEUR
 * (jamais celle du navigateur, ni une valeur transmise par le client) : impossible à contourner en
 * changeant l'horloge de son appareil ou en rechargeant la page.
 */
export async function getPromoState(): Promise<PromoState> {
  const visitorId = await readVisitorId();
  if (!visitorId) return { active: false, remainingMs: 0 };

  const { data } = await createServiceRoleClient()
    .from("promo_timers")
    .select("started_at")
    .eq("visitor_id", visitorId)
    .maybeSingle<{ started_at: string }>();
  if (!data) return { active: false, remainingMs: 0 };

  const remainingMs = new Date(data.started_at).getTime() + PROMO_WINDOW_MS - Date.now();
  return { active: remainingMs > 0, remainingMs: Math.max(0, remainingMs) };
}
