"use server";

import type Stripe from "stripe";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { createPendingGeneration, runGeneration } from "@/lib/generation";
import { parseAnswers } from "@/lib/answers";
import type { Answers } from "@/lib/questionnaire";
import { getPromoState } from "@/lib/promo";
import { TIERS, type Duration, priceIdFor } from "@/lib/tiers";
import type { Tier } from "@/lib/types";

function parseDuration(value: FormDataEntryValue | null): Duration {
  const n = Number(value);
  return n === 3 || n === 12 ? n : 1;
}

type Mode = "signup" | "login";
type Service = ReturnType<typeof createServiceRoleClient>;

function fail(message: string, mode?: Mode): never {
  const params = new URLSearchParams({ error: message });
  if (mode) params.set("mode", mode);
  redirect(`/pricing?${params.toString()}`);
}

async function saveAnswers(service: Service, userId: string, answers: Answers) {
  const { error } = await service
    .from("questionnaire_responses")
    .insert({ user_id: userId, answers });
  if (error) {
    console.error("Saving questionnaire answers failed", { userId, error });
    fail("Impossible d'enregistrer tes réponses, réessaie dans un instant.");
  }
}

function stripeOrFail(): Stripe {
  try {
    return getStripe();
  } catch {
    return fail("Le paiement n'est pas encore configuré (clé Stripe manquante).");
  }
}

/**
 * Point d'entrée unique du paywall : crée le compte (ou connecte), enregistre les réponses
 * gardées dans le navigateur, puis
 *  - admin : active le palier choisi et lance la génération tout de suite, sans Stripe ;
 *  - sinon : ouvre Stripe Checkout (la génération part ensuite du webhook).
 */
export async function startCheckout(formData: FormData) {
  const tier = String(formData.get("tier") ?? "") as Tier;
  if (!Object.hasOwn(TIERS, tier)) fail("Palier inconnu.");
  const duration = parseDuration(formData.get("duration"));

  const mode: Mode = formData.get("mode") === "login" ? "login" : "signup";
  const answers = parseAnswers(formData.get("answers"));
  // Demande d'exécution immédiate + reconnaissance de la perte du droit de rétractation pour le contenu
  // numérique livré (art. L221-28, 13° du Code de la consommation) : obligatoire pour commander.
  const waived = formData.get("accept_immediate") === "on";
  const WAIVER_ERROR = "Coche la case de demande d'exécution immédiate pour pouvoir commander.";

  const supabase = await createClient();
  const service = createServiceRoleClient();

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Pas de compte sans réponses : on ne facture pas quelqu'un qui n'a rien à recevoir.
    if (!answers) redirect("/questionnaire");
    if (!waived) fail(WAIVER_ERROR, mode);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) fail("Renseigne ton email et ton mot de passe.", mode);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) fail("Email ou mot de passe incorrect.", mode);
      user = data.user;
    } else {
      if (password.length < 8) fail("Le mot de passe doit faire au moins 8 caractères.", mode);

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (/already registered/i.test(error.message)) {
          fail("Un compte existe déjà avec cet email : connecte-toi.", "login");
        }
        fail(`Impossible de créer ton compte (${error.message}).`, mode);
      }
      // Avec la confirmation d'email activée, un email déjà inscrit renvoie un utilisateur sans identité.
      if (!data.user || data.user.identities?.length === 0) {
        fail("Un compte existe déjà avec cet email : connecte-toi.", "login");
      }
      user = data.user;

      if (!data.session) {
        // « Confirm email » est activé dans Supabase : pas de session tout de suite. On garde les
        // réponses sur le compte pour qu'elles ne se perdent pas, et on renvoie vers la connexion.
        await saveAnswers(service, user.id, answers);
        redirect("/login?notice=confirm&next=/pricing");
      }
    }
  }

  const userId = user.id;

  if (answers) {
    await saveAnswers(service, userId, answers);
  } else {
    const { count } = await service
      .from("questionnaire_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (!count) redirect("/questionnaire");
  }

  const { data: profile } = await service
    .from("profiles")
    .select("stripe_customer_id, subscription_status, is_admin")
    .eq("id", userId)
    .single();

  if (profile?.is_admin) {
    await service
      .from("profiles")
      .update({ subscription_tier: tier, subscription_status: "active" })
      .eq("id", userId);

    const generationId = await createPendingGeneration(service, {
      userId,
      tier,
      checkoutSessionId: null,
    });
    if (generationId) {
      after(() => runGeneration(service, generationId, userId, tier));
    }
    redirect("/dashboard?checkout=success");
  }

  if (!waived) fail(WAIVER_ERROR);

  // Déjà abonné : pas de deuxième abonnement.
  if (profile?.subscription_status === "active") redirect("/dashboard");

  // Revérifié ici avec l'heure du SERVEUR, jamais avec ce que l'affichage du navigateur pouvait montrer :
  // si le minuteur est expiré au moment du clic, le plein tarif s'applique automatiquement, même si la
  // page affichée n'a pas encore basculé visuellement.
  const promo = await getPromoState();
  const priceId = priceIdFor(tier, duration, promo.active);
  if (!priceId) {
    fail("Ce palier n'est pas encore configuré (STRIPE_PRICE_* manquant).");
  }
  const stripe = stripeOrFail();

  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: userId },
    });
    customerId = customer.id;
    await service.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Preuve de la demande d'exécution immédiate, horodatée et conservée chez Stripe (sur la session de
  // paiement et sur l'abonnement) : c'est au professionnel de prouver l'accord préalable exprès.
  const consentProof = {
    immediate_execution_accepted_at: new Date().toISOString(),
    withdrawal_waiver_l221_28_13: "accepted",
  };

  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/pricing?checkout=canceled`,
      metadata: { user_id: userId, tier, duration: String(duration), ...consentProof },
      subscription_data: { metadata: { user_id: userId, tier, duration: String(duration), ...consentProof } },
    });
    checkoutUrl = session.url;
  } catch (err) {
    console.error("Stripe checkout session failed", { userId, err });
  }

  if (!checkoutUrl) fail("Impossible de démarrer le paiement, réessaie dans un instant.");
  redirect(checkoutUrl);
}
