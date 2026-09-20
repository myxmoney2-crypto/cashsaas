import type { SupabaseClient } from "@supabase/supabase-js";
import { generateForTier } from "./anthropic";
import type { Tier } from "./types";

const UNIQUE_VIOLATION = "23505";

/**
 * Crée la ligne « pending » de la génération initiale. Retourne null si cette session
 * Stripe a déjà été traitée (événement rejoué) : l'appelant ne doit alors rien relancer.
 * Toute autre erreur est relancée pour que Stripe réessaie l'événement.
 */
export async function createPendingGeneration(
  supabase: SupabaseClient,
  params: { userId: string; tier: Tier; checkoutSessionId: string }
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

/** Fait le vrai travail (appel IA) ; ne lance jamais : le résultat, ou l'échec, est écrit sur la ligne. */
export async function runGeneration(
  supabase: SupabaseClient,
  generationId: string,
  userId: string,
  tier: Tier
): Promise<void> {
  try {
    const { data: latest } = await supabase
      .from("questionnaire_responses")
      .select("answers")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) throw new Error("Aucun questionnaire trouvé pour cet utilisateur");

    const result = await generateForTier(tier, latest.answers);

    await supabase
      .from("generations")
      .update({
        status: "done",
        idea_name: result.idea_name,
        niche: result.niche,
        prompt_text: JSON.stringify(latest.answers),
        result,
      })
      .eq("id", generationId);
  } catch (err) {
    console.error("Generation failed", { generationId, userId, err });
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("generations")
      .update({ status: "failed", error: message.slice(0, 300) })
      .eq("id", generationId);
  }
}
