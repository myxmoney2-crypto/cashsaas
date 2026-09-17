"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Je peux vraiment le lancer sans savoir coder ?",
    a: "Oui. Le dossier que tu reçois explique chaque étape en langage simple, jusqu'au déploiement final sur tes propres comptes.",
  },
  {
    q: "Pourquoi 26 questions et pas 3 ?",
    a: "Parce que trois questions ne peuvent rien te dire que tu ne saches déjà. Plus on en sait sur toi, plus l'idée et le plan sont vraiment taillés pour ta situation.",
  },
  {
    q: "Le SaaS généré m'appartient vraiment ?",
    a: "Oui. Il se déploie directement sur tes propres comptes GitHub, Vercel et Supabase — jamais sur les nôtres.",
  },
  {
    q: "Pourquoi un abonnement plutôt qu'un achat unique ?",
    a: "Parce que tu gardes l'accès à tes régénérations et à l'accompagnement tant que tu restes abonné, pas juste un fichier figé à l'instant T.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col">
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="border-t border-white/[0.08]">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex justify-between items-center py-[22px] text-left cursor-pointer"
            >
              <span className="text-[17px] text-foreground">{item.q}</span>
              <span
                className="text-muted-2 text-lg inline-block transition-transform"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                ⌄
              </span>
            </button>
            {open && (
              <div className="pb-[22px] text-sm text-muted leading-relaxed max-w-[640px]">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
