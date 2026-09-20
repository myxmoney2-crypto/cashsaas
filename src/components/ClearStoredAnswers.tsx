"use client";

import { useEffect } from "react";
import { clearStoredAnswers } from "@/lib/stored-answers";

/** Les réponses sont désormais enregistrées sur le compte : on vide la copie locale. */
export function ClearStoredAnswers() {
  useEffect(() => {
    clearStoredAnswers();
  }, []);
  return null;
}
