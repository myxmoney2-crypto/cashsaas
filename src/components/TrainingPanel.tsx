import { TRAINING_MODULES, type TrainingModule } from "@/lib/training";

function ModuleMedia({ module }: { module: TrainingModule }) {
  if (module.kind === "video" && module.src) {
    return (
      <video
        controls
        preload="none"
        playsInline
        poster={module.poster}
        className="w-full rounded-xl bg-black"
        aria-label={module.title}
      >
        <source src={module.src} />
        {module.captions && (
          <track kind="captions" src={module.captions} srcLang="fr" label="Français" default />
        )}
        Ton navigateur ne peut pas lire cette vidéo.
      </video>
    );
  }
  if (module.kind === "audio" && module.src) {
    return (
      <audio controls preload="none" className="w-full" aria-label={module.title}>
        <source src={module.src} />
        Ton navigateur ne peut pas lire cet audio.
      </audio>
    );
  }
  return null;
}

/** Liste des modules de la mini-formation ; affiche un message d'attente tant qu'il n'y en a aucun. */
export function TrainingPanel({ modules = TRAINING_MODULES }: { modules?: TrainingModule[] }) {
  if (modules.length === 0) {
    return (
      <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-muted text-sm">
        La mini-formation arrive bientôt. Tu y trouveras comment publier du contenu et trouver tes premiers
        clients.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-5 list-none p-0 m-0">
      {modules.map((module, index) => (
        <li
          key={module.id}
          className="bg-surface border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4"
        >
          <div>
            <div className="text-xs text-accent font-bold uppercase tracking-wide mb-1.5">
              Module {index + 1}
              {module.duration ? ` · ${module.duration}` : ""}
            </div>
            <h2 className="font-display font-semibold text-xl text-foreground m-0">{module.title}</h2>
            {module.summary && <p className="text-sm text-muted mt-2 mb-0">{module.summary}</p>}
          </div>

          <ModuleMedia module={module} />

          {module.body && module.body.length > 0 && (
            <div className="flex flex-col gap-3 text-sm text-muted leading-relaxed">
              {module.kind === "text" ? (
                module.body.map((paragraph, i) => <p key={i} className="m-0">{paragraph}</p>)
              ) : (
                <details>
                  <summary className="cursor-pointer text-foreground">Lire la transcription</summary>
                  <div className="flex flex-col gap-3 mt-3">
                    {module.body.map((paragraph, i) => (
                      <p key={i} className="m-0">{paragraph}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
