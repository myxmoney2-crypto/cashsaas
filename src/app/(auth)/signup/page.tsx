import Link from "next/link";
import { Header } from "@/components/Header";
import { signup } from "../actions";

export default async function SignupPage(props: PageProps<"/signup">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      <div className="w-full max-w-[420px] px-6 pt-10 pb-24">
        <h1 className="font-display font-semibold text-[28px] text-foreground mb-2">
          Créer un compte
        </h1>
        <p className="text-muted text-sm mb-8">
          26 questions, et tu repars avec une idée, du code, et un plan.
        </p>

        {error && (
          <div className="mb-6 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form action={signup} className="flex flex-col gap-4">
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
              minLength={8}
              className="bg-surface border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="mt-2 bg-accent text-white py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Créer mon compte
          </button>
        </form>

        <p className="text-sm text-muted mt-6">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-foreground underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
