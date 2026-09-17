"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { TIERS } from "@/lib/tiers";
import type { Tier } from "@/lib/types";

export async function createCheckoutSession(formData: FormData) {
  const tier = String(formData.get("tier")) as Tier;
  const config = TIERS[tier];

  if (!config?.stripePriceId) {
    redirect(
      `/pricing?error=${encodeURIComponent("Ce palier n'est pas encore configuré (STRIPE_PRICE_* manquant).")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/pricing`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: config.stripePriceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=canceled`,
    metadata: { user_id: user.id, tier },
    subscription_data: { metadata: { user_id: user.id, tier } },
  });

  if (!session.url) {
    redirect(`/pricing?error=${encodeURIComponent("Impossible de créer la session de paiement.")}`);
  }

  redirect(session.url);
}
