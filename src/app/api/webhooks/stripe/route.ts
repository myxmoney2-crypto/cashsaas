import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateForTier } from "@/lib/anthropic";
import { tierFromPriceId } from "@/lib/tiers";
import type { Tier } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
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

      await triggerGeneration(supabase, userId, tier);
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

async function triggerGeneration(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  tier: Tier
) {
  const { data: latestResponse } = await supabase
    .from("questionnaire_responses")
    .select("answers")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  if (!latestResponse) return;

  try {
    const result = await generateForTier(tier, latestResponse.answers);

    await supabase.from("generations").insert({
      user_id: userId,
      tier,
      idea_name: result.idea_name,
      niche: result.niche,
      prompt_text: JSON.stringify(latestResponse.answers),
      result,
    });
  } catch (err) {
    console.error("Generation failed for user", userId, err);
  }
}
