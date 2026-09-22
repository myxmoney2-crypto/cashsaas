"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { ensureVisitorId } from "@/lib/visitor";

/**
 * Démarre le minuteur de l'offre de lancement (10 minutes, voir lib/promo.ts), à l'instant réel où la
 * personne termine le questionnaire. Un minuteur déjà démarré n'est jamais prolongé (23505 = ligne déjà
 * là, ignorée) : refaire le questionnaire ne redonne pas 10 minutes fraîches.
 */
export async function startPromoTimer(): Promise<void> {
  const visitorId = await ensureVisitorId();
  const { error } = await createServiceRoleClient()
    .from("promo_timers")
    .insert({ visitor_id: visitorId });
  if (error && error.code !== "23505") {
    console.error("[promo] impossible de démarrer le minuteur", error.message);
  }
}
