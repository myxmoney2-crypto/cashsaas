import type { Metadata } from "next";
import Link from "next/link";
import { TextPage, Todo } from "@/components/TextPage";

export const metadata: Metadata = {
  title: "Conditions de remboursement — CashSaaS",
  description:
    "Notre garantie de remboursement volontaire : conditions, comment faire la demande, et ce qui l'exclut.",
};

export default function RemboursementPage() {
  return (
    <TextPage title="Conditions de remboursement">
      <p>
        Chez CashSaaS, on préfère que tu testes pour de vrai. C’est pour ça qu’en plus de tes droits légaux,
        on te propose une <strong>garantie de remboursement volontaire</strong>, avec des conditions simples
        et transparentes.
      </p>

      <h2>Une garantie commerciale, distincte de tes droits légaux</h2>
      <p>
        Cette garantie est un engagement que nous prenons de notre propre initiative. Elle{" "}
        <strong>s’ajoute</strong> au droit de rétractation légal de 14 jours dont tu bénéficies si tu es
        consommateur, et à tes garanties légales : elle ne les remplace pas et ne les limite pas. Tu peux
        les faire valoir indépendamment.
      </p>

      <h2>Le principe</h2>
      <p>
        Si tu as fait le travail demandé dans les 48 heures qui suivent ton achat et que tu n’as réalisé
        aucune vente, on te rembourse.
      </p>

      <h2>Les conditions (elles sont toutes nécessaires)</h2>
      <ol>
        <li>Tu fais ta demande dans les <strong>48 heures</strong> qui suivent ton achat.</li>
        <li>
          Tu as publié <strong>au moins 10 contenus au total</strong> dans les <strong>48 heures</strong> qui
          suivent ton achat, sur un ou plusieurs comptes, sur au moins un réseau public :{" "}
          <strong>TikTok, Instagram ou YouTube</strong>.
        </li>
        <li>Malgré ça, tu n’as généré <strong>aucune vente</strong>.</li>
        <li>
          Tu nous écris <strong>par email, depuis l’adresse de ton compte CashSaaS</strong>, avec les{" "}
          <strong>liens vers tes contenus publiés</strong> comme justificatif.
        </li>
        <li>Ton <strong>abonnement est encore actif</strong> au moment de ta demande.</li>
      </ol>

      <h2>Comment faire ta demande</h2>
      <p>
        Envoie un email à <Todo>ton adresse email de contact</Todo> depuis l’adresse de ton compte, avec
        pour objet « Demande de remboursement ». Indique la date de ton achat, colle les liens vers tes
        contenus publiés (au moins 10 dans les 48 heures) et précise que tu n’as généré aucune vente.
      </p>

      <h2>Notre réponse</h2>
      <p>
        On te répond <strong>sous 72 heures</strong>. Si ta demande remplit toutes les conditions, on te
        rembourse le montant de ton achat, sur le moyen de paiement que tu as utilisé. Le délai d’arrivée de
        l’argent dépend ensuite de ta banque.
      </p>
      <p>
        <strong>Si le remboursement est accordé, ton abonnement est automatiquement annulé.</strong>
      </p>

      <h2>Ce qui exclut le remboursement</h2>
      <ul>
        <li>Une demande faite <strong>hors délai</strong>, plus de 48 heures après ton achat.</li>
        <li>Un abonnement <strong>déjà résilié</strong> au moment de la demande.</li>
        <li>
          Des <strong>contenus non publiés</strong> : jamais mis en ligne, supprimés, en privé, ou en dessous
          du minimum demandé (10 contenus dans les 48 heures).
        </li>
        <li>Une demande envoyée d’une autre adresse que celle de ton compte, ou sans les liens justificatifs.</li>
      </ul>

      <p>
        Une question ? Écris-nous, ou consulte nos <Link href="/mentions-legales">mentions légales</Link>.
      </p>
    </TextPage>
  );
}
