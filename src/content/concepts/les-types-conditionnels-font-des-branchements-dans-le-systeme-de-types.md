---
created: '2026-04-27T06:47:39.050Z'
domain: frontend
level: advanced
tags:
  - type/concept
  - domain/frontend
  - level/advanced
title: >-
  Concept - Les types conditionnels font des branchements dans le système de
  types
slug: les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
excerpt: >-
  Tu as utilisé `ReturnType<typeof fetchUser>` mille fois sans regarder comment
  c'est défini. Comprendre les conditional types te permet : - D'écrire tes
  propres utilities sans dépendre d'une lib - De saisir la **distribution sur
  les unions** (le piège #1) - De lire des libs comme
oneLiner: >-
  Un **type conditionnel** s'écrit `T extends U ? X : Y` — c'est un **if/else
  exécuté par le compilateur** sur les types — et combiné à `infer` pour
  extraire des sous-types, il forme la base de quasi toutes les **utility
  types** modernes (`ReturnType`, `Awaited`, `Parameters`, `Exclude`, …).
related:
  - les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
  - les-template-literal-types-manipulent-des-chaines-au-niveau-du-type
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - frontend
backlinks:
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
  - les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
  - les-template-literal-types-manipulent-des-chaines-au-niveau-du-type
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Un **type conditionnel** s'écrit `T extends U ? X : Y` — c'est un **if/else exécuté par le compilateur** sur les types — et combiné à `infer` pour extraire des sous-types, il forme la base de quasi toutes les **utility types** modernes (`ReturnType`, `Awaited`, `Parameters`, `Exclude`, …).

## Contexte / pourquoi ça compte

Tu as utilisé `ReturnType<typeof fetchUser>` mille fois sans regarder comment c'est défini. Comprendre les conditional types te permet :
- D'écrire tes propres utilities sans dépendre d'une lib
- De saisir la **distribution sur les unions** (le piège #1)
- De lire des libs comme **Zod**, **tRPC**, **Effect**, **ts-pattern** où le typage repose massivement dessus
- De débugger les `Type 'X' is not assignable to type 'Y'` quand TS distribue dans ton dos

## Détails / mécanisme

### La syntaxe de base

```typescript
type IsString<T> = T extends string ? "yes" : "no"

type A = IsString<"hello">   // "yes"
type B = IsString<42>         // "no"
type C = IsString<string>     // "yes"
```

Lecture : "si `T` est **assignable à** `U`, alors `X`, sinon `Y`."

`extends` ici ne signifie **pas** "hérite de" comme en POO — c'est **"est sous-type de / est assignable à"**.

### `infer` — extraire un sous-type

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type R = ReturnType<() => number>          // number
type S = ReturnType<(x: string) => boolean> // boolean
```

`infer R` introduit une **variable de type** dans la branche vraie. Le compilateur infère `R` à partir du matching.

### Exemples de la lib standard, décomposés

```typescript
// Parameters — extrait le tuple d'args
type Parameters<T> = T extends (...args: infer P) => any ? P : never

type P1 = Parameters<(a: number, b: string) => void>  // [number, string]

// Awaited — déballe les Promises (récursif)
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T

type A1 = Awaited<Promise<Promise<string>>>   // string

// InstanceType — type d'instance d'un constructeur
type InstanceType<T> = T extends new (...args: any[]) => infer I ? I : never

class Cat { meow() {} }
type C = InstanceType<typeof Cat>   // Cat

// Exclude — retire des membres d'une union
type Exclude<T, U> = T extends U ? never : T

type E = Exclude<"a" | "b" | "c", "b">   // "a" | "c"

// Extract — garde uniquement les membres
type Extract<T, U> = T extends U ? T : never

type X = Extract<"a" | "b" | "c", "a" | "b">   // "a" | "b"
```

### LE piège : la distribution sur les unions

Quand `T` est **un paramètre de type "nu"** (pas encapsulé) et que `T` est une **union**, le conditionnel **distribue** sur chaque membre :

```typescript
type ToArray<T> = T extends any ? T[] : never

type R = ToArray<string | number>
// = ToArray<string> | ToArray<number>
// = string[] | number[]
```

C'est **rarement ce que tu veux** quand tu écris ton premier conditionnel. Pour **désactiver** la distribution, encadrer `T` par `[T]` :

```typescript
type ToArrayNoDist<T> = [T] extends [any] ? T[] : never

type R2 = ToArrayNoDist<string | number>   // (string | number)[]
```

L'astuce `[T]` crée un **tuple** de longueur 1, ce qui empêche la distribution (les tuples ne distribuent pas).

### La distribution est utile aussi

```typescript
// Filtrer les types nullables d'une union
type NonNullable<T> = T extends null | undefined ? never : T

type N = NonNullable<string | null | undefined>   // string
```

`T extends null | undefined` distribue : pour chaque membre, on teste, on remplace par `never` ou on garde. `never` dans une union disparaît, donc on filtre.

### Bonne pratique : utilities ciblées et nommées

```typescript
// ✅ Construire des utilities composables et nommées
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

type Methods<T> = Pick<T, FunctionKeys<T>>

class User {
  name: string = ""
  age: number = 0
  greet() {}
  birthday() {}
}

type UserMethods = Methods<User>   // { greet(): void; birthday(): void }
```

Combine `mapped types` + `conditional types` pour faire du tri sélectif sur les clés.

### Mauvaise pratique : conditionnels imbriqués profonds

```typescript
// ❌ Difficile à lire et à débugger
type Crazy<T> = T extends Array<infer U>
  ? U extends Promise<infer V>
    ? V extends string
      ? "deep string"
      : V extends number
        ? "deep number"
        : never
    : never
  : T extends Promise<infer W>
    ? W extends Array<infer X>
      ? X
      : never
    : never
```

Au-delà de **2-3 niveaux**, factorise :

```typescript
// ✅ Lisible, débuggable
type UnwrapArray<T>   = T extends Array<infer U> ? U : never
type UnwrapPromise<T> = T extends Promise<infer U> ? U : never
type ClassifyPrimitive<T> =
  T extends string ? "deep string" :
  T extends number ? "deep number" :
  never

type Step<T> = T extends Array<infer A>
  ? ClassifyPrimitive<UnwrapPromise<A>>
  : never
```

Avec des types nommés, l'IDE peut te montrer chaque étape au survol.

### `infer` avec contraintes (TS 4.7+)

```typescript
type FirstString<T extends any[]> = T extends [infer F extends string, ...any] ? F : never

type A = FirstString<["hello", 1, 2]>   // "hello"
type B = FirstString<[1, "hello"]>      // never (1 n'est pas string)
```

Tu peux **contraindre** `infer F` à un sous-type. Évite des `infer F` qui matchent n'importe quoi.

### Bonne pratique : guards typés

```typescript
type Brand<T, B extends string> = T & { __brand: B }
type UserId = Brand<string, "UserId">
type PostId = Brand<string, "PostId">

type IsUserId<T> = T extends UserId ? true : false

type X = IsUserId<UserId>   // true
type Y = IsUserId<PostId>   // false (le brand diffère)
```

Tu peux faire de la **discrimination structurelle** au niveau type.

### Mauvaise pratique : abuser pour faire de la "logique"

```typescript
// ❌ Si tu veux faire de la "programmation" au niveau type, tu finis par fight le compilo
type Add1<T extends number> = T extends 0 ? 1 : T extends 1 ? 2 : T extends 2 ? 3 : never
// ...va explorer 1000 niveaux. TS plafonne.
```

Le **type-level programming** est puissant mais a des **limites**. Dès que tu te bats contre `Type instantiation is excessively deep`, c'est qu'il faut peut-être faire **autrement** (validation runtime, branded types simples, etc.).

## Exemple concret

### Cas réel : `tRPC` — typage end-to-end

```typescript
// Côté serveur
const appRouter = t.router({
  user: t.router({
    getById: t.procedure.input(z.string()).query(({ input }) => fetchUser(input)),
  }),
})
type AppRouter = typeof appRouter

// Côté client — TYPE EXTRAIT via conditional types
type Client = inferRouterClient<AppRouter>

// Sous le capot, inferRouterClient<R> utilise massivement :
// - extends pour distinguer router vs procedure
// - infer pour extraire input / output
// - mapped types pour reconstruire les méthodes
```

Sans conditional types, tRPC n'aurait pas son inférence "magique" client-serveur.

### Cas réel : `Zod` — typer la validation

```typescript
import { z } from "zod"

const UserSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
})

type User = z.infer<typeof UserSchema>
// { name: string; age?: number | undefined }
```

`z.infer<S>` est un conditional type qui inspecte le shape de `S` (`ZodObject`, `ZodArray`, `ZodOptional`, …) et reconstruit le type TS. Toute la lib Zod repose sur ça.

### Cas réel : utility métier dans un projet NestJS

```typescript
// Récupérer les types d'erreur possibles d'un service
type ServiceErrors<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<infer R>
    ? R extends { error: infer E } ? E : never
    : never
}[keyof T]

class UserService {
  async findById(id: string): Promise<{ data: User } | { error: "NotFound" }> { ... }
  async create(data: Dto): Promise<{ data: User } | { error: "Validation" | "Conflict" }> { ... }
}

type Errors = ServiceErrors<UserService>   // "NotFound" | "Validation" | "Conflict"
```

Tu reconstruis automatiquement la liste des erreurs métier d'un service. Si tu ajoutes une nouvelle méthode avec `error: "Forbidden"`, le type s'étend automatiquement.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type" data-wiki-title="Concept - Les mapped types transforment chaque clé d'un type en un nouveau type" data-wiki-preview="Un **mapped type** s'écrit `{ [K in keyof T]: ... }` — il **itère sur toutes les clés** de `T` pour produire un nouveau type — avec la possibilité d'ajouter ou retirer `?` (optionalité) et `readonly`, et même de **renommer** la clé via `as`…">Concept - Les mapped types transforment chaque clé d'un type en un nouveau type</a> *(les mapped types peuvent contenir des conditionnels avec `as`)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-template-literal-types-manipulent-des-chaines-au-niveau-du-type" data-wiki-title="Concept - Les template literal types manipulent des chaînes au niveau du type" data-wiki-preview="Un **template literal type** est une chaîne littérale interpolée **au niveau type** — `` `Hello, ${string}` `` — qui peut contraindre des formats, **distribuer** sur des unions, et **parser des chaînes** via `infer` pour reconstruire des ty…">Concept - Les template literal types manipulent des chaînes au niveau du type</a> *(infer + template literal = parser des strings)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques" data-wiki-title="Concept - La variance décrit comment les sous-types se propagent dans les génériques" data-wiki-preview="La **variance** est la règle qui décide, **quand `Cat &lt;: Animal`, si `F&lt;Cat&gt;` est un sous-type de `F&lt;Animal&gt;`** — selon que `T` est utilisé en **sortie** (covariant), en **entrée** (contravariant) ou aux deux (invariant).">Concept - La variance décrit comment les sous-types se propagent dans les génériques</a> *(infer respecte la variance des positions)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme" data-wiki-title="Concept - Les Higher-Kinded Types abstraient sur le constructeur de type lui-même" data-wiki-preview="Un **Higher-Kinded Type (HKT)** est un type qui prend en argument **un autre constructeur de type** plutôt qu'un type concret — `F&lt;_&gt;` au lieu de `T` — ce qui permet de définir des abstractions comme `Functor&lt;F&gt;` ou `Monad&lt;F&gt;` qui marchent…">Concept - Les Higher-Kinded Types abstraient sur le constructeur de type lui-même</a> *(les conditionnels servent à manipuler les "kinds" en TS)*

**Prérequis** :
- Génériques TS
- Notion de sous-typage / `extends`

**S'oppose à / à comparer avec** :
- **Pattern matching runtime** (ts-pattern) : équivalent runtime, opère sur les valeurs
- **Type guards** (`x is User`) : équivalent runtime + narrowing au site d'appel
- **Macros / metaprogramming** (Rust, Lisp) : génèrent du code à la compile, plus puissant mais plus lourd

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-typescript-types-avances-de-la-variance-aux-hkt" data-wiki-title="TypeScript types avancés — de la variance aux Higher-Kinded Types" data-wiki-preview="1. **Variance** : si `Cat &lt;: Animal`, est-ce que `Container&lt;Cat&gt; &lt;: Container&lt;Animal&gt;` ? Ça dépend de la **position** de `T` (input = contravariant, output = covariant). C'est le coeur des erreurs de génériques. 2. **Types conditionnels** (…">TypeScript types avancés — de la variance aux Higher-Kinded Types</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

