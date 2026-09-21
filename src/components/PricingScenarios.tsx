import type { PricingOption } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("fr-FR");

/** Plusieurs façons d'atteindre l'objectif de revenu, selon le prix choisi. */
export function PricingScenarios({
  options,
  goal,
}: {
  options: PricingOption[];
  goal: number | null | undefined;
}) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="scenarios-prix">
      <div>
        <h2 id="scenarios-prix" className="font-display font-semibold text-xl text-foreground m-0">
          Ton objectif, plusieurs façons de l&apos;atteindre
        </h2>
        <p className="text-sm text-muted mt-2 mb-0 max-w-[640px]">
          Proposer plusieurs paliers de prix (comme Starter, Pro et Premium) te permet de toucher plusieurs
          types de clients : chacun choisit le prix qui lui convient. Il te faut alors moins de clients par
          palier pour atteindre ton objectif, et ton chiffre d&apos;affaires total peut être plus élevé
          qu&apos;avec un prix unique.
        </p>
        {goal ? (
          <p className="text-sm text-muted mt-2 mb-0">
            Pour atteindre {fmt(goal)} € par mois, le nombre de clients dépend du prix que tu choisis.
          </p>
        ) : null}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 list-none p-0 m-0">
        {options.map((option) => (
          <li
            key={`${option.price_eur}-${option.billing}`}
            className="bg-surface border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-2"
          >
            <div className="font-display text-[28px] leading-none font-semibold text-foreground">
              {fmt(option.price_eur)} €
              <span className="text-sm font-normal text-muted-2">
                {option.billing === "mensuel" ? " / mois" : " en une fois"}
              </span>
            </div>
            {option.clients ? (
              <div className="text-sm text-foreground">
                soit environ <strong>{fmt(option.clients)}</strong>{" "}
                {option.billing === "mensuel" ? "clients" : "ventes"}
              </div>
            ) : null}
            {option.rationale ? (
              <p className="text-sm text-muted leading-relaxed m-0">{option.rationale}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-2 m-0">
        Calcul : objectif ÷ prix. Ce sont des ordres de grandeur pour illustrer ton objectif, pas une
        promesse de résultat.
      </p>
    </section>
  );
}
