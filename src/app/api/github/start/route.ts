import { NextResponse, type NextRequest } from "next/server";
import { GITHUB_STATE_COOKIE, githubConfigured } from "@/lib/github";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/dashboard", request.url));

  if (!githubConfigured()) {
    return NextResponse.redirect(new URL("/dashboard?construire=1&gh_error=config", request.url));
  }

  const state = crypto.randomUUID();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  // Dépôts publics uniquement : suffisant pour créer un dépôt public, et rien sur les dépôts privés.
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "true");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(GITHUB_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/github",
    maxAge: 10 * 60,
  });
  return response;
}
