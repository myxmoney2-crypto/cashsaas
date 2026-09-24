import { NextResponse, type NextRequest } from "next/server";
import { PROMO_TOKEN_COOKIE, PROMO_TOKEN_MAX_AGE } from "@/lib/promo";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Jamais une adresse externe (pas d'open redirect) : uniquement les deux pages qui suivent
// la fin réelle du questionnaire.
const ALLOWED_NEXT = new Set(["/pricing", "/calcul"]);

/**
 * Démarre le minuteur de l'offre de lancement (10 minutes, voir lib/promo.ts) et redirige vers la
 * suite du parcours. En Route Handler plutôt qu'en Server Function appelée depuis un clic : le cookie
 * est posé directement sur la réponse de redirection, le même mécanisme déjà utilisé et éprouvé ici
 * pour la connexion GitHub (voir /api/github/start), plus robuste qu'un aller-retour séparé avant la
 * navigation suivante.
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const destination = next && ALLOWED_NEXT.has(next) ? next : "/pricing";

  const token = crypto.randomUUID();
  try {
    const { error } = await createServiceRoleClient().from("promo_timers").insert({ token });
    if (error) {
      console.error("[promo] impossible de démarrer le minuteur (écriture)", error.message);
    }
  } catch (err) {
    // Une promo ratée ne doit jamais empêcher quelqu'un de continuer : on redirige quand même,
    // mais jamais en silence — sans ce log, un échec ici serait invisible.
    console.error("[promo] impossible de démarrer le minuteur (exception)", err);
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(PROMO_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PROMO_TOKEN_MAX_AGE,
  });
  return response;
}
