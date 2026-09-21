/*
 * Mini-formation « lancer ton SaaS » (acquisition, contenu), affichée à la fin du parcours de publication.
 * Le contenu n'est pas encore là : pour l'ajouter, il suffit de remplir TRAINING_MODULES ci-dessous.
 * Les fichiers audio et vidéo se déposent dans public/formation/ (servis depuis notre propre domaine,
 * donc sans cookie ni requête vers un service tiers) et se référencent par "/formation/nom-du-fichier".
 */

export type TrainingKind = "video" | "audio" | "text";

export type TrainingModule = {
  id: string;
  title: string;
  kind: TrainingKind;
  /** Une ligne sous le titre. */
  summary?: string;
  /** Durée affichée, ex. "4 min". */
  duration?: string;
  /** Fichier audio ou vidéo, ex. "/formation/module-1.mp4". */
  src?: string;
  /** Vidéo : miniature affichée avant la lecture. */
  poster?: string;
  /** Vidéo : sous-titres au format .vtt (accessibilité). */
  captions?: string;
  /** Texte du module, ou transcription pour l'audio et la vidéo (un paragraphe par entrée). */
  body?: string[];
};

export const TRAINING_MODULES: TrainingModule[] = [];
