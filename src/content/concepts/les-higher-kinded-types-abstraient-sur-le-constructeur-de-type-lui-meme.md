---
created: 2026-04-27T00:00:00.000Z
domain: frontend
level: advanced
tags:
  - type/concept
  - domain/frontend
  - level/advanced
title: >-
  Concept - Les Higher-Kinded Types abstraient sur le constructeur de type
  lui-même
slug: les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
excerpt: >-
  Tu n'auras **probablement jamais besoin d'implémenter** des HKT. Mais
  comprendre le concept te permet : - De **lire** les libs FP modernes (Effect,
  fp-ts) sans rester bloqué sur les abstractions - De saisir **pourquoi** une
  librairie comme Effect peut écrire `Effect.map`, `Option
oneLiner: >-
  Un **Higher-Kinded Type (HKT)** est un type qui prend en argument **un autre
  constructeur de type** plutôt qu'un type concret — `F<_>` au lieu de `T` — ce
  qui permet de définir des abstractions comme `Functor<F>` ou `Monad<F>` qui
  marchent pour `Array`, `Promise`, `Option`, `Effect` indifféremment ;
  **TypeScript ne supporte pas les HKT nativement** mais des libs comme
  **fp-ts** et **Effect** les **simulent**.
related:
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - frontend
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - architecture-fondamentaux
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Un **Higher-Kinded Type (HKT)** est un type qui prend en argument **un autre constructeur de type** plutôt qu'un type concret — `F<_>` au lieu de `T` — ce qui permet de définir des abstractions comme `Functor<F>` ou `Monad<F>` qui marchent pour `Array`, `Promise`, `Option`, `Effect` indifféremment ; **TypeScript ne supporte pas les HKT nativement** mais des libs comme **fp-ts** et **Effect** les **simulent**.

## Contexte / pourquoi ça compte

Tu n'auras **probablement jamais besoin d'implémenter** des HKT. Mais comprendre le concept te permet :
- De **lire** les libs FP modernes (Effect, fp-ts) sans rester bloqué sur les abstractions
- De saisir **pourquoi** une librairie comme Effect peut écrire `Effect.map`, `Option.map`, `Either.map` avec la même sémantique
- D'éviter de **réimplémenter** des typeclasses à la main dans ton projet
- De comprendre la limitation actuelle de TS et l'issue [#1213](https://github.com/microsoft/TypeScript/issues/1213) qui bloque depuis 2014

## Détails / mécanisme

### Le rappel : kinds (sortes)

En théorie des types, un **kind** est le "type d'un type" :
- `string`, `number`, `boolean`, `User` ont le kind `*` (concret)
- `Array<_>`, `Option<_>`, `Promise<_>` ont le kind `* -> *` (prennent un type, donnent un type)
- `Map<_, _>` a le kind `* -> * -> *` (prennent deux types)

Un **Higher-Kinded Type** est un type qui prend en paramètre un type d'ordre supérieur — par exemple `F<_>` qui doit être un constructeur de type comme Array.

### Le problème en TS

Tu veux écrire un `map` générique qui marche pour n'importe quel container :

```typescript
// On voudrait écrire (syntaxe imaginaire)
function map<F<_>, A, B>(fa: F<A>, f: (a: A) => B): F<B>

map(arr, n => n + 1)              // F = Array
map(promise, n => n + 1)          // F = Promise
map(option, n => n + 1)           // F = Option
```

**Pas possible en TS natif** — la syntaxe `F<_>` n'existe pas.

Tu dois donc **dupliquer** :

```typescript
function mapArray<A, B>(arr: A[], f: (a: A) => B): B[] { return arr.map(f) }
function mapOption<A, B>(opt: Option<A>, f: (a: A) => B): Option<B> { ... }
function mapPromise<A, B>(p: Promise<A>, f: (a: A) => B): Promise<B> { return p.then(f) }
// ...
```

### Pourquoi l'abstraire ?

Parce que des **patterns** se répètent : tout container a `map` (Functor), beaucoup ont `flatMap` (Monad), `ap` (Applicative). Une **typeclass** dans Haskell capture ça :

```haskell
class Functor f where
  fmap :: (a -> b) -> f a -> f b
```

Une **fois** définie, elle s'applique à **n'importe quelle** instance. C'est l'équivalent type-level d'une interface en POO.

### Le pattern HKT — simulation par "defunctionalization"

fp-ts a popularisé en TS l'astuce suivante : on **réifie** les constructeurs de types en strings (URI), puis on map l'URI vers le type concret via un registre.

```typescript
// 1. Registre des constructeurs de types
interface URItoKind<A> {
  Array: A[]
  Option: { _tag: "Some"; value: A } | { _tag: "None" }
  Promise: Promise<A>
}

// 2. URI = clés du registre
type URI = keyof URItoKind<unknown>

// 3. Kind<F, A> récupère le type concret depuis l'URI
type Kind<F extends URI, A> = URItoKind<A>[F]

// 4. Maintenant Functor générique
interface Functor<F extends URI> {
  readonly map: <A, B>(fa: Kind<F, A>, f: (a: A) => B) => Kind<F, B>
}

// 5. Implémentations
const arrayFunctor: Functor<"Array"> = {
  map: (arr, f) => arr.map(f)
}

const promiseFunctor: Functor<"Promise"> = {
  map: (p, f) => p.then(f)
}
```

C'est verbeux mais **ça marche**. Tu peux maintenant écrire des fonctions qui prennent un `Functor<F>` quelconque :

```typescript
function double<F extends URI>(F: Functor<F>, fa: Kind<F, number>): Kind<F, number> {
  return F.map(fa, n => n * 2)
}

double(arrayFunctor, [1, 2, 3])                   // [2, 4, 6]
double(promiseFunctor, Promise.resolve(5))         // Promise<10>
```

### Effect-TS — l'approche moderne

Effect utilise un encodage différent basé sur des **type lambdas** (proposition TS qui n'existe pas, simulée par classes). Le résultat est plus ergonomique que fp-ts :

```typescript
import { Effect, Either, Option, pipe } from "effect"

// Toutes ces APIs ont la même forme : on dirait des HKT natifs
pipe(Option.some(5),         Option.map(n => n * 2))
pipe(Either.right(5),        Either.map(n => n * 2))
pipe(Effect.succeed(5),      Effect.map(n => n * 2))
```

L'utilisateur **n'a pas à connaître** l'encodage HKT — Effect l'absorbe. Tu profites de l'abstraction sans payer le coût de typage.

### Bonne pratique : utiliser Effect (ou fp-ts) plutôt qu'implémenter

```typescript
// ✅ Tu profites des typeclasses sans implémenter le pattern
import { pipe, Effect } from "effect"

const program = pipe(
  Effect.succeed(5),
  Effect.map(n => n * 2),
  Effect.flatMap(n => Effect.succeed(n + 1)),
  Effect.tap(n => Effect.log(`got ${n}`)),
)
```

Tu écris du code déclaratif typé sans toucher au moindre URI ou Kind.

### Mauvaise pratique : implémenter HKT toi-même dans un projet applicatif

```typescript
// ❌ Sauf à écrire une lib FP, ne fais pas ça
interface MyURItoKind<A> { ... }
type MyKind<F extends keyof MyURItoKind<any>, A> = MyURItoKind<A>[F]
interface MyFunctor<F extends keyof MyURItoKind<any>> { ... }
// Réinvente fp-ts en moins bien
```

Le ROI est nul. Tu vas combattre le compilateur, écrire des erreurs cryptiques pour ton équipe, et finir par tout réécrire en utilisant Effect quand même.

### Bonne pratique : reconnaître les HKT dans une lib

Quand tu lis `Effect.gen`, `Option.flatMap`, `Either.bimap`, sache que **derrière** il y a un encodage HKT. Tu n'as pas à le déchiffrer pour utiliser la lib — il suffit de savoir que **ces fonctions partagent une structure** parce qu'elles sont des **instances** d'une typeclass.

```typescript
// Tu écris ça :
pipe(opt, Option.map(f), Option.flatMap(g))

// fp-ts/Effect appelle ça en interne :
Functor<"Option">.map(opt, f)   // typeclass Functor
Monad<"Option">.flatMap(_, g)   // typeclass Monad
```

C'est juste de la **généricité supplémentaire**.

### Mauvaise pratique : abstraire sans typeclass quand ce serait approprié

```typescript
// ❌ Recopier le même map pour 5 types
function mapArray<A, B>(arr: A[], f: (a: A) => B): B[] { ... }
function mapPromise<A, B>(p: Promise<A>, f: (a: A) => B): Promise<B> { ... }
function mapResult<A, B, E>(r: Result<A, E>, f: (a: A) => B): Result<B, E> { ... }
function mapOption<A, B>(o: Option<A>, f: (a: A) => B): Option<B> { ... }
```

Si tu te retrouves à écrire des `mapXXX` partout, c'est le signal qu'**Effect ou fp-ts t'aiderait** : leurs `Effect.map`, `Promise.prototype.then`, `Option.map` sont déjà tous instances du même pattern.

### TS aura-t-il des HKT natifs un jour ?

[Issue #1213 sur GitHub](https://github.com/microsoft/TypeScript/issues/1213), ouverte en **2014**, toujours pas implémentée fin 2025. La proposition la plus avancée est les **type lambdas** :

```typescript
// Syntaxe imaginaire (pas implémenté)
function map<F = <_> extends Container<_>, A, B>(fa: F<A>, f: (a: A) => B): F<B>
```

L'équipe TS a choisi de **ne pas** prioriser ça — la complexité de l'inférence est massive, et les libs (fp-ts, Effect) ont montré qu'on peut s'en passer.

### Comparaison avec d'autres langages

| Langage | HKT natifs ? |
|---|---|
| **Haskell** | ✅ premier-class, base du langage |
| **Scala** | ✅ via type lambdas |
| **Rust** | ❌ pas vraiment (GATs partiellement, mais pas HKT) |
| **Java** | ❌ (workarounds via interfaces) |
| **Kotlin** | ❌ (Arrow lib les simule) |
| **TypeScript** | ❌ (fp-ts, Effect les simulent) |
| **OCaml** | ✅ via foncteurs |

Les HKT sont un **luxe** des langages typés statiques fortement orientés FP. Pas mainstream, mais puissants.

## Exemple concret

### Cas réel : Effect.gen — la même syntaxe pour tout F

```typescript
import { Effect, Option, Either } from "effect"

// Ces 3 programmes ont la MÊME structure, juste F qui change

const programEffect = Effect.gen(function* () {
  const a = yield* Effect.succeed(1)
  const b = yield* Effect.succeed(2)
  return a + b
})

const programOption = Option.gen(function* () {
  const a = yield* Option.some(1)
  const b = yield* Option.some(2)
  return a + b
})

const programEither = Either.gen(function* () {
  const a = yield* Either.right(1)
  const b = yield* Either.right(2)
  return a + b
})
```

Le **même pattern** marche pour 3 types différents parce qu'ils sont tous des **monades** (un HKT particulier qui supporte `flatMap` + `succeed`).

### Cas réel : fp-ts traverse

```typescript
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/function"

// traverse "inverse" la nesting : Option<Array<A>> ← Array<Option<A>>
const result = pipe(
  [O.some(1), O.some(2), O.some(3)],
  A.traverse(O.Applicative)(o => o)
)
// O.some([1, 2, 3])

// Si UN seul est None, le tout est None
const fail = pipe(
  [O.some(1), O.none, O.some(3)],
  A.traverse(O.Applicative)(o => o)
)
// O.none
```

`traverse` est **générique** sur l'`Applicative<F>` (un autre HKT). Tu lui passes `Option`, `Either`, `Effect` — ça marche.

### Cas réel : générique Repository pattern

```typescript
// On voudrait écrire ça
interface Repository<F<_>, T> {
  findById(id: string): F<T | null>
  save(item: T): F<void>
}

// Implémentations possibles :
class SyncRepo<T> implements Repository<Identity, T> { ... }
class AsyncRepo<T> implements Repository<Promise, T> { ... }
class EffectRepo<T> implements Repository<Effect, T> { ... }
```

Sans HKT, tu écris **trois interfaces** dupliquées. Avec HKT (simulé), une seule. C'est le genre d'abstraction que **fp-ts** rend possible.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques" data-wiki-title="Concept - La variance décrit comment les sous-types se propagent dans les génériques" data-wiki-preview="La **variance** est la règle qui décide, **quand `Cat &lt;: Animal`, si `F&lt;Cat&gt;` est un sous-type de `F&lt;Animal&gt;`** — selon que `T` est utilisé en **sortie** (covariant), en **entrée** (contravariant) ou aux deux (invariant).">Concept - La variance décrit comment les sous-types se propagent dans les génériques</a> *(les HKT déclarent les variances de leurs paramètres)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types" data-wiki-title="Concept - Les types conditionnels font des branchements dans le système de types" data-wiki-preview="Un **type conditionnel** s'écrit `T extends U ? X : Y` — c'est un **if/else exécuté par le compilateur** sur les types — et combiné à `infer` pour extraire des sous-types, il forme la base de quasi toutes les **utility types** modernes (`Re…">Concept - Les types conditionnels font des branchements dans le système de types</a> *(le pattern HKT utilise massivement les conditionnels)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(Effect est l'expression moderne des HKT en TS)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-composition-de-fonctions-chaine-des-transformations-en-pipeline" data-wiki-title="Concept - La composition de fonctions chaîne des transformations en pipeline" data-wiki-preview="**Composer**, c'est combiner deux ou plusieurs fonctions de sorte que la **sortie de l'une devienne l'entrée de la suivante** — `compose(f, g)(x) = f(g(x))` ou plus lisiblement `pipe(x, g, f)` — afin de modéliser un programme comme un **pip…">Concept - La composition de fonctions chaîne des transformations en pipeline</a> *(les HKT donnent les briques de la composition générique : Functor, Monad)*

**Prérequis** :
- Génériques TS (`<T>`)
- Conditional types et infer
- Notion de Functor / Monad (intuition au moins)

**S'oppose à / à comparer avec** :
- **Generics simples** (`<T>`) : un seul kind possible, pas d'abstraction sur le constructeur
- **Interfaces avec méthodes** : équivalent OO mais sans la généricité sur F
- **Macros / metaprogramming** : approche orthogonale (générer du code) vs HKT (abstraire au type)

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-typescript-types-avances-de-la-variance-aux-hkt" data-wiki-title="TypeScript types avancés — de la variance aux Higher-Kinded Types" data-wiki-preview="1. **Variance** : si `Cat &lt;: Animal`, est-ce que `Container&lt;Cat&gt; &lt;: Container&lt;Animal&gt;` ? Ça dépend de la **position** de `T` (input = contravariant, output = covariant). C'est le coeur des erreurs de génériques. 2. **Types conditionnels** (…">TypeScript types avancés — de la variance aux Higher-Kinded Types</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>
<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

