"use client";

import { useEffect, useState } from "react";

const COUNT = 4;
const FIRST_MS = 1300;
const EVERY_MS = 1300;

/**
 * Notifications de paiement de démonstration, qui apparaissent l'une après l'autre. Le montant est le prix
 * visé par la personne ; chaque carte porte la mention « Simulation » et aucun client n'est inventé.
 */
export function SimulatedNotifications({ price }: { price: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = setTimeout(() => setShown(COUNT), 0);
      return () => clearTimeout(timer);
    }
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      n += 1;
      setShown(n);
      if (n < COUNT) timer = setTimeout(next, EVERY_MS);
    };
    timer = setTimeout(next, FIRST_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="img"
      aria-label={`Simulation : exemples de notifications de paiement de ${price} euros, à titre d'illustration`}
      className="w-full max-w-[560px] flex flex-col gap-2 min-h-[284px]"
    >
      {Array.from({ length: shown }, (_, i) => (
        <div
          key={i}
          className="sim-notif bg-[#F5F4F1] rounded-2xl px-4 py-3 flex gap-3 items-center shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        >
          <div className="w-8 h-8 rounded-lg bg-[#3f5ce6] text-white font-display font-semibold text-sm flex items-center justify-center shrink-0">
            S
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[13px] font-bold text-[#1A1D26]">Stripe</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4f46e5]">
                Simulation
              </span>
            </div>
            <div className="text-[14px] text-[#33363E] leading-snug">
              Paiement reçu : <strong>{price} €</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
