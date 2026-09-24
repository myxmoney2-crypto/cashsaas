import { cookies } from "next/headers";
import { createServiceRoleClient } from "./supabase/server";

export const PROMO_TOKEN_COOKIE = "cs_promo_token";
// Généreux pour couvrir le trajet questionnaire -> paiement même si la personne prend une pause ;
// le minuteur promo lui-même (10 minutes) expire bien avant, et le jeton n'est jamais réutilisé
// d'une visite à l'autre (voir app/api/promo/start/route.ts), donc une durée de cookie plus longue
// ne redonnerait aucune promo supplémentaire.
export const PROMO_TOKEN_MAX_AGE = 60 * 60 * 6;

// Même fonction utilisée pour l'affichage (page /pricing) ET pour la vérification au moment du paiement
// (startCheckout) : une seule source de vérité, jamais deux logiques qui pourraient diverger.
export const PROMO_WINDOW_MS = 10 * 60 * 1000;

export type PromoState = { active: boolean; remainingMs: number };

/**
 * État du minuteur de l'offre de lancement pour le jeton du navigateur courant, calculé avec l'heure
 * du SERVEUR (jamais celle du navigateur, ni une valeur transmise par le client) : impossible à
 * contourner en changeant l'horloge de son appareil ou en rechargeant la page. Chaque passage dans le
 * questionnaire pose un jeton neuf (aucune protection par appareil) : un nouveau compte a donc toujours
 * droit à un minuteur frais, même sur un appareil qui en a déjà vu passer un.
 */
export async function getPromoState(): Promise<PromoState> {
  const store = await cookies();
  const token = store.get(PROMO_TOKEN_COOKIE)?.value;
  if (!token) return { active: false, remainingMs: 0 };

  const { data } = await createServiceRoleClient()
    .from("promo_timers")
    .select("started_at")
    .eq("token", token)
    .maybeSingle<{ started_at: string }>();
  if (!data) return { active: false, remainingMs: 0 };

  const remainingMs = new Date(data.started_at).getTime() + PROMO_WINDOW_MS - Date.now();
  return { active: remainingMs > 0, remainingMs: Math.max(0, remainingMs) };
}
