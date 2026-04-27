---
created: 2026-04-27T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - Le currying transforme une fonction n-aire en chaîne unaire
slug: le-currying-transforme-une-fonction-n-aire-en-chaine-unaire
excerpt: >-
  C'est le pattern qui sous-tend **Ramda**, **lodash/fp**, **Effect-TS**,
  **fp-ts** et indirectement **RxJS**. Comprendre le currying te permet : - De
  lire ces libs sans confusion (pourquoi `R.map(fn)(arr)` au lieu de
  `arr.map(fn)`) - D'écrire des fonctions configurables en pipelin
oneLiner: >-
  Le **currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — une chaîne de
  fonctions à un seul argument — afin de permettre la **préapplication
  partielle** des arguments et la **composition** dans des pipelines
  fonctionnels.
related:
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - frontend
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - architecture-fondamentaux
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Le **currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — une chaîne de fonctions à un seul argument — afin de permettre la **préapplication partielle** des arguments et la **composition** dans des pipelines fonctionnels.

## Contexte / pourquoi ça compte

C'est le pattern qui sous-tend **Ramda**, **lodash/fp**, **Effect-TS**, **fp-ts** et indirectement **RxJS**. Comprendre le currying te permet :
- De lire ces libs sans confusion (pourquoi `R.map(fn)(arr)` au lieu de `arr.map(fn)`)
- D'écrire des fonctions configurables en pipeline (`pipe(filter(p), map(f), reduce(r, init))`)
- De factoriser des configs (un logger préconfiguré, un client HTTP avec base URL fixée, etc.)
- De saisir le lien avec la composition : **seules les fonctions unaires composent proprement**

## Détails / mécanisme

### La transformation

```typescript
// Forme classique (n-aire)
const add = (a: number, b: number, c: number) => a + b + c

// Forme curryée (unaire en chaîne)
const addCurried = (a: number) => (b: number) => (c: number) => a + b + c
```

Chaque appel **retourne une fonction** qui attend l'argument suivant. Au dernier argument, le résultat final tombe.

### Currier automatiquement

```typescript
function curry<T extends (...args: any[]) => any>(fn: T): any {
  return function curried(...args: any[]) {
    if (args.length >= fn.length) return fn(...args)
    return (...rest: any[]) => curried(...args, ...rest)
  }
}

const add = (a: number, b: number, c: number) => a + b + c
const cAdd = curry(add)

cAdd(1, 2, 3)      // 6
cAdd(1)(2)(3)      // 6
cAdd(1, 2)(3)      // 6  — partial puis complet
cAdd(1)(2, 3)      // 6  — idem
```

C'est ce que font Ramda et lodash/fp : currying flexible avec accumulation.

### Préapplication = configuration une fois, usage partout

```typescript
// ✅ Bon usage — un fetcher préconfiguré
const fetchWith = (baseUrl: string) => (token: string) => (path: string) =>
  fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } })

const apiFetch = fetchWith("https://api.example.com")
const userFetch = apiFetch("USER_TOKEN")

userFetch("/me")          // → fetch("https://api.example.com/me", {Authorization: "Bearer USER_TOKEN"})
userFetch("/posts")        // même token, même base, juste le path qui change
```

Tu **fixes la config tôt**, tu **passes la fonction préparée** dans ton app, et au site d'usage tu donnes seulement le path.

### Currying + composition = data-pipeline

```typescript
import { pipe } from "effect/Function"

const map  = <A, B>(f: (a: A) => B) => (arr: A[]) => arr.map(f)
const filter = <A>(p: (a: A) => boolean) => (arr: A[]) => arr.filter(p)

const pipeline = pipe(
  [1, 2, 3, 4, 5],
  filter((n: number) => n > 2),
  map((n: number) => n * 10),
)
// [30, 40, 50]
```

`filter(p)` retourne une fonction `(arr) => arr.filter(p)` — **exactement le shape attendu par `pipe`** (une fonction unaire). Sans currying, `filter(p, arr)` ne composerait pas.

### Mauvaise pratique : currier par dogme

```typescript
// ❌ Aucune préapplication réelle, juste plus dur à lire
const greet = (greeting: string) => (firstName: string) => (lastName: string) =>
  `${greeting}, ${firstName} ${lastName}`

greet("Hello")("Alice")("Smith")
// vs (greeting, firstName, lastName) => `${greeting}, ${firstName} ${lastName}`
```

Si tu n'utilises **jamais** la version partielle, le currying ne fait que parasiter la signature et la complétion IDE.

### Mauvaise pratique : currier des fonctions qui ont des effets de bord

```typescript
// ❌ Confusion sur le moment où l'effet se produit
const log = (msg: string) => (extra: string) => {
  console.log(`[${new Date()}] ${msg} ${extra}`)
}

const logTagged = log("user-action")  // ← rien ne s'exécute
logTagged("login")                     // ← l'effet se produit ICI
```

Currier une fonction **avec effet** rend le moment d'exécution non-évident. Pour les effets, garde une signature classique ou utilise un type explicitement paresseux (Task, Effect).

### `Function.prototype.bind` ≈ currying partiel

```typescript
function add(a: number, b: number, c: number) { return a + b + c }
const addFive = add.bind(null, 5)
addFive(2, 3)  // 10
```

`bind` permet une **préapplication "à l'ancienne"**, mais perd les types et nécessite un `this` (souvent `null`). En 2026, on préfère les arrow functions ou `curry` typé.

## Exemple concret

### Cas réel : middleware Express-like

```typescript
type Req = { headers: Record<string, string> }
type Res = { status: (n: number) => Res; json: (x: unknown) => void }
type Handler = (req: Req, res: Res) => void

// Middleware curryé : config (role attendu) → handler enrichi
const requireRole = (role: string) => (handler: Handler): Handler =>
  (req, res) => {
    if (req.headers["x-role"] !== role) return res.status(403).json({ error: "forbidden" })
    handler(req, res)
  }

const requireAdmin = requireRole("admin")
const requireUser  = requireRole("user")

const adminHandler = requireAdmin((req, res) => res.json({ ok: true }))
const userHandler  = requireUser((req, res) => res.json({ ok: true }))
```

C'est exactement le style des **HOCs React** (`withAuth(Component)`) et des middlewares NestJS guards. La forme curryée rend la composition propre.

### Cas réel : Effect-TS

```typescript
import { Effect, pipe } from "effect"

// Toutes les API Effect sont curryées en data-last
const result = pipe(
  Effect.succeed(5),
  Effect.map(n => n * 2),                // Effect.map(f) puis appliqué à l'effect
  Effect.flatMap(n => Effect.succeed(n + 1)),
)
```

`Effect.map(f)` renvoie une fonction `(eff) => Effect`, ce qui permet `pipe(eff, Effect.map(f))`. C'est **la** raison pour laquelle Effect a tout curryé.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-composition-de-fonctions-chaine-des-transformations-en-pipeline" data-wiki-title="Concept - La composition de fonctions chaîne des transformations en pipeline" data-wiki-preview="**Composer**, c'est combiner deux ou plusieurs fonctions de sorte que la **sortie de l'une devienne l'entrée de la suivante** — `compose(f, g)(x) = f(g(x))` ou plus lisiblement `pipe(x, g, f)` — afin de modéliser un programme comme un **pip…">Concept - La composition de fonctions chaîne des transformations en pipeline</a> *(currying et composition sont la paire fondatrice de la FP)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(currying = closures imbriquées)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(Effect est entièrement curryé en data-last)*

**Prérequis** :
- Notions de fonction d'ordre supérieur (passer une fonction en argument)
- Closures

**S'oppose à / à comparer avec** :
- **Variadique** : `f(...args)` — pratique mais pas composable
- **Default arguments** : `f(a, b = 10)` — alternative légère à la préapplication
- **Builder pattern OO** : `builder.with(a).with(b).build()` — équivalent verbeux en POO

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime" data-wiki-title="JavaScript — paradigmes fonctionnels et mécanismes runtime" data-wiki-preview="1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP / pipeline, dangereux en code applicatif (illisible si abusé). 2. **Composition** chaîne des fonctions pures `g(f(x))` — la base du style &quot;data → pipeline&quot; (RxJS, Effect,…">JavaScript — paradigmes fonctionnels et mécanismes runtime</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>
<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

