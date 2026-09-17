"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { QuestionnaireAnswers } from "@/lib/types";

export async function submitQuestionnaire(answers: QuestionnaireAnswers) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/questionnaire");
  }

  const { error } = await supabase.from("questionnaire_responses").insert({
    user_id: user.id,
    answers,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/pricing");
}
