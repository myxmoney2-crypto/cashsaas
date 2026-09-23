"use client";

import { useState } from "react";
import type { Question } from "@/lib/questionnaire";

const inputClass =
  "w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent";

/** Insensible aux accents et à la casse : « Écologie » matche « ecologie ». */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Variante de ChoiceInput pour une longue liste de choix (20-30+) : une grille de boutons
 * deviendrait illisible, donc recherche + liste à cocher + puces pour les choix déjà faits.
 * Même contrat que ChoiceInput : réponse stockée jointe par ", ", « Autre » en texte libre fondu dedans.
 */
export function SearchableChoiceInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | number | undefined;
  onChange: (value: string) => void;
}) {
  const choices = question.choices!;
  const text = typeof value === "string" ? value : "";
  const parts = text.split(", ").filter(Boolean);
  const selected = parts.filter((c) => choices.includes(c));
  const freeText = parts.filter((c) => !choices.includes(c)).join(", ");

  const [search, setSearch] = useState("");
  const [otherOpen, setOtherOpen] = useState(Boolean(question.allowOther) && freeText !== "");

  const max = question.maxChoices;
  const atMax = Boolean(max) && selected.length >= max!;

  const compose = (picked: string[], other: string) => {
    const free = other.replace(/,/g, " ");
    return [...choices.filter((c) => picked.includes(c)), ...(free.trim() ? [free] : [])].join(", ");
  };

  function toggle(choice: string) {
    const isSelected = selected.includes(choice);
    if (!isSelected && atMax) return; // déjà au maximum : ignoré tant qu'on n'a rien décoché
    const next = isSelected ? selected.filter((c) => c !== choice) : [...selected, choice];
    onChange(compose(next, freeText));
  }

  function removeChip(choice: string) {
    onChange(compose(selected.filter((c) => c !== choice), freeText));
  }

  function toggleOther() {
    if (otherOpen) {
      setOtherOpen(false);
      onChange(compose(selected, ""));
    } else {
      setOtherOpen(true);
    }
  }

  const filtered = search.trim()
    ? choices.filter((c) => normalize(c).includes(normalize(search)))
    : choices;

  return (
    <div className="flex flex-col gap-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => removeChip(choice)}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-accent bg-accent/10 text-foreground text-sm"
            >
              {choice}
              <span aria-hidden="true" className="text-muted-2">×</span>
              <span className="sr-only">Retirer {choice}</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cherche une passion (sport, tech, mode...)"
        aria-label={`Rechercher parmi les choix de : ${question.prompt}`}
        className={inputClass}
      />

      {atMax && (
        <p className="text-xs text-muted-2 m-0">
          Maximum atteint ({max}) : décoche un choix pour en ajouter un autre.
        </p>
      )}

      <div
        role="group"
        aria-label={question.prompt}
        className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto rounded-2xl border border-white/10 bg-surface p-2"
      >
        {filtered.length === 0 && (
          <p className="text-sm text-muted-2 px-3 py-2 m-0">Aucun résultat pour « {search} ».</p>
        )}
        {filtered.map((choice) => {
          const checked = selected.includes(choice);
          const disabled = !checked && atMax;
          return (
            <label
              key={choice}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                checked ? "bg-accent/10 text-foreground" : "text-muted hover:bg-white/5"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(choice)}
                className="h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              {choice}
            </label>
          );
        })}

        {question.allowOther && (
          <label
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border-t border-white/10 mt-1 pt-3 ${
              otherOpen ? "bg-accent/10 text-foreground" : "text-muted hover:bg-white/5"
            }`}
          >
            <input
              type="checkbox"
              checked={otherOpen}
              onChange={toggleOther}
              className="h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            Autre (précise en texte libre)
          </label>
        )}
      </div>

      {otherOpen && (
        <input
          type="text"
          value={freeText}
          onChange={(e) => onChange(compose(selected, e.target.value))}
          placeholder="Précise en quelques mots"
          aria-label={`${question.prompt} (précision)`}
          autoFocus
          className={inputClass}
        />
      )}
    </div>
  );
}
