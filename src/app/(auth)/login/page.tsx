import Link from "next/link";
import { Header } from "@/components/Header";
import { login } from "../actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const next = typeof searchParams.next === "string" ? searchParams.next : "/questionnaire";

  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      <div className="w-full max-w-[420px] px-6 pt-10 pb-24">
        <h1 className="font-display font-semibold text-[28px] text-foreground mb-2">
          Se connecter
        </h1>
        <p className="text-muted text-sm mb-8">
          Retrouve ton idée, ton code et tes régénérations.
        </p>

        {error && (
          <div className="mb-6 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form action={login} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-2 text-sm text-muted-2">
            Email
            <input
              type="email"
              name="email"
              required
              className="bg-surface border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted-2">
            Mot de passe
            <input
              type="password"
              name="password"
              required
              className="bg-surface border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="mt-2 bg-accent text-white py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Se connecter
          </button>
        </form>

        <p className="text-sm text-muted mt-6">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-foreground underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
