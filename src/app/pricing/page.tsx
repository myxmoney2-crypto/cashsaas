import { Header } from "@/components/Header";
import { SectionLabel } from "@/components/SectionLabel";
import { TIERS, TIER_ORDER } from "@/lib/tiers";
import { createCheckoutSession } from "./actions";

export default async function PricingPage(props: PageProps<"/pricing">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      <div className="w-full max-w-[1000px] px-6 py-14 flex flex-col gap-8">
        <div>
          <SectionLabel>Dernière étape</SectionLabel>
          <h1 className="font-display font-semibold text-[34px] text-foreground m-0">
            Choisis ton palier
          </h1>
          <p className="text-muted mt-3 max-w-[520px]">
            Ton questionnaire est enregistré. Le paiement déclenche la génération de
            ton idée, de ton code, et de ton plan des 30 premiers jours.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIER_ORDER.map((tierId) => {
            const tier = TIERS[tierId];
            return (
              <form
                action={createCheckoutSession}
                key={tier.id}
                className="bg-surface border border-white/[0.08] rounded-[20px] p-6 flex flex-col gap-4"
              >
                <input type="hidden" name="tier" value={tier.id} />
                <div>
                  <div className="text-xs text-accent font-bold mb-1.5 uppercase tracking-wide">
                    {tier.tagline}
                  </div>
                  <div className="font-display text-xl font-semibold text-foreground">
                    {tier.name}
                  </div>
                  <div className="text-2xl font-display font-semibold text-foreground mt-2">
                    {tier.priceLabel}
                  </div>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-muted">
                  {tier.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <button
                  type="submit"
                  className="mt-auto bg-accent text-white text-center py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Choisir {tier.name}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
