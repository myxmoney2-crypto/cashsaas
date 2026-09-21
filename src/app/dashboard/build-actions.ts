"use server";

import { cookies } from "next/headers";
import {
  GITHUB_TOKEN_COOKIE,
  GITHUB_TOKEN_PATH,
  GithubError,
  createRepoFromTemplate,
  pushFiles,
  selectFiles,
  slugify,
} from "@/lib/github";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { GenerationResult } from "@/lib/types";

export type CreateRepoState =
  | { ok: true; repoUrl: string; repoName: string }
  | { ok: false; error?: string };

/** Crée le dépôt GitHub public de la personne avec le code de sa dernière génération. */
export async function createRepo(): Promise<CreateRepoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Ta session a expiré : reconnecte-toi." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();
  if (profile?.subscription_status !== "active") {
    return { ok: false, error: "Ton abonnement n'est pas actif." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(GITHUB_TOKEN_COOKIE)?.value;
  if (!token) return { ok: false, error: "GitHub n'est pas connecté : clique sur « Connecter GitHub »." };

  // Le code vient toujours de notre base, jamais du navigateur.
  const { data: generation } = await supabase
    .from("generations")
    .select("id, result, code_repo_url")
    .eq("user_id", user.id)
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; result: GenerationResult; code_repo_url: string | null }>();
  if (!generation?.result) return { ok: false, error: "Aucun résultat à publier pour le moment." };

  if (generation.code_repo_url) {
    return { ok: true, repoUrl: generation.code_repo_url, repoName: generation.code_repo_url.split("/").pop()! };
  }

  const files = selectFiles(generation.result.code_files ?? []);
  if (!files.some((file) => file.path === "index.html")) {
    return { ok: false, error: "Le résultat ne contient pas de fichier index.html : relance une génération." };
  }

  try {
    const repo = await createRepoFromTemplate(
      token,
      slugify(generation.result.idea_name),
      generation.result.pitch ?? ""
    );
    await pushFiles(token, repo.owner, repo.name, files);

    const { error } = await createServiceRoleClient()
      .from("generations")
      .update({ code_repo_url: repo.url })
      .eq("id", generation.id)
      .eq("user_id", user.id);
    if (error) console.error("[github] enregistrement de l'adresse du dépôt impossible", error.message);

    // Le jeton a servi : on le supprime tout de suite.
    cookieStore.delete({ name: GITHUB_TOKEN_COOKIE, path: GITHUB_TOKEN_PATH });
    return { ok: true, repoUrl: repo.url, repoName: repo.name };
  } catch (err) {
    console.error("[github] création du dépôt échouée", err instanceof Error ? err.message : err);
    if (err instanceof GithubError && err.status === 401) {
      cookieStore.delete({ name: GITHUB_TOKEN_COOKIE, path: GITHUB_TOKEN_PATH });
    }
    return {
      ok: false,
      error:
        err instanceof GithubError
          ? `${err.message} Réessaie, ou reconnecte GitHub.`
          : "La création du dépôt a échoué. Réessaie dans un instant.",
    };
  }
}
