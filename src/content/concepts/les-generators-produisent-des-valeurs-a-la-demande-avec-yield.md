---
created: '2026-04-27T06:39:51.608Z'
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - Les generators produisent des valeurs à la demande avec yield
slug: les-generators-produisent-des-valeurs-a-la-demande-avec-yield
excerpt: >-
  Les generators sont la fondation de tout ce qui est "paresseux" en JS : -
  `for..of`, spread `[...x]`, déstructuration : passent par le **protocole
  iterator** - **Async generators** (`async function*`) : pagination d'API,
  streams Node - **Effect-TS `Effect.gen`** : utilise `yield*
oneLiner: >-
  Une fonction **generator** (`function*`) produit une suite de valeurs
  **paresseusement** : chaque `yield` met l'exécution en pause et la reprend au
  prochain `next()`, ce qui permet de modéliser des séquences potentiellement
  **infinies**, des **streams**, et des **co-routines** sans threads.
related:
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - frontend
backlinks:
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - architecture-fondamentaux
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Une fonction **generator** (`function*`) produit une suite de valeurs **paresseusement** : chaque `yield` met l'exécution en pause et la reprend au prochain `next()`, ce qui permet de modéliser des séquences potentiellement **infinies**, des **streams**, et des **co-routines** sans threads.

## Contexte / pourquoi ça compte

Les generators sont la fondation de tout ce qui est "paresseux" en JS :
- `for..of`, spread `[...x]`, déstructuration : passent par le **protocole iterator**
- **Async generators** (`async function*`) : pagination d'API, streams Node
- **Effect-TS `Effect.gen`** : utilise `yield*` pour simuler `await` sur des Effects
- **Redux-Saga** : co-routines pour effets de bord
- **Lodash _(lazy)_, RxJS** : abstractions construites au-dessus

Comprendre le mécanisme te permet de **modéliser des séquences infinies** (streams, paginations, recherches) que tu ne pourrais pas exprimer avec des arrays.

## Détails / mécanisme

### Le protocole iterator

Un objet est **iterable** s'il a une méthode `[Symbol.iterator]()` qui retourne un **iterator** : un objet avec `next()` qui renvoie `{ value, done }`.

```typescript
const iterable = {
  [Symbol.iterator]() {
    let i = 0
    return {
      next() {
        return i < 3
          ? { value: i++, done: false }
          : { value: undefined, done: true }
      }
    }
  }
}

for (const x of iterable) console.log(x)  // 0, 1, 2
```

C'est verbeux. Les **generators** font la même chose en moins de code :

```typescript
function* gen() {
  yield 0
  yield 1
  yield 2
}

for (const x of gen()) console.log(x)  // 0, 1, 2
```

`function*` retourne un objet qui est **à la fois iterable ET iterator**. `yield` met la fonction en pause et retourne la valeur ; le prochain `next()` reprend après le `yield`.

### `yield*` — délégation

```typescript
function* inner() { yield 1; yield 2 }
function* outer() {
  yield 0
  yield* inner()   // délègue à inner — émet 1, 2
  yield 3
}

[...outer()]  // [0, 1, 2, 3]
```

`yield*` est utile pour **factoriser** des sous-séquences ou parcourir récursivement (arbres).

### Bonne pratique : streams infinis

```typescript
// ✅ Stream paresseux infini
function* naturals() {
  let n = 1
  while (true) yield n++
}

function* take<T>(it: Iterable<T>, n: number) {
  let i = 0
  for (const x of it) {
    if (i++ >= n) return
    yield x
  }
}

[...take(naturals(), 5)]  // [1, 2, 3, 4, 5]
```

Sans generator, comment écrire `naturals()` ? Tu ne peux pas — un array infini explose la heap. Les generators **représentent l'intention** (la séquence) sans la matérialiser.

### Bonne pratique : parcours d'arbre

```typescript
type Tree<T> = { value: T; children: Tree<T>[] }

function* dfs<T>(t: Tree<T>): Generator<T> {
  yield t.value
  for (const c of t.children) yield* dfs(c)
}

const tree: Tree<number> = {
  value: 1,
  children: [
    { value: 2, children: [{ value: 4, children: [] }] },
    { value: 3, children: [] },
  ],
}

[...dfs(tree)]  // [1, 2, 4, 3]
```

Le code se lit comme la définition mathématique du DFS : "émet la racine puis récursivement les enfants". Plus court qu'une stack manuelle.

### Bonne pratique : async generators pour la pagination

```typescript
// ✅ Pagination paresseuse — on ne charge la page suivante qu'à la demande
async function* fetchPages(url: string) {
  let next: string | null = url
  while (next) {
    const res = await fetch(next)
    const data = await res.json()
    yield data.items
    next = data.nextUrl
  }
}

for await (const items of fetchPages("/api/users")) {
  if (items.some(isWhatIWant)) break  // ← on stoppe sans charger les pages restantes
}
```

Sans async generator, tu chargerais soit toutes les pages d'un coup (gaspillage), soit tu écrirais un état mutable manuel (`let next = url; while (next) { ... }`).

### Bonne pratique : Effect-TS (`Effect.gen`)

```typescript
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const user = yield* fetchUser("123")
  const posts = yield* fetchPosts(user.id)
  return { user, posts }
})
```

`yield*` ici **simule `await`** : il extrait la valeur d'un `Effect`. Cette syntaxe rend Effect aussi lisible qu'`async/await`, alors qu'on est dans un système beaucoup plus puissant (DI + erreurs typées).

### Mauvaise pratique : générer une petite collection finie

```typescript
// ❌ Aucun bénéfice — un .map suffit
function* doubled(arr: number[]) {
  for (const x of arr) yield x * 2
}
[...doubled([1, 2, 3])]  // [2, 4, 6]

// ✅ Plus simple
[1, 2, 3].map(x => x * 2)
```

Les generators ont **un coût** (création d'iterator, appels `next()`). Pour des arrays finis qui rentrent en mémoire, les méthodes natives sont plus rapides et plus lisibles.

### Mauvaise pratique : oublier qu'un generator s'épuise

```typescript
// ❌ Bug subtil
function* range(n: number) { for (let i = 0; i < n; i++) yield i }

const g = range(3)
const first = [...g]   // [0, 1, 2]
const second = [...g]  // []  ← l'iterator est épuisé !
```

Un generator object est **à usage unique**. Si tu dois itérer plusieurs fois, refais-en un, ou matérialise en array si la collection est petite.

### `yield` accepte des valeurs en retour

```typescript
function* dialogue() {
  const name = yield "Comment t'appelles-tu ?"  // ← yield est une expression
  yield `Salut ${name}`
}

const g = dialogue()
console.log(g.next().value)        // "Comment t'appelles-tu ?"
console.log(g.next("Alice").value) // "Salut Alice" — "Alice" devient la valeur de yield
```

Cette **bidirectionnalité** est ce qui permet à Redux-Saga / Effect d'injecter le résultat d'un effet dans la suite du generator. C'est la magie derrière `Effect.gen`.

## Exemple concret

### Cas réel : pipeline lazy de transformation

```typescript
function* map<A, B>(it: Iterable<A>, f: (a: A) => B): Generator<B> {
  for (const x of it) yield f(x)
}

function* filter<A>(it: Iterable<A>, p: (a: A) => boolean): Generator<A> {
  for (const x of it) if (p(x)) yield x
}

function* take<A>(it: Iterable<A>, n: number): Generator<A> {
  let i = 0
  for (const x of it) {
    if (i++ >= n) return
    yield x
  }
}

// Pipeline lazy : on ne calcule rien tant qu'on ne consomme pas
const result = [...take(filter(map(naturals(), n => n * n), n => n % 2 === 0), 5)]
// [4, 16, 36, 64, 100] — les 5 premiers carrés pairs
```

Comparé à `[...naturals()].map(...).filter(...).slice(0, 5)` — qui ne marcherait jamais (array infini) — le pipeline lazy fonctionne car chaque étape ne tire que ce dont elle a besoin.

C'est le principe des **Iterator Helpers** (TC39 Stage 4 en 2026) :

```typescript
// Bientôt natif !
const result = naturals()
  .map(n => n * n)
  .filter(n => n % 2 === 0)
  .take(5)
  .toArray()
```

### Cas réel : reading binary stream

```typescript
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) return
    yield value
  }
}

const res = await fetch("/big-file.bin")
for await (const chunk of readChunks(res.body!)) {
  processChunk(chunk)  // chunk par chunk, pas tout en mémoire
}
```

Streaming d'un fichier de plusieurs GB sans saturer la RAM. Impossible sans async generators.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-composition-de-fonctions-chaine-des-transformations-en-pipeline" data-wiki-title="Concept - La composition de fonctions chaîne des transformations en pipeline" data-wiki-preview="**Composer**, c'est combiner deux ou plusieurs fonctions de sorte que la **sortie de l'une devienne l'entrée de la suivante** — `compose(f, g)(x) = f(g(x))` ou plus lisiblement `pipe(x, g, f)` — afin de modéliser un programme comme un **pip…">Concept - La composition de fonctions chaîne des transformations en pipeline</a> *(les generators sont composables — map/filter/take en lazy)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(Effect.gen utilise yield* pour la syntaxe await-like)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a> *(un generator est un thunk multi-valeurs paresseux)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks" data-wiki-title="Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks" data-wiki-preview="L'**event loop JS** alterne : exécuter le code synchrone jusqu'à pile vide, **vider toute la microtask queue** (Promises, `queueMicrotask`), prendre **une seule** macrotask (`setTimeout`, événements DOM, I/O), puis recommencer — c'est cette…">Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks</a> *(async generators consomment des promises = microtasks)*

**Prérequis** :
- Fonctions, callbacks
- Promises et async/await (pour les async generators)

**S'oppose à / à comparer avec** :
- **Arrays** : matérialisés en mémoire, finis, multi-passes
- **Observables (RxJS)** : push-based vs generators pull-based ; multi-subscriber vs single-shot
- **Coroutines (Lua, Python)** : même concept, generators sont les coroutines de JS

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime" data-wiki-title="JavaScript — paradigmes fonctionnels et mécanismes runtime" data-wiki-preview="1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP / pipeline, dangereux en code applicatif (illisible si abusé). 2. **Composition** chaîne des fonctions pures `g(f(x))` — la base du style &quot;data → pipeline&quot; (RxJS, Effect,…">JavaScript — paradigmes fonctionnels et mécanismes runtime</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

