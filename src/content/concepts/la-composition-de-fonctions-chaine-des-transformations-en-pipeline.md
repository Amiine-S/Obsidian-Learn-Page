---
created: '2026-04-27T06:38:59.774Z'
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - La composition de fonctions chaîne des transformations en pipeline
slug: la-composition-de-fonctions-chaine-des-transformations-en-pipeline
excerpt: >-
  C'est le pattern qui donne sa lisibilité à RxJS, Effect-TS, lodash/fp, et
  toute la programmation "data-flow". Comprendre la composition te permet : - De
  lire un pipeline `pipe(x, f, g, h)` comme une recette ligne par ligne -
  D'écrire du code **plat** plutôt qu'imbriqué - D'isoler
oneLiner: >-
  **Composer**, c'est combiner deux ou plusieurs fonctions de sorte que la
  **sortie de l'une devienne l'entrée de la suivante** — `compose(f, g)(x) =
  f(g(x))` ou plus lisiblement `pipe(x, g, f)` — afin de modéliser un programme
  comme un **pipeline de transformations** sur la donnée.
related:
  - le-currying-transforme-une-fonction-n-aire-en-chaine-unaire
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - frontend
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - le-currying-transforme-une-fonction-n-aire-en-chaine-unaire
  - les-generators-produisent-des-valeurs-a-la-demande-avec-yield
  - les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
  - architecture-fondamentaux
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> **Composer**, c'est combiner deux ou plusieurs fonctions de sorte que la **sortie de l'une devienne l'entrée de la suivante** — `compose(f, g)(x) = f(g(x))` ou plus lisiblement `pipe(x, g, f)` — afin de modéliser un programme comme un **pipeline de transformations** sur la donnée.

## Contexte / pourquoi ça compte

C'est le pattern qui donne sa lisibilité à RxJS, Effect-TS, lodash/fp, et toute la programmation "data-flow". Comprendre la composition te permet :
- De lire un pipeline `pipe(x, f, g, h)` comme une recette ligne par ligne
- D'écrire du code **plat** plutôt qu'imbriqué
- D'isoler les étapes pour les tester / débugger
- De saisir le lien entre `Array.map.filter.reduce`, `obs.pipe(map, filter)`, `Effect.gen`, et `async/await` (toutes des formes de composition)

## Détails / mécanisme

### `compose` vs `pipe` — droite-gauche vs gauche-droite

```typescript
// compose : right-to-left (math classique : f∘g signifie f(g(x)))
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A) => f(g(a))

// pipe : left-to-right (lecture naturelle)
const pipe = <A, B, C>(g: (a: A) => B, f: (b: B) => C) =>
  (a: A) => f(g(a))

const trim = (s: string) => s.trim()
const upper = (s: string) => s.toUpperCase()

compose(upper, trim)("  hi  ")  // "HI"  (trim puis upper)
pipe(trim, upper)("  hi  ")     // "HI"  (idem, mais lecture directe)
```

**Préfère `pipe`** : on lit dans l'ordre où la donnée est transformée. `compose` est utile pour les compositions ponctuelles écrites à la math.

### Les contraintes

Pour composer `f` et `g`, il faut que **le retour de `g` corresponde au paramètre de `f`** — autrement dit, des fonctions **unaires** sont les plus simples à composer.

```typescript
const square = (n: number) => n * n
const stringify = (n: number) => `value: ${n}`
const upper = (s: string) => s.toUpperCase()

pipe(5, square, stringify, upper)  // "VALUE: 25"
```

Les fonctions multi-args ne composent pas directement — d'où l'intérêt du **currying** (cf. <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-currying-transforme-une-fonction-n-aire-en-chaine-unaire" data-wiki-title="Concept - Le currying transforme une fonction n-aire en chaîne unaire" data-wiki-preview="Le **currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — une chaîne de fonctions à un seul argument — afin de permettre la **préapplication partielle** des arguments et la **composition** dans des pipelines fonctionnels.">Concept - Le currying transforme une fonction n-aire en chaîne unaire</a>).

### Bonne pratique : pipeline plat et lisible

```typescript
// ✅ Lisible, étapes nommées
const slugify = (s: string) =>
  pipe(
    s,
    (s) => s.trim(),
    (s) => s.toLowerCase(),
    (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, ""),
    (s) => s.replace(/[^a-z0-9]+/g, "-"),
    (s) => s.replace(/^-+|-+$/g, ""),
  )

slugify("  Hôtel des Ventes  ")  // "hotel-des-ventes"
```

Tu peux **insérer un log** au milieu sans réorganiser :

```typescript
import { tap } from "ramda"
const slugify = pipe(
  trim,
  tap(s => console.log("after trim:", s)),  // ← debug ponctuel, retire facilement
  toLower,
  ...
)
```

### Mauvaise pratique : composition profonde sans pipe

```typescript
// ❌ "Function lasagna" — illisible et impossible à débugger
const slugify = (s: string) =>
  removeEdgeDashes(replaceNonAlnum(removeAccents(toLower(trim(s)))))
```

Pour insérer un log, il faut casser l'expression. Pour ajouter une étape, il faut compter les parenthèses. **À 3+ fonctions, toujours utiliser `pipe`**.

### Bonne pratique : composer des fonctions pures

```typescript
// ✅ Pipeline de fonctions pures = totalement testable et déterministe
const validate = (s: string) => { if (!s) throw new Error("empty"); return s }
const normalize = (s: string) => s.trim().toLowerCase()
const tokenize = (s: string) => s.split(/\s+/)

const process = pipe(validate, normalize, tokenize)
process(" Hello World ")  // ["hello", "world"]
```

Aucun effet de bord, mêmes inputs = mêmes outputs. La composition révèle sa puissance avec des fonctions pures.

### Mauvaise pratique : composer des fonctions à effets de bord cachés

```typescript
// ❌ Ordre fragile — chaque étape a un effet caché
const fetchAndSave = pipe(
  fetchUser,    // ← effet : appel HTTP (peut throw)
  logUser,      // ← effet : console.log (mute la valeur)
  saveToDb,     // ← effet : écriture DB (peut throw)
)
```

Le pipeline a l'air pur mais **chaque fonction peut throw ou avoir un effet réseau/DB**. Pour gérer ça proprement, utilise **Effect-TS** ou des `async function` chaînées par `await` — le type rend l'effet explicite.

### Composer avec l'erreur — les variantes

```typescript
// Sans gestion d'erreur (sync ou throw)
pipe(x, f, g, h)

// Avec promesses (chaînage natif)
Promise.resolve(x).then(f).then(g).then(h)

// Avec Result (Either) — l'erreur est une valeur dans le pipeline
import * as E from "fp-ts/Either"
pipe(x, f, E.flatMap(g), E.flatMap(h))

// Avec Effect-TS (le pinacle moderne)
import { pipe, Effect } from "effect"
pipe(x, f, Effect.flatMap(g), Effect.flatMap(h))
```

Toutes ces formes sont des **variantes de composition** adaptées à différents contextes (sync, async, erreurs comme valeurs).

## Exemple concret

### Cas réel : transformation de données API

```typescript
type ApiUser = { id: number; firstName: string; lastName: string; email: string; createdAt: string }
type DomainUser = { id: number; fullName: string; email: string; ageDays: number }

import { pipe } from "effect/Function"

const apiToDomain = (raw: ApiUser): DomainUser =>
  pipe(
    raw,
    (u) => ({ ...u, fullName: `${u.firstName} ${u.lastName}` }),
    (u) => ({ ...u, ageDays: Math.floor((Date.now() - new Date(u.createdAt).getTime()) / 86400000) }),
    ({ id, fullName, email, ageDays }) => ({ id, fullName, email, ageDays }),
  )
```

Chaque étape **enrichit** ou **réduit** l'objet. La pipeline est testable étape par étape.

### Cas réel : RxJS

```typescript
import { fromEvent } from "rxjs"
import { map, filter, debounceTime } from "rxjs/operators"

fromEvent<KeyboardEvent>(input, "input")
  .pipe(
    debounceTime(300),
    map((e) => (e.target as HTMLInputElement).value),
    filter((s) => s.length > 2),
    map((s) => s.toLowerCase()),
  )
  .subscribe(searchApi)
```

C'est de la composition **sur des streams** plutôt que sur des valeurs. Même principe : chaque opérateur transforme la sortie du précédent.

### Cas réel : Effect-TS

```typescript
import { Effect, pipe } from "effect"

const processUser = (id: string) =>
  pipe(
    fetchUser(id),                          // Effect<User, FetchError>
    Effect.flatMap(validateUser),           // Effect<User, FetchError | ValidationError>
    Effect.flatMap(enrichWithProfile),      // Effect<EnrichedUser, ...>
    Effect.tap((u) => Effect.log(`Loaded ${u.id}`)),
    Effect.catchTag("FetchError", (e) => Effect.succeed(defaultUser)),
  )
```

Les types s'accumulent à mesure que tu ajoutes des opérations — chaque étape est composable parce qu'elle retourne le même shape `Effect<A, E, R>`.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-currying-transforme-une-fonction-n-aire-en-chaine-unaire" data-wiki-title="Concept - Le currying transforme une fonction n-aire en chaîne unaire" data-wiki-preview="Le **currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — une chaîne de fonctions à un seul argument — afin de permettre la **préapplication partielle** des arguments et la **composition** dans des pipelines fonctionnels.">Concept - Le currying transforme une fonction n-aire en chaîne unaire</a> *(currying rend les fonctions composables car unaires)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(Effect compose Effect<A,E,R> via flatMap/pipe)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi" data-wiki-title="Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi" data-wiki-preview="La distinction **impératif vs déclaratif** est une question de **niveau d'abstraction** : un programme impératif décrit **les étapes** à exécuter (mutations, séquence, contrôle de flux), un programme déclaratif décrit **le résultat voulu**…">Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi</a> *(la composition est le langage du déclaratif)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a> *(une pipeline composée est elle-même un thunk paramétrable)*

**Prérequis** :
- Fonctions d'ordre supérieur
- Notion de fonction pure

**S'oppose à / à comparer avec** :
- **Style impératif** : étapes assignées à des variables intermédiaires (`const a = ...; const b = f(a); ...`) — verbeux mais débuggable
- **Method chaining** : `arr.filter().map().reduce()` — équivalent OO de `pipe`, limité aux méthodes natives
- **Async/await** : composition implicite dans le temps, mais sans pipe explicite

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime" data-wiki-title="JavaScript — paradigmes fonctionnels et mécanismes runtime" data-wiki-preview="1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP / pipeline, dangereux en code applicatif (illisible si abusé). 2. **Composition** chaîne des fonctions pures `g(f(x))` — la base du style &quot;data → pipeline&quot; (RxJS, Effect,…">JavaScript — paradigmes fonctionnels et mécanismes runtime</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>
<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

