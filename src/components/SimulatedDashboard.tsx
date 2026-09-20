"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/simulation";

const COUNT_UP_MS = 1400;

// Courbe d'illustration : ni tirée de vraies données, ni aléatoire. Elle monte de 0 à l'objectif.
const POINTS = Array.from({ length: 31 }, (_, i) => {
  const t = i / 30;
  return { x: 8 + t * 384, y: 128 - Math.pow(t, 1.7) * 112 };
});
const LINE = POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
const AREA = `${LINE} L392 128 L8 128 Z`;

export function SimulatedDashboard({
  goal,
  price,
  count,
  recurring,
}: {
  goal: number;
  price: number | null;
  count: number | null;
  recurring: boolean;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / COUNT_UP_MS);
      setShown(Math.round(goal * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [goal]);

  return (
    <div
      className="w-full max-w-[560px] rounded-2xl bg-white text-[#0a2540] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden"
      role="img"
      aria-label={`Simulation : volume de ${formatNumber(goal)} euros ce mois-ci, si ton objectif était atteint`}
    >
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="text-[13px] font-semibold text-[#425466]">Volume brut</div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#635bff] bg-[#635bff]/10 rounded-full px-2.5 py-1">
          Simulation
        </span>
      </div>

      <div className="flex gap-1 px-6 pt-3 text-[13px]">
        <span className="px-2.5 py-1 rounded-md text-[#697386]">Aujourd&apos;hui</span>
        <span className="px-2.5 py-1 rounded-md bg-[#f6f9fc] text-[#0a2540] font-semibold border border-[#e3e8ee]">
          Ce mois-ci
        </span>
      </div>

      <div className="px-6 pt-4">
        <div className="text-[13px] text-[#697386]">Volume ce mois-ci</div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="text-[44px] sm:text-[52px] leading-tight font-semibold tracking-tight tabular-nums">
            {formatNumber(shown)} €
          </div>
          <span className="text-[12px] font-semibold text-[#0e6245] bg-[#cbf4c9] rounded-md px-2 py-0.5">
            Objectif atteint
          </span>
        </div>
      </div>

      <div className="px-6 pt-2">
        <svg viewBox="0 0 400 150" className="w-full h-auto block" aria-hidden="true">
          <defs>
            <linearGradient id="sim-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#635bff" stopOpacity="0.28" />
              <stop offset="1" stopColor="#635bff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[16, 60, 104].map((y) => (
            <line key={y} x1="8" x2="392" y1={y} y2={y} stroke="#e3e8ee" strokeWidth="1" />
          ))}
          <line x1="8" x2="392" y1="128" y2="128" stroke="#cfd7df" strokeWidth="1" />
          <path d={AREA} fill="url(#sim-area)" />
          <path
            d={LINE}
            className="chart-line"
            pathLength={1}
            fill="none"
            stroke="#635bff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="8" y="12" fontSize="9" fill="#697386">
            {formatNumber(goal)} €
          </text>
          <text x="8" y="144" fontSize="9" fill="#697386">
            Début du mois
          </text>
          <text x="392" y="144" fontSize="9" fill="#697386" textAnchor="end">
            Fin du mois
          </text>
        </svg>
      </div>

      {price && count ? (
        <div className="grid grid-cols-2 border-t border-[#e3e8ee] mt-2">
          <div className="px-6 py-4 border-r border-[#e3e8ee]">
            <div className="text-[12px] text-[#697386]">
              {recurring ? "Prix visé, par mois" : "Prix visé, par vente"}
            </div>
            <div className="text-[20px] font-semibold tabular-nums">{price} €</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-[12px] text-[#697386]">
              {recurring ? "Clients nécessaires" : "Ventes nécessaires"}
            </div>
            <div className="text-[20px] font-semibold tabular-nums">≈ {formatNumber(count)}</div>
          </div>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
}
