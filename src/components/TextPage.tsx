import { Header } from "@/components/Header";

/** Mise en page des pages de texte simples (remboursement, mentions légales). */
export function TextPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      <article className="text-page w-full max-w-[760px] mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-[34px] leading-tight text-foreground m-0 mb-8">
          {title}
        </h1>
        {children}
      </article>
    </div>
  );
}

/** Information à remplir par toi : surlignée en jaune tant qu'elle n'est pas renseignée. */
export function Todo({ children }: { children: string }) {
  return <mark className="bg-amber-300 text-black px-1 rounded font-semibold">[À compléter : {children}]</mark>;
}
