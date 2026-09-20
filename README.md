# CashSaaS

Un SaaS qui génère, pour chaque client, une idée de business taillée pour lui, le
code prêt à déployer sur ses propres comptes, et un plan d'accompagnement de 30
jours — vendu en abonnement mensuel résiliable à 3 paliers (Starter / Pro /
Premium).

Stack : Next.js 16 (App Router) + Tailwind v4, Supabase (auth + DB), Stripe
(abonnements + webhooks), Claude API (génération).

## 1. Comptes à créer avant de lancer

- **Anthropic** — [console.anthropic.com](https://console.anthropic.com) → une clé API
- **Supabase** — un projet → URL, clé anon, clé service role
- **Stripe** — un compte (mode test d'abord) → clé secrète, clé publique, secret de
  webhook, et 3 produits d'abonnement récurrents (Starter/Pro/Premium) → un Price ID
  par palier
- **GitHub** — le repo template `myxmoney2-crypto/cashsaas-template` (public, `Template repository`
  activé) : site statique + petit script de build qui injecte `SUPABASE_URL` et `SUPABASE_ANON_KEY`.
  Le bouton « Deploy to Vercel » du dashboard le clone chez le client
- **Vercel** — pour héberger ce site
- **Un nom de domaine** (OVH, Namecheap, ...)

## 2. Configuration

```bash
cp .env.example .env.local
```

Renseigne toutes les variables (voir `.env.example`). Sans elles, l'app démarre et
se construit, mais l'auth, le paiement et la génération échoueront proprement (le
message d'erreur s'affiche dans l'UI).

## 3. Base de données

Exécute dans l'ordre `supabase/migrations/0001_init.sql` puis
`supabase/migrations/0002_generation_status.sql` dans le SQL Editor de ton projet
Supabase (ou `supabase db push` si tu utilises la CLI). Ça crée :

- `profiles` — un enregistrement par utilisateur (créé automatiquement à l'inscription)
- `questionnaire_responses` — les 26 réponses en JSON
- `generations` — idée + code + plan générés, avec un `status` (pending / done / failed)
  et le `checkout_session_id` Stripe qui sert d'anti-doublon
- `regenerations_usage` — compteur mensuel pour plafonner les régénérations par palier

RLS est activé partout ; chacun ne voit que ses propres lignes. Le webhook Stripe
et la génération passent par `SUPABASE_SERVICE_ROLE_KEY`, qui contourne RLS.

## 4. Lancer en local

```bash
npm install
npm run dev
```

Le webhook Stripe (`/api/webhooks/stripe`) doit écouter `checkout.session.completed`,
`customer.subscription.updated` et `customer.subscription.deleted`. Il répond tout de
suite à Stripe et lance la génération IA en arrière-plan (jusqu'à 5 min) ; un
événement rejoué ne relance pas de deuxième génération.

Pour tester le webhook Stripe en local :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 5. Parcours

`/` (landing) → `/signup` ou `/login` → `/questionnaire` (26 questions, 4 blocs) →
`/pricing` (choix du palier, Stripe Checkout) → webhook Stripe déclenche la
génération IA (Haiku/Sonnet/Opus selon le palier) → `/dashboard` (idée, code,
plan des 30 jours, étapes de déploiement guidé sur les comptes du client).

## Structure

```
src/
  app/            routes (App Router) : landing, auth, questionnaire, pricing, dashboard, API
  components/      UI partagée
  lib/             clients Supabase/Stripe/Anthropic, config des paliers, données du questionnaire
  proxy.ts         protège /dashboard, /questionnaire, /pricing (auth requise)
supabase/migrations/  schéma SQL
```
