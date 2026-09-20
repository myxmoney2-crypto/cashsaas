import type { SupabaseClient } from "@supabase/supabase-js";
import { generateForTier } from "./anthropic";
import type { Tier } from "./types";

const UNIQUE_VIOLATION = "23505";

/**
 * Crée la ligne « pending » de la génération initiale. Retourne null si cette session
 * Stripe a déjà été traitée (événement rejoué) : l'appelant ne doit alors rien relancer.
 * checkoutSessionId est null pour un contournement admin (pas de paiement, pas de doublon possible).
 * Toute autre erreur est relancée pour que Stripe réessaie l'événement.
 */
export async function createPendingGeneration(
  supabase: SupabaseClient,
  params: { userId: string; tier: Tier; checkoutSessionId: string | null }
): Promise<string | null> {
  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: params.userId,
      tier: params.tier,
      status: "pending",
      checkout_session_id: params.checkoutSessionId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return null;
    throw error;
  }
  return data.id;
}

// La fonction Vercel est tuée à 300 s : on abandonne avant, pour avoir le temps d'écrire « failed » en base.
const GENERATION_LIMIT_MS = 270_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Délai dépassé (${Math.round(ms / 1000)} s) : la génération a été interrompue`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Fait le vrai travail (appel IA). Ne lance jamais : la ligne finit TOUJOURS en « done » ou « failed »
 * (chaque écriture en base est vérifiée : une écriture ratée n'est plus silencieuse), et chaque étape
 * laisse une ligne « [generation] » dans les journaux Vercel.
 */
export async function runGeneration(
  supabase: SupabaseClient,
  generationId: string,
  userId: string,
  tier: Tier,
  limitMs: number = GENERATION_LIMIT_MS
): Promise<void> {
  const startedAt = Date.now();
  const seconds = () => Math.round((Date.now() - startedAt) / 1000);
  console.log("[generation] start", { generationId, tier });

  try {
    const { data: latest, error: readError } = await supabase
      .from("questionnaire_responses")
      .select("answers")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (readError) throw new Error(`Lecture du questionnaire impossible : ${readError.message}`);
    if (!latest) throw new Error("Aucun questionnaire trouvé pour cet utilisateur");

    const result = await withTimeout(generateForTier(tier, latest.answers), limitMs);

    const { error: writeError } = await supabase
      .from("generations")
      .update({
        status: "done",
        idea_name: result.idea_name,
        niche: result.niche,
        prompt_text: JSON.stringify(latest.answers),
        result,
      })
      .eq("id", generationId);
    if (writeError) throw new Error(`Enregistrement du résultat impossible : ${writeError.message}`);

    console.log("[generation] done", { generationId, seconds: seconds() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generation] failed", { generationId, seconds: seconds(), message });

    const { error } = await supabase
      .from("generations")
      .update({ status: "failed", error: message.slice(0, 300) })
      .eq("id", generationId);
    if (error) {
      console.error("[generation] impossible d'enregistrer l'échec", { generationId, message: error.message });
    }
  }
}
