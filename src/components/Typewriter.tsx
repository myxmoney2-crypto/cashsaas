"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 55;
const DELETE_MS = 30;
const PAUSE_MS = 2000;

type Mode = "pause" | "deleting" | "typing";

/**
 * Sous-titre animé : chaque phrase s'écrit lettre par lettre, reste ~2 s, puis s'efface lettre par lettre
 * avant la suivante. Le texte complet est aussi présent (masqué visuellement) pour les lecteurs d'écran
 * et les robots ; sans animation (préférence système), la première phrase reste affichée.
 */
export function Typewriter({ phrases }: { phrases: string[] }) {
  // Le rendu serveur affiche déjà la 1re phrase en entier : rien ne clignote au chargement.
  const [text, setText] = useState(phrases[0]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("pause");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let delay = PAUSE_MS;
    let step: () => void;

    if (mode === "pause") {
      step = () => setMode("deleting");
    } else if (mode === "deleting") {
      delay = DELETE_MS;
      step = () => {
        if (text.length > 0) setText(text.slice(0, -1));
        else {
          setIndex((i) => (i + 1) % phrases.length);
          setMode("typing");
        }
      };
    } else {
      delay = TYPE_MS;
      const target = phrases[index];
      step = () => {
        if (text.length < target.length) setText(target.slice(0, text.length + 1));
        else setMode("pause");
      };
    }

    const timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [text, index, mode, phrases]);

  return (
    <p className="m-0 min-h-[3.2rem] text-[19px] md:text-[22px] leading-snug text-[#C7CCD6] max-w-[460px]">
      <span className="sr-only">{phrases.join(" ")}</span>
      <span aria-hidden="true">
        {text}
        <span className="caret ml-0.5 inline-block w-[2px] h-[1.1em] align-[-0.15em] bg-accent" />
      </span>
    </p>
  );
}
