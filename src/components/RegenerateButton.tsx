"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RegenerateButton({
  remaining,
}: {
  remaining: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={isPending || remaining <= 0}
        className="bg-accent text-white px-6 py-3 rounded-full font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity w-fit"
      >
        {isPending
          ? "Génération en cours..."
          : remaining <= 0
            ? "Plafond atteint ce mois-ci"
            : `Régénérer (${remaining} restante${remaining > 1 ? "s" : ""})`}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
