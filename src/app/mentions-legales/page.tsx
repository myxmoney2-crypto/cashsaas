import type { Metadata } from "next";
import { TextPage, Todo } from "@/components/TextPage";

export const metadata: Metadata = {
  title: "Mentions légales — CashSaaS",
  description: "Éditeur du site CashSaaS, hébergeur et contact.",
};

export default function MentionsLegalesPage() {
  return (
    <TextPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <ul>
        <li>Nom ou dénomination : <Todo>nom et prénom, ou raison sociale</Todo></li>
        <li>Statut : <Todo>micro-entrepreneur, SAS, SASU, SARL…</Todo></li>
        <li>Adresse : <Todo>adresse postale</Todo></li>
        <li>SIRET : <Todo>numéro SIRET</Todo></li>
        <li>Email : <Todo>adresse email de contact</Todo></li>
        <li>Directeur de la publication : <Todo>nom</Todo></li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis —{" "}
        <a href="https://vercel.com" rel="noreferrer">vercel.com</a>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le site CashSaaS, son nom, ses textes et son identité visuelle sont protégés. Toute reproduction sans
        autorisation est interdite. Les contenus générés pour toi (idée, code, plan) sont à toi : tu peux les
        utiliser pour tes projets.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question, écris-nous à <Todo>adresse email de contact</Todo>.
      </p>
    </TextPage>
  );
}
