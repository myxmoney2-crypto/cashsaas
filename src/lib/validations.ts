import { QUESTIONS, type Answers, type Question } from "./questionnaire";

/*
 * Phrases de validation affichées sous chaque réponse.
 * Ton sobre et motivant, jamais de comparaison à une personne ou un archétype.
 *
 * Elles ne sont pas figées : chaque réponse a plusieurs variantes, choisies via une graine
 * tirée au hasard à chaque nouvelle session du questionnaire (deux personnes, ou deux passages,
 * ne voient donc pas les mêmes phrases), et beaucoup mentionnent le contenu réel de la réponse
 * (montant, niche, compétences, outils) ou la croisent avec une réponse précédente.
 */

type Ctx = {
  answer: string;
  index: number; // position de la réponse dans question.choices (-1 si réponse libre / « Autre »)
  answers: Answers;
  pick: (options: string[]) => string;
};
type Rule = (ctx: Ctx) => string;

const FALLBACK = "Noté.";

function hash(input: string): number {
  let h = 2166136261;
  for (const char of input) {
    h ^= char.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const euro = (n: number) => `${n.toLocaleString("fr-FR")} €`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const truncate = (s: string, max = 50) =>
  s.length > max ? `${s.slice(0, max).trim()}…` : s;

// « Une newsletter » → « une newsletter », mais « Instagram » reste tel quel.
const label = (s: string) =>
  /^(Un|Une)\s/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// Question à choix multiples : une seule sélection garde sa règle habituelle, plusieurs en ont une dédiée.
const multi =
  (single: Rule, several: (ctx: Ctx, items: string[]) => string): Rule =>
  (ctx) => {
    const items = ctx.answer.split(", ").filter(Boolean);
    return items.length > 1
      ? several(ctx, items)
      : single({ ...ctx, answer: items[0] ?? ctx.answer });
  };

// variants[i] = variantes pour question.choices[i]
const byChoice =
  (variants: string[][], other?: Rule): Rule =>
  (ctx) => {
    if (ctx.index >= 0) return ctx.pick(variants[ctx.index]);
    return other ? other(ctx) : FALLBACK;
  };

const MOTIVATION = QUESTIONS.find((q) => q.id === "motivation")!.choices!;
const CURRENT_INCOME = QUESTIONS.find(
  (q) => q.id === "current_income",
)!.choices!;
const CURRENT_INCOME_SHORT = [
  "zéro revenu",
  "moins de 1 000 € par mois",
  "1 000 à 2 000 € par mois",
  "2 000 à 3 500 € par mois",
  "plus de 3 500 € par mois",
];

const RULES: Record<string, Rule> = {
  age: byChoice([
    [
      "Cet âge est un vrai avantage pour se lancer, t'as le temps de ton côté.",
      "À 18-24 ans, tu peux te permettre d'essayer, d'ajuster et de recommencer sans pression.",
      "Se lancer tôt, c'est se laisser le droit de tester plusieurs pistes avant de trouver la bonne.",
    ],
    [
      "Entre 25 et 29 ans, tu as déjà un peu de recul et encore beaucoup de marge : c'est un bon équilibre pour se lancer.",
      "À ton âge, tu sais déjà ce que tu veux éviter, et tu as encore le temps de ton côté.",
      "Cet âge est un vrai avantage pour se lancer, t'as le temps de ton côté.",
    ],
    [
      "À 30-34 ans, tu sais ce qui compte pour toi : c'est un vrai atout pour choisir la bonne idée.",
      "À ton âge, l'expérience de vie aide à faire des choix plus sûrs dès le départ.",
      "Tu as encore de la marge et déjà du recul : c'est une bonne combinaison pour se lancer.",
    ],
    [
      "À ton âge, l'expérience de vie est un vrai atout : tu perds moins de temps sur ce qui ne marche pas.",
      "Ton recul est un avantage réel : tu sais reconnaître un projet solide quand tu en vois un.",
      "Se lancer avec de l'expérience, c'est partir avec de vrais repères.",
    ],
    [
      "Ton expérience est un vrai avantage : tu sais ce qui a de la valeur et ce qui n'en a pas.",
      "Se lancer avec autant de recul, c'est partir avec des repères solides.",
      "À ton âge, tu choisis un projet en connaissance de cause, et ça change beaucoup de choses.",
    ],
  ]),

  motivation: multi(
    byChoice([
      [
        "Viser des résultats concrets, c'est un bon moteur — on va construire quelque chose de mesurable.",
        "L'argent comme objectif, ça clarifie tout : on cherchera l'idée qui rapporte, pas seulement celle qui plaît.",
      ],
      [
        "Partir d'une passion, c'est ce qui donne l'énergie de tenir quand c'est moins facile.",
        "Quand un projet te parle vraiment, la régularité vient beaucoup plus naturellement.",
        "Cette motivation-là, c'est exactement celle qui pousse les gens à tenir dans la durée.",
      ],
      [
        "La liberté comme moteur, c'est solide : on ira chercher un modèle qui te laisse la main sur ton temps.",
        "Chercher l'indépendance, ça oriente vers des projets simples à faire tourner seul.",
      ],
      [
        "Cette motivation-là, c'est exactement celle qui pousse les gens à tenir dans la durée.",
        "Avoir envie de se prouver quelque chose, c'est un moteur qui ne s'éteint pas au premier obstacle.",
      ],
    ]),
    (ctx, items) => {
      const MOTIVATION_SHORT = [
        "l'argent",
        "une passion",
        "la liberté",
        "l'envie de te prouver quelque chose",
      ];
      const names = items.map(
        (item) =>
          MOTIVATION_SHORT[MOTIVATION.indexOf(item)] ?? item.toLowerCase(),
      );
      const all = joinList(names);
      return ctx.pick([
        `${cap(all)} : plusieurs moteurs à la fois, c'est ce qui aide à tenir quand un seul s'essouffle.`,
        `Avec ${all} comme moteurs, on cherchera une idée qui coche plusieurs de ces cases.`,
      ]);
    },
  ),

  current_income: byChoice([
    [
      "Ok, on part de là où tu en es, sans jugement.",
      "Pas de revenu pour l'instant : on construira un plan qui reste léger à démarrer.",
      "Ok, on en tient compte pour la suite.",
    ],
    [
      "Ok, on en tient compte pour caler un plan réaliste.",
      "Bien noté, on adaptera le rythme et le budget en conséquence.",
      "Ok, on en tient compte pour la suite.",
    ],
    [
      "Ok, c'est une base utile pour dimensionner la suite.",
      "Bien noté, ça nous aide à viser un objectif cohérent.",
      "Ok, on en tient compte pour la suite.",
    ],
    [
      "Ok, tu as déjà une base : on peut construire en parallèle, sans pression.",
      "Bien noté, ça laisse de la marge pour avancer sereinement.",
      "Ok, on en tient compte pour la suite.",
    ],
    [
      "Ok, tu as déjà une bonne base : on visera un projet qui se construit à côté, sans pression.",
      "Bien noté, ça laisse de la marge pour tester tranquillement.",
      "Ok, on en tient compte pour la suite.",
    ],
  ]),

  income_goal: (ctx) => {
    const goal = euro(Number(ctx.answer));
    const bracket = Number(ctx.answer);
    const options =
      bracket <= 3000
        ? [
            `Viser ${goal} par mois, c'est un objectif atteignable : on peut y aller étape par étape.`,
            `${goal} par mois : un objectif réaliste, qu'on va découper en paliers.`,
          ]
        : bracket <= 10000
          ? [
              `${goal} par mois, c'est ambitieux mais réaliste avec un plan tenu : on le découpe en paliers.`,
              `Viser ${goal} par mois demande de la régularité — c'est exactement ce que le plan va cadrer.`,
            ]
          : bracket <= 25000
            ? [
                `${goal} par mois, c'est un vrai objectif de croissance : on cherchera un modèle qui monte en charge.`,
                `Viser ${goal} par mois, ça se prépare : on partira sur un modèle qui peut grandir.`,
              ]
            : [
                `${goal} par mois : c'est une grosse ambition, on va la traduire en étapes concrètes plutôt qu'en pari.`,
                `Viser ${goal} par mois, ça se construit sur la durée — on va le découper en jalons mesurables.`,
              ];

    const currentIndex = CURRENT_INCOME.indexOf(
      String(ctx.answers.current_income ?? ""),
    );
    if (currentIndex >= 0) {
      options.push(
        `Partir de ${CURRENT_INCOME_SHORT[currentIndex]} pour viser ${goal} par mois, ça se construit par paliers, pas d'un coup.`,
      );
    }
    return ctx.pick(options);
  },

  passion: multi(
    (ctx) => {
      if (ctx.index >= 0) {
        return ctx.pick([
          `${ctx.answer} : un domaine où il y a de vraies opportunités en ce moment, bon choix.`,
          `Partir de « ${ctx.answer.toLowerCase()} », c'est une base solide pour ancrer ton idée.`,
          "Cette niche a un vrai potentiel en ce moment, bon choix.",
        ]);
      }
      const text = truncate(ctx.answer);
      return ctx.pick([
        `« ${text} » : une niche précise, c'est souvent ce qui permet de se démarquer.`,
        `« ${text} » : on va ancrer ton idée là-dedans, c'est un bon point de départ.`,
      ]);
    },
    (ctx, items) => {
      // Guillemets : les choix contiennent eux-mêmes « et », sans eux la liste serait illisible.
      const all = joinList(
        items.map((item) => `« ${truncate(item.toLowerCase(), 30)} »`),
      );
      return ctx.pick([
        `${cap(all)} : plusieurs univers, ça donne plus de matière pour trouver une idée originale.`,
        `Croiser ${all}, c'est souvent là que naissent les niches qui se démarquent.`,
      ]);
    },
  ),

  profitable_uninterested: byChoice([
    [
      "Cette flexibilité, c'est un vrai atout — ça élargit beaucoup les options possibles.",
      "Être prêt à sortir de sa zone de confort, ça ouvre des secteurs qu'on n'aurait pas envisagés.",
    ],
    [
      "Choisir un sujet qui te parle, c'est ce qui aide à tenir dans la durée.",
      "Ne pas te forcer sur un secteur qui t'ennuie, c'est une bonne façon de rester régulier.",
    ],
  ]),

  on_camera: byChoice([
    [
      "Être à l'aise devant la caméra ouvre beaucoup de formats pour se faire connaître.",
      "La vidéo, c'est le canal le plus direct pour créer de la confiance : c'est un vrai atout.",
    ],
    [
      "Rester en retrait, ça marche très bien aussi — on adaptera le plan en conséquence.",
      "Un projet sans visage, c'est tout à fait viable : on misera sur d'autres formats.",
    ],
  ]),

  current_situation: byChoice([
    [
      "Étudiant, tu as de la souplesse sur ton temps : c'est un bon point de départ.",
      "Ta situation ne va pas t'empêcher d'avancer là-dessus, au contraire, c'est un bon point de départ.",
    ],
    [
      "Avoir un revenu stable à côté, ça permet de construire sans pression.",
      "Se lancer en parallèle d'un emploi, ça laisse le temps de tester sereinement.",
    ],
    [
      "Tu connais déjà le terrain : ça fait gagner du temps sur beaucoup d'étapes.",
      "Déjà entrepreneur, tu sais ce que ça demande — on peut aller plus vite sur l'essentiel.",
    ],
    [
      "Ta situation ne va pas t'empêcher d'avancer là-dessus, au contraire, c'est un bon point de départ.",
      "Quelle que soit ta situation, on part de là où tu en es et on construit à partir de ça.",
    ],
  ]),

  tried_before: byChoice([
    [
      "L'expérience compte, même quand ça a pas marché — on apprend de ça.",
      "Avoir déjà essayé, c'est avoir déjà fait le plus dur : se lancer.",
    ],
    [
      "Pas de souci : tu pars sans mauvaises habitudes à défaire, c'est un bon point de départ.",
      "Un premier projet, c'est toujours le plus formateur — et on te guide pas à pas.",
    ],
  ]),

  tried_before_result: (ctx) => {
    const t = ctx.answer.toLowerCase();
    const themed: string[] = [];
    if (/argent|budget|cher|co[uû]t|financ/.test(t)) {
      themed.push(
        "Le budget, ça se planifie : on visera un démarrage léger cette fois.",
        "Manquer de moyens, ça arrive souvent — on choisira un lancement qui coûte peu.",
      );
    }
    if (/temps|fatigu|motivation|abandon|l[âa]ch|arr[êe]t/.test(t)) {
      themed.push(
        "Tenir dans la durée, c'est le vrai défi : le plan de 30 jours est là pour ça.",
        "Perdre le rythme, ça se prévient : on cadrera des petites étapes régulières.",
      );
    }
    if (/client|vente|vendre|audience|visib|abonn|personne/.test(t)) {
      themed.push(
        "Trouver du monde, c'est souvent là que ça coince : le plan d'acquisition va y répondre.",
        "Manquer de visibilité, ça se travaille : on y consacrera une vraie part du plan.",
      );
    }
    if (/technique|code|site|d[ée]velopp|outil|bug/.test(t)) {
      themed.push(
        "La technique peut freiner : c'est pour ça qu'on te fournit un code déjà prêt.",
        "Côté technique, tu n'auras pas à repartir de zéro : le code est déjà écrit.",
      );
    }
    return ctx.pick(
      themed.length
        ? themed
        : [
            "L'expérience compte, même quand ça a pas marché — on apprend de ça.",
            "Merci d'en parler : c'est précisément ce qu'on va éviter de reproduire.",
            "Ce que tu as appris là va servir pour la suite.",
          ],
    );
  },

  invested_before: byChoice([
    [
      "Pas besoin d'avoir déjà investi pour bien démarrer, on part de là où tu en es.",
      "Démarrer sans avoir rien investi avant, c'est possible : on vise un lancement léger.",
    ],
    [
      "Un premier petit investissement, c'est déjà un pas concret.",
      "Même modeste, avoir déjà mis quelque chose, ça montre que tu passes à l'action.",
    ],
    [
      "Ça montre que t'es prêt à mettre les moyens, c'est un bon signal.",
      "Avoir déjà investi une somme comme ça, c'est un vrai pas concret.",
    ],
    [
      "Ça montre que t'es prêt à mettre les moyens, c'est un bon signal.",
      "Avoir déjà investi autant, ça donne de l'expérience sur ce qui vaut le coup — on s'en sert.",
    ],
    [
      "Ça montre que t'es prêt à mettre les moyens, c'est un bon signal.",
      "Un investissement de ce niveau, c'est de l'expérience utile : on s'appuiera dessus pour choisir les bons outils.",
    ],
  ]),

  skills: (ctx) => {
    const list = ctx.answer.split(", ");
    if (list.includes("Aucune en particulier")) {
      return ctx.pick([
        "Aucune compétence particulière ? Aucun souci, on choisira une idée qui s'appuie sur des outils simples.",
        "Pas besoin d'un savoir-faire spécifique pour démarrer : le code est déjà écrit et le plan te guide.",
      ]);
    }
    const names = list.map((s) => s.toLowerCase());
    if (names.length === 1) {
      return ctx.pick([
        `${cap(names[0])} : une compétence qui va vraiment servir, on va s'appuyer dessus.`,
        `Ta compétence en ${names[0]}, c'est un vrai levier : on la mettra au centre du projet.`,
      ]);
    }
    const all = joinList(names);
    return ctx.pick([
      `${cap(all)} : cette combinaison est un vrai atout, on va s'appuyer dessus.`,
      `Avec ${all}, tu as plusieurs leviers à ta disposition — on va les exploiter.`,
    ]);
  },

  starting_budget: byChoice([
    [
      "Démarrer sans budget, c'est possible : on te proposera des outils gratuits.",
      "Aucun budget de départ ? On choisira une idée qui se lance avec des outils gratuits.",
    ],
    [
      "Un tout petit budget suffit pour démarrer : on s'appuiera surtout sur les outils gratuits.",
      "Moins de 100 €, c'est court mais suffisant pour lancer une première version.",
    ],
    [
      "Ce budget permet de bien démarrer, on s'en sert au mieux.",
      "Entre 100 et 500 €, c'est un budget raisonnable pour tester une idée sans prendre de risque.",
    ],
    [
      "Avec ce budget, tu peux te permettre quelques outils payants : on les choisira avec soin.",
      "Entre 500 et 2 000 €, ça ouvre pas mal d'options pour aller plus vite.",
    ],
    [
      "Avec ce budget, on peut viser plus grand dès le départ — sans se précipiter pour autant.",
      "Un budget confortable, c'est de la marge pour tester plusieurs pistes.",
    ],
  ]),

  time_per_day: (ctx) => {
    const variants = [
      [
        "15 minutes par jour, c'est peu mais c'est régulier : on visera un projet léger plutôt qu'un gros chantier.",
        "Avec un temps limité, on choisira une idée qui demande peu de maintenance.",
      ],
      [
        "30 minutes par jour, c'est un bon point de départ : la régularité compte plus que la durée.",
        "Une demi-heure par jour tient sur la durée, on va caler le plan dessus.",
      ],
      [
        "1 h par jour, c'est un vrai rythme pour avancer semaine après semaine.",
        "Une heure par jour suffit pour lancer une première version en quelques semaines.",
      ],
      [
        "2 h par jour, c'est un vrai engagement : on peut viser un lancement assez rapide.",
        "Avec ce temps-là, on peut avancer vite sur les premières semaines.",
      ],
      [
        "3 h par jour, c'est presque un mi-temps : on peut structurer un plan ambitieux.",
        "Avec autant de temps, on peut viser un lancement rapide et des tests fréquents.",
      ],
      [
        "5 h par jour ou plus, on peut avancer vite et structurer un vrai plan d'attaque.",
        "Beaucoup de temps sur le projet : on va cadrer ça pour que chaque journée compte.",
      ],
    ][ctx.index];

    if (ctx.index <= 2) {
      if (ctx.answers.current_situation === "Salarié") {
        variants.push(
          "En parallèle de ton emploi, ce rythme est tenable si tu restes régulier.",
        );
      } else if (ctx.answers.current_situation === "Étudiant") {
        variants.push(
          "Entre tes études et le projet, ce rythme reste raisonnable : l'essentiel, c'est la régularité.",
        );
      }
    }
    return ctx.pick(variants);
  },

  speed_vs_solid: byChoice([
    [
      "Bien noté, ça oriente le type d'idée qu'on va te proposer.",
      "Viser du rapide : on ira sur une idée qui permet un premier résultat vite.",
    ],
    [
      "Construire solide, c'est souvent ce qui dure : on ira sur une idée qui se bâtit dans le temps.",
      "Bien noté, on privilégiera une base saine plutôt qu'un coup de chance.",
    ],
  ]),

  audience: byChoice([
    [
      "Partir de zéro, ça se fait très bien avec le bon plan.",
      "Sans audience au départ, le plan mettra l'accent sur les premiers contenus et les premiers visiteurs.",
    ],
    [
      "Une petite audience, c'est déjà un point d'appui : on s'en servira pour les premiers tests.",
      "Même quelques centaines de personnes, ça permet de valider une idée plus vite.",
    ],
    [
      "Une audience de cette taille, c'est un vrai atout pour lancer vite.",
      "Avec ce public, on peut tester une offre rapidement.",
    ],
    [
      "Une grosse audience, c'est un vrai coup d'avance : on va construire l'offre pour bien l'exploiter.",
      "Avoir déjà un public de cette taille, ça change la vitesse à laquelle on peut valider une idée.",
    ],
  ]),

  steady_vs_big: byChoice([
    [
      "Compris, on choisit un modèle cohérent avec ça : des revenus réguliers et prévisibles.",
      "Petit à petit chaque mois : un abonnement ou un service récurrent colle bien à ça.",
    ],
    [
      "Compris, un gros coup rapide demande de bien choisir son moment : on en tient compte dans l'idée.",
      "Viser un gros coup, c'est un choix assumé : on gardera quand même une base stable en parallèle.",
    ],
  ]),

  timeline: byChoice([
    [
      "Un mois, c'est court : on ira droit à l'essentiel pour avoir un premier signal rapidement.",
      "Sur un mois, on privilégiera les actions qui donnent vite un retour.",
    ],
    [
      "Trois mois, c'est un horizon raisonnable pour voir si ça prend.",
      "Se donner trois mois, c'est assez pour tester et ajuster sans s'éterniser.",
    ],
    [
      "Six mois, c'est confortable pour tester, ajuster et mesurer vraiment.",
      "Avec six mois devant toi, on peut se permettre de faire les choses proprement.",
    ],
    [
      "Un an : tu te donnes le temps de construire quelque chose de solide.",
      "Se fixer un an, c'est un horizon qui permet de vraiment mesurer ses progrès.",
    ],
    [
      "Voir à long terme, c'est ce qui permet de tenir quand les premiers résultats tardent.",
      "Se donner plus d'un an, c'est un vrai engagement : le plan sera pensé pour durer.",
    ],
  ]),

  solo_vs_pushed: byChoice([
    [
      "Bon à savoir, le plan sera pensé pour ta façon de travailler : autonome, avec des étapes claires.",
      "Travailler seul te convient : on te donnera un plan que tu peux suivre à ton rythme.",
    ],
    [
      "Bon à savoir : on prévoira des points de repère réguliers pour que tu restes accompagné.",
      "Être poussé aide à tenir : le plan sera découpé en petites échéances.",
    ],
  ]),

  instinct_vs_calc: byChoice([
    [
      "Foncer, ça permet d'avancer vite : on prévoira des garde-fous pour éviter les faux pas.",
      "Bien noté, on privilégiera des étapes rapides à tester plutôt qu'un long plan.",
    ],
    [
      "Tout calculer, ça évite les mauvaises surprises : le plan sera détaillé et chiffré.",
      "Bien noté, on te donnera assez de détails pour décider en connaissance de cause.",
    ],
  ]),

  would_quit_reason: multi(
    byChoice(
      [
        [
          "Le manque de résultats rapides : on prévoira des petites victoires dès les premières semaines.",
          "Pour tenir sans résultat immédiat, on découpera le plan en jalons visibles.",
        ],
        [
          "Le manque de temps : on choisira une idée qui reste tenable même dans les semaines chargées.",
          "Bien noté, le plan restera léger pour survivre aux semaines difficiles.",
        ],
        [
          "Le manque d'argent : on gardera les coûts au minimum tant que ça ne rapporte pas.",
          "Bien noté, on privilégiera des outils gratuits pour limiter la pression financière.",
        ],
        [
          "La motivation, ça se protège avec un plan clair et de petits objectifs — c'est ce qu'on va te donner.",
          "Bien noté : des étapes courtes et visibles aident beaucoup à garder l'élan.",
        ],
        [
          "Le doute, c'est normal au début : le plan avance par petites étapes qui se valident une à une.",
          "Bien noté, on te donnera assez de repères pour avancer avec confiance.",
        ],
      ],
      (ctx) =>
        ctx.pick([
          `« ${truncate(ctx.answer)} » : bien noté, on prévoira des garde-fous là-dessus.`,
          "Merci pour cette franchise, ça nous aide à prévoir des garde-fous.",
        ]),
    ),
    (ctx, items) => {
      const all = joinList(
        items.map((item) => `« ${truncate(item.toLowerCase(), 30)} »`),
      );
      return ctx.pick([
        `${cap(all)} : plusieurs risques identifiés d'un coup, on prévoira des garde-fous pour chacun.`,
        `Avec ${all} en tête, on construira un plan qui protège contre ces risques-là.`,
      ]);
    },
  ),

  time_constraints: multi(
    byChoice(
      [
        [
          "Tes études prennent de la place : on calera le plan sur tes périodes plus calmes.",
          "Bien noté, on tiendra compte de ton emploi du temps d'étudiant.",
        ],
        [
          "Un temps plein, c'est prenant : on ira sur un plan léger, tenable après les journées de travail.",
          "Bien noté, le plan sera pensé pour se glisser autour de ton travail.",
        ],
        [
          "Ta famille compte, et le plan doit s'y adapter : on le fera flexible.",
          "Bien noté, on prévoira un rythme souple, compatible avec la vie de famille.",
        ],
        [
          "Plusieurs choses en parallèle : on gardera un plan simple pour qu'il reste tenable.",
          "Bien noté, on visera l'essentiel pour ne pas te surcharger.",
        ],
        [
          "Parfait, un emploi du temps plus libre laisse de la marge pour avancer.",
          "Rien de particulier : on pourra avancer à un bon rythme.",
        ],
      ],
      (ctx) =>
        ctx.pick([
          `« ${truncate(ctx.answer)} » : on en tient compte pour que le plan reste tenable au quotidien.`,
          "On en tient compte pour que le plan reste tenable au quotidien.",
        ]),
    ),
    (ctx, items) => {
      const all = joinList(
        items.map((item) => truncate(item.toLowerCase(), 30)),
      );
      return ctx.pick([
        `Avec ${all} en parallèle, on gardera un plan simple pour qu'il reste tenable.`,
        `${cap(all)} : plusieurs choses à la fois, le plan restera volontairement léger.`,
      ]);
    },
  ),

  tech_comfort: byChoice([
    [
      "Parfait, on ajuste le niveau technique en conséquence : tu pourras personnaliser le code toi-même.",
      "À l'aise avec la technique, tu pourras aller plus loin sur le code fourni.",
    ],
    [
      "Tout simplifié : le dossier expliquera chaque étape en langage simple.",
      "Bien noté, on privilégiera des outils qui se configurent sans coder.",
    ],
  ]),

  solo_vs_partner: byChoice([
    [
      "Rester solo, c'est plus simple à piloter : on te proposera un projet gérable seul.",
      "Bien noté, l'idée sera pensée pour être menée par une seule personne.",
    ],
    [
      "Rester ouvert à un associé élargit les possibilités : on pourra imaginer un projet à deux.",
      "Bien noté, ça influence la forme que peut prendre le projet.",
    ],
  ]),

  existing_tools: (ctx) => {
    const list = ctx.answer.split(", ");
    if (list.includes("Aucun en particulier")) {
      return ctx.pick([
        "Pas d'outil de départ ? On construira ta visibilité depuis le début, avec le plan.",
        "Aucun souci, le plan couvre aussi la création de ta première présence en ligne.",
      ]);
    }
    const names = list.map(label);
    if (names.length === 1) {
      return ctx.pick([
        `${cap(names[0])} : un point d'appui direct, on va l'exploiter dans le plan.`,
        `Avoir déjà ${names[0]}, ça peut devenir un vrai raccourci pour trouver tes premiers clients.`,
      ]);
    }
    const all = joinList(names);
    return ctx.pick([
      `${cap(all)} : ça fait plusieurs points d'appui, on va s'en servir dans le plan.`,
      `Avec ${all}, tu as déjà plusieurs canaux pour trouver tes premiers clients.`,
    ]);
  },

  anything_else: (ctx) =>
    ctx.pick([
      "Merci d'avoir pris le temps de l'écrire, c'est ce qui rend le résultat vraiment personnel.",
      "Bien noté, on garde ça en tête pour la suite.",
      "Merci, ça nous aide à coller encore mieux à ta situation.",
    ]),
};

export function getValidation(
  question: Question,
  answer: string | number,
  answers: Answers,
  seed: string,
): string {
  const rule = RULES[question.id];
  if (!rule) return FALLBACK;

  const text = String(answer).trim();
  const ctx: Ctx = {
    answer: text,
    index: question.choices?.indexOf(text) ?? -1,
    answers,
    pick: (options) => options[hash(`${seed}:${question.id}`) % options.length],
  };
  return rule(ctx);
}
