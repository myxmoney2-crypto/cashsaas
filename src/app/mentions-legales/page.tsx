import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = {
  title: "Mentions légales — CashSaaS",
  description: "Éditeur du site CashSaaS, hébergeur, données personnelles et contact.",
};

const CONTACT_EMAIL = "cashsaas.org@gmail.com";

export default function MentionsLegalesPage() {
  return (
    <TextPage title="Mentions légales">
      <p>Dernière mise à jour : 23 septembre 2026</p>

      <h2>1. Éditeur du site</h2>
      <p>
        Le site cashsaas.fr est édité par un entrepreneur individuel sous le régime de la
        micro-entreprise.
      </p>
      <ul>
        <li>Statut : entrepreneur individuel (micro-entrepreneur)</li>
        <li>Adresse : 3 rue d&apos;Urfé, 42300 Roanne, France</li>
        <li>
          Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>La direction de la publication est assurée par l&apos;éditeur du site, à l&apos;adresse indiquée au point 1.</p>

      <h2>3. Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
        États-Unis — <a href="https://vercel.com" rel="noreferrer">vercel.com</a>.
      </p>

      <h2>4. Paiements</h2>
      <p>
        Les paiements sont encaissés par Stripe, qui agit comme prestataire de paiement. Aucune
        coordonnée bancaire n&apos;est saisie ni conservée sur cashsaas.fr : le formulaire de
        paiement est fourni et traité par Stripe.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Les réponses au questionnaire sont transmises à notre prestataire d&apos;intelligence
        artificielle pour générer ton idée de projet, ton code de départ et ton plan d&apos;action ;
        elles ne sont pas conservées par nos soins au-delà de cette génération. Un identifiant
        technique et l&apos;heure de fin de ton questionnaire sont conservés sur nos serveurs,
        uniquement pour faire fonctionner le tarif de lancement limité dans le temps.
      </p>
      <p>Trois traitements sont opérés par des tiers :</p>
      <ul>
        <li>Stripe — email, nom et données de facturation nécessaires à l&apos;abonnement.</li>
        <li>Vercel — journaux techniques d&apos;hébergement (adresse IP, page consultée).</li>
        <li>
          GitHub — si tu choisis de récupérer ton code, un dépôt est créé sur ton propre compte
          GitHub avec le code de ton projet.
        </li>
      </ul>
      <p>
        Pour exercer les droits d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition
        et de portabilité prévus par le RGPD, écris à{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Une réponse est apportée sous un
        mois. En cas de désaccord, tu peux saisir la CNIL —{" "}
        <a href="https://www.cnil.fr" rel="noreferrer">cnil.fr</a>.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Le site utilise un identifiant technique déposé en cookie pour faire fonctionner le compte
        à rebours du tarif de lancement et reconnaître ta session. Il ne sert pas à te suivre sur
        d&apos;autres sites.
      </p>

      <h2>7. Propriété intellectuelle</h2>
      <p>
        Les textes, la charte graphique, le questionnaire et les contenus générés par le site sont
        protégés. Le dossier remis à un abonné lui est destiné : il peut l&apos;utiliser librement
        pour son propre projet, mais pas le revendre ni le rediffuser.
      </p>

      <h2>8. Réclamations et médiation</h2>
      <p>
        Toute réclamation peut être adressée à{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Conformément à l&apos;article
        L612-1 du code de la consommation, un consommateur peut recourir gratuitement à un
        médiateur de la consommation en vue de la résolution amiable d&apos;un litige.
      </p>

      <h2>9. Remboursement et résiliation</h2>
      <p>
        Les conditions de la garantie, la rétractation et les modalités de résiliation figurent sur
        la page <Link href="/remboursement">Conditions de remboursement</Link>.
      </p>
    </TextPage>
  );
}
