import { cookies } from "next/headers";

export const VISITOR_COOKIE = "cs_visitor_id";
// Généreux : ce n'est qu'un identifiant, le minuteur promo lui-même ne dure que 10 minutes (lib/promo.ts).
const MAX_AGE = 60 * 60 * 24 * 30;

/** Lecture seule (utilisable depuis un Server Component) : ne crée jamais le cookie. */
export async function readVisitorId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VISITOR_COOKIE)?.value ?? null;
}

/** Crée le cookie s'il n'existe pas encore. Uniquement appelable depuis une Server Action ou un Route Handler. */
export async function ensureVisitorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
