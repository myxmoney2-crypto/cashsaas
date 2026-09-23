"use server";

import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PROMO_TOKEN_COOKIE, PROMO_TOKEN_MAX_AGE } from "@/lib/promo";

/**
 * Démarre le minuteur de l'offre de lancement (10 minutes, voir lib/promo.ts), à l'instant réel où la
 * personne termine le questionnaire. Un jeton tout neuf est créé à CHAQUE passage, jamais réutilisé
 * d'une visite à l'autre même sur le même appareil : pas de protection anti-abus par appareil, un
 * nouveau compte a toujours droit à un minuteur frais (choix assumé, priorité à la conversion).
 */
export async function startPromoTimer(): Promise<void> {
  const token = crypto.randomUUID();

  const store = await cookies();
  store.set(PROMO_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PROMO_TOKEN_MAX_AGE,
  });

  const { error } = await createServiceRoleClient().from("promo_timers").insert({ token });
  if (error) {
    console.error("[promo] impossible de démarrer le minuteur", error.message);
  }
}
