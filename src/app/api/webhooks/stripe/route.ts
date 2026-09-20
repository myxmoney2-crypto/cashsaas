import type Stripe from "stripe";
import { after, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createPendingGeneration, runGeneration } from "@/lib/generation";
import { tierFromPriceId } from "@/lib/tiers";
import type { Tier } from "@/lib/types";

// La génération tourne dans after() : elle dispose de toute cette durée sans bloquer la réponse à Stripe.
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier as Tier | undefined;
      if (!userId || !tier) break;

      await supabase
        .from("profiles")
        .update({ subscription_tier: tier, subscription_status: "active" })
        .eq("id", userId);

      // Ligne « pending » créée avant de répondre : c'est elle qui protège des doublons
      // (Stripe peut renvoyer le même événement) ; l'appel IA part ensuite en arrière-plan.
      const generationId = await createPendingGeneration(supabase, {
        userId,
        tier,
        checkoutSessionId: session.id,
      });
      if (generationId) {
        after(() => runGeneration(supabase, generationId, userId, tier));
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price.id;
      const tier = priceId ? tierFromPriceId(priceId) : null;
      const status = subscription.status === "active" ? "active" : "past_due";

      await supabase
        .from("profiles")
        .update({
          subscription_status: status,
          ...(tier ? { subscription_tier: tier } : {}),
        })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      await supabase
        .from("profiles")
        .update({ subscription_status: "canceled" })
        .eq("id", userId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
