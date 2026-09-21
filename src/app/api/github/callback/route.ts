import { NextResponse, type NextRequest } from "next/server";
import {
  GITHUB_STATE_COOKIE,
  GITHUB_TOKEN_COOKIE,
  GITHUB_TOKEN_MAX_AGE,
  GITHUB_TOKEN_PATH,
  githubConfigured,
} from "@/lib/github";
import { createClient } from "@/lib/supabase/server";

function back(request: NextRequest, error?: string) {
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("construire", "1");
  if (error) url.searchParams.set("gh_error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete({ name: GITHUB_STATE_COOKIE, path: "/api/github" });
  return response;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/dashboard", request.url));

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return back(request, "refus"); // la personne a refusé chez GitHub
  if (!githubConfigured()) return back(request, "config");

  const state = params.get("state");
  const code = params.get("code");
  const expected = request.cookies.get(GITHUB_STATE_COOKIE)?.value;
  if (!state || !code || !expected || state !== expected) return back(request, "etat");

  let token: string | undefined;
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "cashsaas" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
      cache: "no-store",
    });
    token = ((await res.json()) as { access_token?: string }).access_token;
  } catch {
    return back(request, "echange");
  }
  if (!token) return back(request, "echange");

  const response = back(request);
  response.cookies.set(GITHUB_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: GITHUB_TOKEN_PATH,
    maxAge: GITHUB_TOKEN_MAX_AGE,
  });
  return response;
}
