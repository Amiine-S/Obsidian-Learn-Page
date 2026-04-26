---
domain: frontend
tags:
  - type/moc
  - domain/frontend
title: MOC - Frontend
slug: frontend
excerpt: >-
  - Concept - Une closure capture son environnement lexical à la création -
  Concept - Un thunk est une fonction qui retarde l'évaluation
related:
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - >-
    effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect
  - atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react
  - >-
    les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
  - la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte
  - signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs
  - signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - >-
    les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses
  - la-chaine-de-prototypes-structure-l-heritage-en-javascript
  - les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives
  - file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux
  - >-
    window-controls-overlay-donne-aux-pwa-desktop-le-controle-de-la-barre-de-titre
backlinks:
  - 2026-04-25-effect-ts-pourquoi-et-pour-qui
  - 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
  - 2026-04-26-effect-atom-state-management-react-sur-effect-ts
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - 2026-04-26-nouveautes-pwa-en-2026
  - 2026-04-26-solidjs-reactivite-fine-grained-vs-react-et-vue
  - atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react
  - >-
    effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - la-chaine-de-prototypes-structure-l-heritage-en-javascript
  - la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - >-
    les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out
  - >-
    les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses
  - les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs
  - signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - >-
    window-controls-overlay-donne-aux-pwa-desktop-le-controle-de-la-barre-de-titre
topics:
  - devops
  - effect-ts
  - frontend
  - mobile
  - rust
  - typescript
---

# MOC - Frontend

## Vue d'ensemble

> Frameworks JS/TS modernes, rendering, perfs, design systems, UX.

## Concepts clés

### Fondamentaux JS/TS
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a>

### Écosystème TS — Effect-TS
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a>

### State management React — Effect Atom
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect" data-wiki-title="Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect" data-wiki-preview="Effect Atom propose **une seule primitive** — l'`Atom` — pour modéliser à la fois le state local, le state serveur, la DI et les effets asynchrones, le tout en s'appuyant sur le runtime Effect-TS. Une lib remplace **Jotai + TanStack Query +…">Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react" data-wiki-title="Concept - Atom.runtime branche les Layers Effect-TS dans le state management React" data-wiki-preview="`Atom.runtime(layer)` est le pont qui prend un **`Layer&lt;…&gt;` Effect-TS** et le transforme en **runtime accessible depuis React** — chaque atom créé via ce runtime obtient automatiquement les services du Layer en injection.">Concept - Atom.runtime branche les Layers Effect-TS dans le state management React</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out" data-wiki-title="Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out" data-wiki-preview="Quand plus aucun composant ne consomme un atom, **Effect Atom le libère automatiquement** : ses ressources Effect sont fermées, ses finalizers exécutés. Pour persister un atom au-delà des démontages, on opt-out explicitement avec `Atom.keep…">Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out</a>

### Tooling moderne (Rust/Go)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse" data-wiki-title="Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse" data-wiki-preview="**oxlint** (linter) et **oxfmt** (formatter) sont les briques Rust de l'écosystème **oxc**, qui réécrit toute la chaîne de tooling JS en Rust. Gain typique : 50-100× plus rapide qu'ESLint/Prettier sur les mêmes opérations.">Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse</a>

### Réactivité fine-grained / signals (SolidJS)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux" data-wiki-title="Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux" data-wiki-preview="En SolidJS, **le corps du composant est exécuté une seule fois** au montage : son rôle est de **construire le DOM** et d'**y attacher des bindings réactifs aux signals** — les mises à jour ultérieures contournent complètement le composant.">Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte" data-wiki-title="Concept - La réactivité fine-grained met à jour seulement le DOM affecté" data-wiki-preview="La **réactivité fine-grained** consiste à attacher chaque morceau du DOM à ses dépendances réactives précises, de sorte qu'un changement d'état ne déclenche que la mise à jour des nœuds DOM qui dépendent réellement de cette donnée — pas du…">Concept - La réactivité fine-grained met à jour seulement le DOM affecté</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs" data-wiki-title="Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS" data-wiki-preview="SolidJS expose **trois primitives réactives** qui suffisent à tout exprimer : `createSignal` (état modifiable), `createMemo` (valeur dérivée mémoïsée), `createEffect` (effet de bord auto-tracké) — les autres APIs (`createResource`, `createS…">Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui" data-wiki-title="Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI" data-wiki-preview="**Virtual DOM** (React) et **signals** (Solid, Vue, Angular) sont deux stratégies opposées pour répondre à &quot;comment mettre à jour le DOM quand l'état change&quot; : le VDOM ré-exécute et diffe, les signals trackent et patchent directement — chaq…">Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI</a>

### JavaScript en profondeur
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks" data-wiki-title="Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks" data-wiki-preview="L'**event loop JS** alterne : exécuter le code synchrone jusqu'à pile vide, **vider toute la microtask queue** (Promises, `queueMicrotask`), prendre **une seule** macrotask (`setTimeout`, événements DOM, I/O), puis recommencer — c'est cette…">Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/this-en-javascript-depend-du-site-d-appel-pas-de-la-definition" data-wiki-title="Concept - this en JavaScript dépend du site d'appel pas de la définition" data-wiki-preview="Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas lié à la définition d'une fonction** — il est lié au **site d'appel** (où et comment la fonction est invoquée), ce qui produit des comportements surprenants quand…">Concept - this en JavaScript dépend du site d'appel pas de la définition</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs" data-wiki-title="Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs" data-wiki-preview="Le **hoisting** est le mécanisme par lequel JS &quot;remonte&quot; les **déclarations** de variables et fonctions en haut de leur scope, mais pas leurs **valeurs** — d'où le piège classique : `var` est `undefined` avant son `=`, alors que `let`/`cons…">Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses" data-wiki-title="Concept - Les coercitions implicites de JavaScript suivent des règles précises mais piégeuses" data-wiki-preview="JS effectue des **conversions de type implicites** dans plein d'opérations (`==`, `+`, `-`, `&lt;`, `if (x)`, `!x`) — ces règles sont **déterministes et documentées**, mais leur côté contre-intuitif (`[] == ![]`, `&quot;0&quot; == false`) est la raison…">Concept - Les coercitions implicites de JavaScript suivent des règles précises mais piégeuses</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-chaine-de-prototypes-structure-l-heritage-en-javascript" data-wiki-title="Concept - La chaîne de prototypes structure l'héritage en JavaScript" data-wiki-preview="En JS, **chaque objet pointe vers un autre objet** via `__proto__` (son prototype) — quand on accède à une propriété qui n'existe pas, le moteur **remonte la chaîne** jusqu'à la trouver ou jusqu'à `null` — c'est ce mécanisme de &quot;**prototype…">Concept - La chaîne de prototypes structure l'héritage en JavaScript</a>

### PWA (Progressive Web Apps)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives" data-wiki-title="Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives" data-wiki-preview="En 2026, l'**écart de capacités** entre PWA et apps natives s'est massivement réduit grâce aux APIs nouvelles ou stabilisées (File System Access, Window Controls Overlay, Web Push iOS, WebAuthn, USB/Bluetooth/Serial, Web Payment) — au point…">Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux" data-wiki-title="Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux" data-wiki-preview="La **File System Access API** permet à une page web (et donc à une PWA) d'**ouvrir, lire, modifier et sauvegarder** des fichiers sur le système de fichiers réel de l'utilisateur — et non plus seulement de blobs sandboxés — moyennant **une p…">Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/window-controls-overlay-donne-aux-pwa-desktop-le-controle-de-la-barre-de-titre" data-wiki-title="Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la barre de titre" data-wiki-preview="**Window Controls Overlay (WCO)** est une feature PWA qui permet à l'app installée en desktop de **dessiner ses propres éléments dans la zone de la barre de titre** — l'OS conserve uniquement les contrôles de fenêtre (min/max/close), tout l…">Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la barre de titre</a>

## Sous-domaines à explorer

### Frameworks (React, Vue, Svelte, Solid…)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux" data-wiki-title="Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux" data-wiki-preview="En SolidJS, **le corps du composant est exécuté une seule fois** au montage : son rôle est de **construire le DOM** et d'**y attacher des bindings réactifs aux signals** — les mises à jour ultérieures contournent complètement le composant.">Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui" data-wiki-title="Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI" data-wiki-preview="**Virtual DOM** (React) et **signals** (Solid, Vue, Angular) sont deux stratégies opposées pour répondre à &quot;comment mettre à jour le DOM quand l'état change&quot; : le VDOM ré-exécute et diffe, les signals trackent et patchent directement — chaq…">Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI</a>

### Rendering (SSR, RSC, streaming, hydration)
- *(à venir)*

### State management
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect" data-wiki-title="Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect" data-wiki-preview="Effect Atom propose **une seule primitive** — l'`Atom` — pour modéliser à la fois le state local, le state serveur, la DI et les effets asynchrones, le tout en s'appuyant sur le runtime Effect-TS. Une lib remplace **Jotai + TanStack Query +…">Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react" data-wiki-title="Concept - Atom.runtime branche les Layers Effect-TS dans le state management React" data-wiki-preview="`Atom.runtime(layer)` est le pont qui prend un **`Layer&lt;…&gt;` Effect-TS** et le transforme en **runtime accessible depuis React** — chaque atom créé via ce runtime obtient automatiquement les services du Layer en injection.">Concept - Atom.runtime branche les Layers Effect-TS dans le state management React</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs" data-wiki-title="Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS" data-wiki-preview="SolidJS expose **trois primitives réactives** qui suffisent à tout exprimer : `createSignal` (état modifiable), `createMemo` (valeur dérivée mémoïsée), `createEffect` (effet de bord auto-tracké) — les autres APIs (`createResource`, `createS…">Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS</a>

### CSS & design systems
- *(à venir)*

### Performance (Core Web Vitals, bundling)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte" data-wiki-title="Concept - La réactivité fine-grained met à jour seulement le DOM affecté" data-wiki-preview="La **réactivité fine-grained** consiste à attacher chaque morceau du DOM à ses dépendances réactives précises, de sorte qu'un changement d'état ne déclenche que la mise à jour des nœuds DOM qui dépendent réellement de cette donnée — pas du…">Concept - La réactivité fine-grained met à jour seulement le DOM affecté</a>

### Tooling (Vite, esbuild, Turbopack, oxc, Biome)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse" data-wiki-title="Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse" data-wiki-preview="**oxlint** (linter) et **oxfmt** (formatter) sont les briques Rust de l'écosystème **oxc**, qui réécrit toute la chaîne de tooling JS en Rust. Gain typique : 50-100× plus rapide qu'ESLint/Prettier sur les mêmes opérations.">Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse</a>

## Sources de référence

- [web.dev](https://web.dev/)
- [Josh W. Comeau](https://www.joshwcomeau.com/)
- [Lee Robinson](https://leerob.io/blog)
- [Kent C. Dodds](https://kentcdodds.com/blog)

## Questions ouvertes

- React Compiler vs signals : qui gagne sur le long terme ?
- Quand SolidJS justifie-t-il vraiment d'être adopté en prod (cas concrets) ?
- iOS rattrapera-t-il vraiment Chrome sur les APIs PWA bas-niveau ?
- Records & Tuples + Pattern matching : adoptés en pratique d'ici 2027 ?

