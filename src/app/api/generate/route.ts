import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generateForTier } from "@/lib/anthropic";
import { TIERS } from "@/lib/tiers";
import type { Tier } from "@/lib/types";

export const maxDuration = 300;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, is_admin")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier as Tier | null;
  const isAdmin = Boolean(profile?.is_admin);

  if (!tier || profile?.subscription_status !== "active") {
    return NextResponse.json({ error: "Abonnement inactif" }, { status: 403 });
  }

  const month = currentMonth();
  const { data: usage } = await supabase
    .from("regenerations_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", month)
    .maybeSingle();

  const used = usage?.count ?? 0;
  const cap = TIERS[tier].regenerationsPerMonth;

  if (!isAdmin && used >= cap) {
    return NextResponse.json(
      { error: `Plafond de régénérations atteint pour ce mois (${cap}).` },
      { status: 429 }
    );
  }

  const { data: latestResponse } = await supabase
    .from("questionnaire_responses")
    .select("answers")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  if (!latestResponse) {
    return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });
  }

  let result;
  try {
    result = await generateForTier(tier, latestResponse.answers);
  } catch (err) {
    console.error("Regeneration failed", { userId: user.id, err });
    return NextResponse.json(
      { error: "La génération a échoué, réessaie dans un instant (ça ne compte pas dans ton quota)." },
      { status: 502 }
    );
  }

  const service = createServiceRoleClient();

  await service.from("generations").insert({
    user_id: user.id,
    tier,
    status: "done",
    idea_name: result.idea_name,
    niche: result.niche,
    prompt_text: JSON.stringify(latestResponse.answers),
    result,
  });

  if (isAdmin) return NextResponse.json({ result });

  await service.from("regenerations_usage").upsert(
    { user_id: user.id, month, count: used + 1 },
    { onConflict: "user_id,month" }
  );

  return NextResponse.json({ result });
}
