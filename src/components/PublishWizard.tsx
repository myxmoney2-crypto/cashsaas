"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createRepo, type CreateRepoState } from "@/app/dashboard/build-actions";

type StepId = "intro" | "github" | "supabase" | "vercel" | "stripe" | "done";

const ORDER: StepId[] = ["intro", "github", "supabase", "vercel", "stripe", "done"];
const NUMBERED: { id: StepId; label: string }[] = [
  { id: "github", label: "GitHub" },
  { id: "supabase", label: "Base de données" },
  { id: "vercel", label: "Mise en ligne" },
  { id: "stripe", label: "Paiements (optionnel)" },
];

const GITHUB_ERRORS: Record<string, string> = {
  refus: "Tu as annulé chez GitHub, ce n'est pas grave : clique à nouveau sur « Connecter GitHub » quand tu veux.",
  etat: "La connexion a été interrompue en route (ça arrive si la page reste ouverte trop longtemps). Recommence, c'est rapide.",
  echange: "GitHub n'a pas confirmé la connexion. Recommence, et si ça se reproduit, réessaie dans quelques minutes.",
  config: "La connexion GitHub automatique n'est pas encore activée sur ce site.",
};

const inputClass =
  "px-6 py-3 rounded-full font-semibold text-sm transition-opacity disabled:opacity-50";
const primary = `${inputClass} bg-accent text-white hover:opacity-90`;
const secondary = `${inputClass} border border-white/20 text-foreground hover:bg-white/5`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // presse-papiers indisponible : la personne peut sélectionner le texte à la main
        }
      }}
      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 text-foreground hover:bg-white/5"
    >
      <span aria-live="polite">{copied ? "Copié ✓" : label}</span>
    </button>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] text-muted leading-relaxed bg-background border border-white/10 rounded-xl px-4 py-3">
      {children}
    </div>
  );
}

function Numbered({ children }: { children: React.ReactNode }) {
  return <ol className="flex flex-col gap-3 text-sm text-muted leading-relaxed pl-5 m-0">{children}</ol>;
}

export function PublishWizard({
  ideaName,
  repoUrl: savedRepoUrl,
  githubConnected,
  githubError,
  githubEnabled,
  schemaSql,
  initialOpen,
}: {
  ideaName: string;
  repoUrl: string | null;
  githubConnected: boolean;
  githubError: string | null;
  githubEnabled: boolean;
  schemaSql: string | null;
  initialOpen: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [step, setStep] = useState<StepId>(initialOpen ? "github" : savedRepoUrl ? "supabase" : "intro");
  const [created, action, pending] = useActionState<CreateRepoState | null, FormData>(() => createRepo(), null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const repoUrl = created?.ok ? created.repoUrl : savedRepoUrl;
  const repoName = repoUrl ? repoUrl.split("/").pop()! : "";
  const error = created && !created.ok ? created.error : null;

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus();
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const go = (id: StepId) => setStep(id);
  const back = () => {
    const i = ORDER.indexOf(step);
    if (i > 0) setStep(ORDER[i - 1]);
  };
  const numberedIndex = NUMBERED.findIndex((s) => s.id === step);

  return (
    <>
      <div className="bg-surface border border-accent/30 rounded-3xl p-8 flex flex-col gap-4 items-start">
        <div className="text-xs tracking-[2px] text-accent font-semibold uppercase">Mise en ligne</div>
        <h2 className="font-display font-semibold text-2xl text-foreground m-0">
          Prêt à lancer {ideaName} ?
        </h2>
        <p className="text-sm text-muted leading-relaxed m-0 max-w-[560px]">
          On te guide pas à pas, une étape à la fois, sans écrire une ligne de code. Compte environ 20 minutes,
          et tu peux t&apos;arrêter et reprendre quand tu veux.
        </p>
        <button
          type="button"
          onClick={() => {
            setStep(repoUrl ? "supabase" : "intro");
            setOpen(true);
          }}
          className="bg-accent text-white px-8 py-4 rounded-full font-semibold text-base hover:opacity-90 transition-opacity"
        >
          Mettre {ideaName} en ligne →
        </button>
        {repoUrl && (
          <p className="text-xs text-muted-2 m-0">
            Ton dépôt GitHub existe déjà :{" "}
            <a href={repoUrl} target="_blank" rel="noreferrer" className="underline text-accent">
              {repoName}
            </a>
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="wizard-title"
              className="validation-in w-full max-w-[600px] bg-surface border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
            >
              {numberedIndex >= 0 && (
                <div className="flex flex-col gap-2">
                  <div
                    role="progressbar"
                    aria-label="Avancement de la mise en ligne"
                    aria-valuemin={1}
                    aria-valuemax={NUMBERED.length}
                    aria-valuenow={numberedIndex + 1}
                    className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${((numberedIndex + 1) / NUMBERED.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-2">
                    <span>{NUMBERED[numberedIndex].label}</span>
                    <span>
                      Étape {numberedIndex + 1} / {NUMBERED.length}
                    </span>
                  </div>
                </div>
              )}

              {step === "intro" && (
                <>
                  <h2
                    id="wizard-title"
                    ref={titleRef}
                    tabIndex={-1}
                    className="font-display font-semibold text-2xl text-foreground leading-snug m-0 outline-none"
                  >
                    On met {ideaName} en ligne, ensemble
                  </h2>
                  <p className="text-sm text-muted leading-relaxed m-0">
                    Aucune connaissance technique n&apos;est nécessaire. Tu avances à ton rythme, une étape à la
                    fois, et tu peux fermer cette fenêtre puis reprendre plus tard.
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-foreground list-none p-0 m-0">
                    <li>1. GitHub : ton code est rangé dans un dépôt à ton nom (automatique)</li>
                    <li>2. Supabase : ta base de données (5 minutes)</li>
                    <li>3. Vercel : ton site devient accessible à tout le monde (5 minutes)</li>
                    <li>4. Stripe : encaisser tes clients (optionnel, à faire plus tard)</li>
                  </ul>
                  <Tip>
                    Trois comptes gratuits te serviront : GitHub, Supabase et Vercel. Pas encore de compte ? Tu le
                    crées au moment voulu, ça prend deux minutes. Et si un message rouge apparaît un jour,
                    pas de panique : c&apos;est normal, il dit presque toujours exactement quoi corriger. Garde-le tel
                    quel (ou une capture d&apos;écran), c&apos;est ce qui permet de trouver la solution le plus vite.
                  </Tip>
                  <div className="flex justify-end">
                    <button type="button" className={primary} onClick={() => go("github")}>
                      C&apos;est parti →
                    </button>
                  </div>
                </>
              )}

              {step === "github" && (
                <>
                  <h2
                    id="wizard-title"
                    ref={titleRef}
                    tabIndex={-1}
                    className="font-display font-semibold text-2xl text-foreground leading-snug m-0 outline-none"
                  >
                    Ton code sur GitHub
                  </h2>
                  <p className="text-sm text-muted leading-relaxed m-0">
                    GitHub, c&apos;est le coffre où ton code est rangé. On va y créer un dépôt à ton nom, avec ton
                    site déjà dedans. Tu n&apos;as rien à copier-coller.
                  </p>

                  {githubError && (
                    <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
                      {GITHUB_ERRORS[githubError] ?? GITHUB_ERRORS.echange}
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  {repoUrl ? (
                    <div className="text-sm text-foreground bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
                      Ton dépôt est créé ✓{" "}
                      <a href={repoUrl} target="_blank" rel="noreferrer" className="underline text-accent">
                        {repoName}
                        <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                      </a>
                    </div>
                  ) : githubConnected ? (
                    <div className="flex flex-col gap-3">
                      <div className="text-sm text-foreground">GitHub est connecté ✓</div>
                      <form action={action}>
                        <button type="submit" disabled={pending} className={primary}>
                          {pending ? "Création du dépôt, quelques secondes..." : "Créer mon dépôt"}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 items-start">
                      {githubEnabled ? (
                        <a href="/api/github/start" className={primary}>
                          Connecter GitHub
                        </a>
                      ) : (
                        <p className="text-sm text-muted m-0">{GITHUB_ERRORS.config}</p>
                      )}
                      <p className="text-xs text-muted-2 m-0">
                        GitHub s&apos;ouvre, tu cliques sur « Authorize », puis tu reviens automatiquement ici.
                      </p>
                    </div>
                  )}

                  <Tip>
                    <strong className="text-foreground">Ce qu&apos;on te demande, et ce qu&apos;on ne fait pas.</strong>{" "}
                    On demande uniquement l&apos;accès aux dépôts publics : on ne voit pas tes autres projets. Cet accès
                    ne sert qu&apos;une fois, pour créer ce dépôt, puis il est supprimé. Le dépôt est public : c&apos;est
                    voulu et sans risque, il ne contient aucune clé secrète (les clés se mettent chez Vercel,
                    jamais dans le code).
                  </Tip>

                  <div className="flex justify-between items-center">
                    <button type="button" onClick={back} className="text-sm text-muted-2 hover:text-foreground">
                      ← Retour
                    </button>
                    <button type="button" className={primary} disabled={!repoUrl} onClick={() => go("supabase")}>
                      Continuer →
                    </button>
                  </div>
                </>
              )}

              {step === "supabase" && (
                <>
                  <h2
                    id="wizard-title"
                    ref={titleRef}
                    tabIndex={-1}
                    className="font-display font-semibold text-2xl text-foreground leading-snug m-0 outline-none"
                  >
                    Ta base de données (Supabase)
                  </h2>
                  <p className="text-sm text-muted leading-relaxed m-0">
                    C&apos;est là que ton site range ses informations (comptes, demandes, etc.). Trois choses à
                    faire, dans l&apos;ordre :
                  </p>
                  <Numbered>
                    <li>
                      Va sur{" "}
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-accent"
                      >
                        supabase.com/dashboard
                        <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                      </a>
                      , clique sur « New project », donne-lui le nom que tu veux, choisis un mot de passe (note-le
                      quelque part) et une région en Europe. Patiente une à deux minutes.
                    </li>
                    <li>
                      {schemaSql ? (
                        <>
                          Ouvre « SQL Editor », colle le texte que tu copies avec ce bouton, puis clique sur « Run » :
                          <span className="block mt-2">
                            <CopyButton text={schemaSql} label="Copier le SQL" />
                          </span>
                        </>
                      ) : (
                        <>Ton projet n&apos;a besoin d&apos;aucune table pour démarrer : tu peux passer cette partie.</>
                      )}
                    </li>
                    <li>
                      Ouvre « Project Settings », puis « API ». Note deux choses : l&apos;URL du projet, et la clé
                      « anon » (ou « publishable »). Garde-les sous la main pour l&apos;étape suivante.
                    </li>
                  </Numbered>
                  <Tip>
                    <strong className="text-foreground">Deux pièges classiques.</strong> 1) Ne prends jamais la clé
                    « service_role » (ou « secret ») : elle donne tous les pouvoirs sur ta base. Si tu la colles par
                    erreur, la mise en ligne s&apos;arrête exprès pour te protéger, ce n&apos;est pas un bug. 2) Si tu vois
                    « Could not find the … column … in the schema cache », Supabase n&apos;a juste pas rafraîchi sa
                    mémoire : lance{" "}
                    <code className="text-foreground">notify pgrst, &apos;reload schema&apos;;</code> dans le SQL Editor,
                    et vérifie que tu es bien dans le même projet que celui dont tu copies les clés.
                  </Tip>
                  <div className="flex justify-between items-center">
                    <button type="button" onClick={back} className="text-sm text-muted-2 hover:text-foreground">
                      ← Retour
                    </button>
                    <button type="button" className={primary} onClick={() => go("vercel")}>
                      C&apos;est fait, continuer →
                    </button>
                  </div>
                </>
              )}

              {step === "vercel" && (
                <>
                  <h2
                    id="wizard-title"
                    ref={titleRef}
                    tabIndex={-1}
                    className="font-display font-semibold text-2xl text-foreground leading-snug m-0 outline-none"
                  >
                    Mise en ligne (Vercel)
                  </h2>
                  <p className="text-sm text-muted leading-relaxed m-0">
                    Vercel transforme ton dépôt en vrai site accessible à tout le monde.
                  </p>
                  <Numbered>
                    <li>
                      <a
                        href="https://vercel.com/new"
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-accent"
                      >
                        Ouvre vercel.com/new
                        <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                      </a>{" "}
                      et connecte-toi avec GitHub (« Continue with GitHub »).
                    </li>
                    <li>
                      Dans « Import Git Repository », choisis <strong className="text-foreground">{repoName || "ton dépôt"}</strong>. Tu
                      ne le vois pas ? Clique sur « Adjust GitHub App Permissions » et autorise-le.
                    </li>
                    <li>
                      Ouvre « Environment Variables » et ajoute ces deux variables, avec exactement ces noms
                      (majuscules, sans espace) :
                      <span className="flex flex-col gap-2 mt-2">
                        <span className="flex items-center gap-3">
                          <code className="text-foreground">SUPABASE_URL</code>
                          <CopyButton text="SUPABASE_URL" label="Copier le nom" />
                          <span className="text-xs text-muted-2">valeur : l&apos;URL du projet</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <code className="text-foreground">SUPABASE_ANON_KEY</code>
                          <CopyButton text="SUPABASE_ANON_KEY" label="Copier le nom" />
                          <span className="text-xs text-muted-2">valeur : la clé anon / publishable</span>
                        </span>
                      </span>
                    </li>
                    <li>
                      Clique sur « Deploy » et patiente une à deux minutes. Quand tu vois « Congratulations »,
                      clique sur l&apos;aperçu du site : c&apos;est ton SaaS, en ligne.
                    </li>
                  </Numbered>
                  <Tip>
                    <strong className="text-foreground">Si ça affiche une erreur rouge.</strong> Ouvre le message : il
                    nomme presque toujours la variable manquante ou mal collée. Corrige-la dans « Settings »,
                    « Environment Variables », puis clique sur « Redeploy ». Bon à savoir : le plan gratuit de Vercel
                    est prévu pour un usage personnel non commercial, il faudra passer à un plan payant quand tu
                    commenceras à encaisser.
                  </Tip>
                  <div className="flex justify-between items-center">
                    <button type="button" onClick={back} className="text-sm text-muted-2 hover:text-foreground">
                      ← Retour
                    </button>
                    <button type="button" className={primary} onClick={() => go("stripe")}>
                      Mon site est en ligne →
                    </button>
                  </div>
                </>
              )}

              {step === "stripe" && (
                <>
                  <div className="w-fit text-xs font-semibold text-accent bg-accent/10 border border-accent/30 rounded-full px-3 py-1">
                    Optionnel · à faire plus tard
                  </div>
                  <h2
                    id="wizard-title"
                    ref={titleRef}
                    tabIndex={-1}
                    className="font-display font-semibold text-2xl text-foreground leading-snug m-0 outline-none"
                  >
                    Encaisser tes clients (Stripe)
                  </h2>
                  <p className="text-sm text-muted leading-relaxed m-0">
                    Tu n&apos;as pas besoin de Stripe pour publier : ton site est déjà en ligne. Stripe sert
                    seulement à encaisser. Tu peux terminer maintenant et y revenir quand ton site aura ses premiers
                    visiteurs.
                  </p>
                  <Tip>
                    Le plus simple le jour venu : créer un « Payment Link » dans Stripe (un lien de paiement, sans
                    code) et le coller sur ton site. Commence en mode test : aucun vrai argent ne bouge. Et les clés
                    secrètes de Stripe ne vont jamais dans le code du site ni dans un dépôt public.
                  </Tip>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-accent font-semibold w-fit hover:opacity-80"
                  >
                    Ouvrir Stripe (dans un nouvel onglet) →
                  </a>
                  <div className="flex justify-between items-center">
                    <button type="button" onClick={back} className="text-sm text-muted-2 hover:text-foreground">
                      ← Retour
                    </button>
                    <button type="button" className={primary} onClick={() => go("done")}>
                      Passer, je le ferai plus tard →
                    </button>
                  </div>
                </>
              )}

              {step === "done" && (
                <>
                  <h2
                    id="wizard-title"
                    ref={titleRef}
                    tabIndex={-1}
                    className="font-display font-semibold text-2xl text-foreground leading-snug m-0 outline-none"
                  >
                    {ideaName} est en ligne
                  </h2>
                  <p className="text-sm text-muted leading-relaxed m-0">
                    Bravo, le plus dur est fait. Prochaine étape : le faire connaître et trouver tes premiers
                    clients. On a préparé une mini-formation pour ça.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/formation" className={primary}>
                      Voir la mini-formation →
                    </Link>
                    <button type="button" className={secondary} onClick={() => setOpen(false)}>
                      Fermer
                    </button>
                  </div>
                </>
              )}

              {step !== "done" && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs text-muted-2 hover:text-foreground w-fit self-center"
                >
                  Fermer et reprendre plus tard
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
