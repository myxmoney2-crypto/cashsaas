"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

function fail(message: string): never {
  redirect(`/dashboard?${new URLSearchParams({ billing_error: message }).toString()}`);
}

/**
 * Ouvre le portail client Stripe : l'abonné y résilie en ligne (effet à la fin de la période payée),
 * change de carte et télécharge ses factures.
 */
export async function openBillingPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    fail("Aucun abonnement payant n'est rattaché à ton compte.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let portalUrl: string | null = null;
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/dashboard`,
    });
    portalUrl = session.url;
  } catch (err) {
    console.error("Stripe billing portal failed", { userId: user.id, err });
  }

  if (!portalUrl) {
    fail("Le portail de gestion n'est pas disponible pour le moment, réessaie dans un instant.");
  }
  redirect(portalUrl);
}
