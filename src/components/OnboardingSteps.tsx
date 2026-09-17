const TEMPLATE_REPO =
  process.env.NEXT_PUBLIC_GITHUB_TEMPLATE_REPO ?? "owner/cashsaas-template";

export function OnboardingSteps({ codeRepoUrl }: { codeRepoUrl?: string | null }) {
  const generateUrl = `https://github.com/${TEMPLATE_REPO}/generate`;
  const repoForDeploy = codeRepoUrl ?? `https://github.com/${TEMPLATE_REPO}`;
  const deployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repoForDeploy)}`;

  const steps = [
    {
      title: "1. Crée ton repo GitHub",
      body: "Duplique le template sur ton propre compte GitHub — le code t'appartient, jamais sur nos comptes.",
      action: { label: "Use this template →", href: generateUrl },
    },
    {
      title: "2. Déploie sur Vercel",
      body: "Connecte ton repo à ton propre compte Vercel. Le site se déploie chez toi, gratuitement.",
      action: { label: "Deploy to Vercel →", href: deployUrl },
    },
    {
      title: "3. Connecte Supabase",
      body: "Crée un projet gratuit sur supabase.com, puis colle l'URL et les clés (Settings → API) dans les variables d'environnement de ton projet Vercel : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.",
      action: { label: "Ouvrir Supabase →", href: "https://supabase.com/dashboard" },
    },
    {
      title: "4. Connecte Stripe et un domaine",
      body: "Ajoute tes propres clés Stripe pour encaisser tes clients, puis achète un nom de domaine (OVH, Namecheap...) et branche-le sur Vercel.",
      action: { label: "Ouvrir Stripe →", href: "https://dashboard.stripe.com" },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => (
        <div
          key={step.title}
          className="bg-surface border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-2"
        >
          <div className="text-[15px] font-semibold text-foreground">{step.title}</div>
          <p className="text-sm text-muted leading-relaxed">{step.body}</p>
          <a
            href={step.action.href}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent font-semibold w-fit hover:opacity-80"
          >
            {step.action.label}
          </a>
        </div>
      ))}
    </div>
  );
}
