const TEMPLATE_REPO =
  process.env.NEXT_PUBLIC_GITHUB_TEMPLATE_REPO ?? "myxmoney2-crypto/cashsaas-template";

// Le bouton clone le template dans le GitHub du client, le déploie sur son Vercel,
// et lui demande les deux variables publiques dont le build a besoin.
const DEPLOY_URL = `https://vercel.com/new/clone?${new URLSearchParams({
  "repository-url": `https://github.com/${TEMPLATE_REPO}`,
  env: "SUPABASE_URL,SUPABASE_ANON_KEY",
  envDescription:
    "URL de ton projet Supabase et sa clé anon / publishable (Settings → API). Jamais la clé service_role.",
  envLink: "https://supabase.com/dashboard/project/_/settings/api",
  "project-name": "mon-saas",
  "repository-name": "mon-saas",
}).toString()}`;

const STEPS: { title: string; body: string; action?: { label: string; href: string } }[] = [
  {
    title: "1. Crée ton projet Supabase",
    body: "Crée un projet gratuit, puis note l'URL du projet et la clé « anon / publishable » (Settings → API). N'utilise jamais la clé service_role dans ton site. Dans le SQL Editor, exécute le fichier supabase/schema.sql de ton dépôt (tables de départ).",
    action: { label: "Ouvrir Supabase →", href: "https://supabase.com/dashboard" },
  },
  {
    title: "2. Déploie sur Vercel",
    body: "Le bouton copie le template dans ton propre compte GitHub et le déploie sur ton propre compte Vercel. Vercel te demande SUPABASE_URL et SUPABASE_ANON_KEY : colle les valeurs de l'étape 1.",
    action: { label: "Deploy to Vercel →", href: DEPLOY_URL },
  },
  {
    title: "3. Ajoute ton code",
    body: "Dans ton nouveau dépôt GitHub, ouvre index.html, remplace tout son contenu par le fichier index.html généré ci-dessus, puis « Commit changes ». Vercel redéploie tout seul. Les autres fichiers générés se créent au même chemin (Add file → Create new file) ; le SQL se colle dans Supabase.",
  },
  {
    title: "4. Connecte Stripe et un domaine",
    body: "Ajoute tes propres clés Stripe pour encaisser tes clients, puis achète un nom de domaine (OVH, Namecheap...) et branche-le dans Vercel (Settings → Domains).",
    action: { label: "Ouvrir Stripe →", href: "https://dashboard.stripe.com" },
  },
];

export function OnboardingSteps() {
  return (
    <div className="flex flex-col gap-3">
      {STEPS.map((step) => (
        <div
          key={step.title}
          className="bg-surface border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-2"
        >
          <div className="text-[15px] font-semibold text-foreground">{step.title}</div>
          <p className="text-sm text-muted leading-relaxed">{step.body}</p>
          {step.action && (
            <a
              href={step.action.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-accent font-semibold w-fit hover:opacity-80"
            >
              {step.action.label}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
