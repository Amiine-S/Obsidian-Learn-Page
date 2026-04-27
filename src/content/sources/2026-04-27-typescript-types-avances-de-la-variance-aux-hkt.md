---
title: TypeScript types avancés — de la variance aux Higher-Kinded Types
author: Claude (synthèse)
digested: 2026-04-27T00:00:00.000Z
format: doc
domain: frontend
level: advanced
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/advanced
slug: 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
excerpt: >-
  1. **Variance** : si `Cat <: Animal`, est-ce que `Container<Cat> <:
  Container<Animal>` ? Ça dépend de la **position** de `T` (input =
  contravariant, output = covariant). C'est le coeur des erreurs de génériques.
  2. **Types conditionnels** (`T extends U ? X : Y`) : du **if/else**
related:
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
  - les-template-literal-types-manipulent-des-chaines-au-niveau-du-type
  - typescript-sacrifie-le-soundness-pour-la-praticite
  - les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
  - frontend
  - architecture-fondamentaux
backlinks:
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
  - les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
  - les-template-literal-types-manipulent-des-chaines-au-niveau-du-type
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - typescript-sacrifie-le-soundness-pour-la-praticite
topics:
  - frontend
  - typescript
---
## Pourquoi cette source

> Tu utilises TypeScript tous les jours en NestJS / AdonisJS / React, mais le **système de types** lui-même contient des concepts que la majorité des devs TS connaissent par symptômes plutôt que par mécanisme. Comprendre **variance**, **types conditionnels**, **mapped types**, **template literal types**, le compromis **soundness vs praticité**, et la notion de **HKT** te permet de lire les libs comme Effect, Zod, tRPC, ts-pattern — et de débugger les erreurs cryptiques (`Type 'X' is not assignable to type 'Y'`) en sachant **pourquoi**.

## Résumé en 5 lignes

1. **Variance** : si `Cat <: Animal`, est-ce que `Container<Cat> <: Container<Animal>` ? Ça dépend de la **position** de `T` (input = contravariant, output = covariant). C'est le coeur des erreurs de génériques.
2. **Types conditionnels** (`T extends U ? X : Y`) : du **if/else** au niveau des types — base de `ReturnType`, `Awaited`, `Exclude` et de la lib utilities.
3. **Mapped types** (`{ [K in keyof T]: ... }`) : transformer chaque clé d'un type — `Partial`, `Required`, `Readonly`, `Pick` reposent dessus. Combinés aux **template literal types**, ils manipulent des chaînes au niveau du type.
4. **Soundness vs praticité** : TS est **délibérément unsound** — `any`, contravariance des paramètres de fonction, types vides — pour rester productif. Comprendre où ça pète te fait éviter les bugs.
5. **Higher-Kinded Types** : abstraire **sur le constructeur de type** lui-même (`F<_>`), comme `Functor<F>` qui marche pour `Array`, `Option`, `Effect`. **Pas natif en TS** — simulé via le pattern HKT (fp-ts, Effect).

---

## 1. Variance — covariance, contravariance, et les bugs qui en découlent

### L'intuition

Tu sais que `Cat <: Animal` (Cat est un sous-type d'Animal). Question : si tu enveloppes ça dans un générique, le sous-typage se propage-t-il ?

```typescript
class Animal { eat() {} }
class Cat extends Animal { meow() {} }

let cats: Cat[]
let animals: Animal[]

animals = cats   // ✅ OK — Array<Cat> <: Array<Animal>
cats = animals   // ❌ Type 'Animal[]' is not assignable to type 'Cat[]'
```

Le sous-typage **se propage** dans `Array` : c'est **covariant**. Mais ce n'est pas universel.

### Les 3 variances

```typescript
type Producer<T> = () => T          // T en position de SORTIE → covariant
type Consumer<T> = (x: T) => void   // T en position d'ENTRÉE → contravariant
type Holder<T> = { get(): T; set(t: T): void }  // T des deux côtés → invariant
```

| Position de T | Variance | Exemple TS |
|---|---|---|
| **Output** (`() => T`) | **Covariante** | `Promise<Cat> <: Promise<Animal>` |
| **Input** (`(t: T) => void`) | **Contravariante** | `(a: Animal) => void <: (c: Cat) => void` |
| **Both** (mutable container) | **Invariante** | `Holder<Cat>` ≠ `Holder<Animal>` (théorie) |

### Le piège classique : les callbacks contravariants

```typescript
type Handler<T> = (event: T) => void

const animalHandler: Handler<Animal> = (a) => a.eat()
const catHandler: Handler<Cat> = (c) => c.meow()

let h: Handler<Cat>
h = animalHandler   // ✅ OK ! Handler<Animal> <: Handler<Cat> (contravariant)
h({ } as Cat)        // animalHandler appelé avec un Cat — OK car Cat <: Animal

h = catHandler      // ✅ OK trivialement
h = (x: any) => {}  // ✅ any contourne tout
```

**Pourquoi `Handler<Animal>` est-il assignable à `Handler<Cat>` ?** Parce qu'un handler qui sait traiter `Animal` traite forcément `Cat` (qui en est un). Le sous-typage **s'inverse** dans la position d'entrée.

### TS et la bivariance des méthodes

Surprise : par défaut, TS traite les **méthodes** comme **bivariantes** (covariantes ET contravariantes). C'est un **trou de soundness** délibéré pour la praticité.

```typescript
type EventMap = {
  click: (e: MouseEvent) => void
}

const map: EventMap = {
  click: (e: KeyboardEvent) => {}  // ⚠️ TS l'accepte par défaut !
}
```

Active `strictFunctionTypes: true` pour forcer la **contravariance correcte** sur les fonctions (mais pas sur les méthodes — c'est explicite). Le mode `strict: true` l'active.

### Annotations explicites en TS 4.7+

```typescript
interface Producer<out T> { get(): T }       // covariant
interface Consumer<in T> { set(x: T): void }  // contravariant
interface Holder<in out T> { get(): T; set(x: T): void }  // invariant
```

TS vérifie que tu utilises bien `T` dans les positions déclarées. C'est précieux dans les libs (Effect, fp-ts).

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques" data-wiki-title="Concept - La variance décrit comment les sous-types se propagent dans les génériques" data-wiki-preview="La **variance** est la règle qui décide, **quand `Cat &lt;: Animal`, si `F&lt;Cat&gt;` est un sous-type de `F&lt;Animal&gt;`** — selon que `T` est utilisé en **sortie** (covariant), en **entrée** (contravariant) ou aux deux (invariant).">Concept - La variance décrit comment les sous-types se propagent dans les génériques</a>

---

## 2. Types conditionnels — if/else dans les types

### La syntaxe

```typescript
type IsString<T> = T extends string ? "yes" : "no"

type A = IsString<"hello">  // "yes"
type B = IsString<42>        // "no"
```

`T extends U ? X : Y` se lit "si `T` est assignable à `U`, alors `X`, sinon `Y`."

### Distribution sur les unions

**Le piège** : si `T` est une union, le conditionnel **distribue** :

```typescript
type ToArray<T> = T extends any ? T[] : never

type R = ToArray<string | number>
// = ToArray<string> | ToArray<number>
// = string[] | number[]
```

Pour **désactiver** la distribution, encadrer par `[T]` :

```typescript
type ToArrayNoDist<T> = [T] extends [any] ? T[] : never
type R2 = ToArrayNoDist<string | number>  // (string | number)[]
```

C'est une nuance **critique** quand tu veux écrire un type sur une union sans la déballer.

### `infer` — extraire des sous-types

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type R = ReturnType<() => number>          // number
type S = ReturnType<(x: string) => boolean> // boolean
```

`infer R` introduit une variable de type **inférée** dans la branche vraie. C'est ce qui permet d'écrire `Awaited`, `Parameters`, `InstanceType`, `ConstructorParameters`, etc.

```typescript
// Awaited unwrap les Promises (récursivement depuis TS 4.5)
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T

type X = Awaited<Promise<Promise<string>>>  // string
```

### Bonne pratique : utilities composées

```typescript
// Extract / Exclude — les briques de base
type Extract<T, U> = T extends U ? T : never
type Exclude<T, U> = T extends U ? never : T

// Construire des utilities métier
type StringKeys<T> = keyof T extends infer K
  ? K extends keyof T
    ? T[K] extends string ? K : never
    : never
  : never

type User = { name: string; age: number; email: string }
type StrKs = StringKeys<User>  // "name" | "email"
```

### Mauvaise pratique : conditionnels imbriqués profonds

```typescript
// ❌ Difficile à lire et à débugger
type DeepThing<T> = T extends Array<infer U>
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

Au-delà de 2-3 niveaux, **factorise** en types intermédiaires :

```typescript
// ✅ Lisible, débuggable
type UnwrapArray<T> = T extends Array<infer U> ? U : never
type UnwrapPromise<T> = T extends Promise<infer U> ? U : never
type Step1<T> = UnwrapPromise<UnwrapArray<T>>
```

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types" data-wiki-title="Concept - Les types conditionnels font des branchements dans le système de types" data-wiki-preview="Un **type conditionnel** s'écrit `T extends U ? X : Y` — c'est un **if/else exécuté par le compilateur** sur les types — et combiné à `infer` pour extraire des sous-types, il forme la base de quasi toutes les **utility types** modernes (`Re…">Concept - Les types conditionnels font des branchements dans le système de types</a>

---

## 3. Mapped types — transformer chaque clé

### La syntaxe

```typescript
type Partial<T> = { [K in keyof T]?: T[K] }

type User = { name: string; age: number }
type PartialUser = Partial<User>
// { name?: string; age?: number }
```

`[K in keyof T]` itère sur toutes les clés de `T`. Tu peux modifier :
- L'**optionnalité** (`?` / `-?`)
- La **mutabilité** (`readonly` / `-readonly`)
- Le **type de la valeur** (`T[K]` ou autre chose)

### Modifiers `+` / `-`

```typescript
type Required<T> = { [K in keyof T]-?: T[K] }       // retire ?
type Mutable<T>  = { -readonly [K in keyof T]: T[K] } // retire readonly
```

Le `-` enlève le modifier. Souvent oublié, très utile.

### Renaming via `as`

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

type User = { name: string; age: number }
type UserGetters = Getters<User>
// { getName: () => string; getAge: () => number }
```

`as` permet de **renommer** les clés en cours de map. Combiné aux **template literal types**, c'est ultra-puissant (cf. ci-dessous).

### Filtrer des clés via `as` + `never`

```typescript
type StringKeys<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

type User = { name: string; age: number; email: string }
type StrUser = StringKeys<User>  // { name: string; email: string }
```

Map une clé vers `never` la **supprime** du type final.

### Bonne pratique : utilities ciblées

```typescript
// ✅ Construire la version "writable" pour un store
type Writable<T> = { -readonly [K in keyof T]: T[K] }

// ✅ Wrapper toutes les valeurs en Promise
type Promised<T> = { [K in keyof T]: Promise<T[K]> }

// ✅ Schema de validation à partir d'un model
type ValidationOf<T> = { [K in keyof T]: (v: unknown) => v is T[K] }
```

### Mauvaise pratique : recréer les utilities natives

```typescript
// ❌ Réinventer la roue
type MyPartial<T> = { [K in keyof T]?: T[K] }

// ✅ Utiliser les utilities natives
type X = Partial<MyType>
```

`Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `NonNullable`, `Parameters`, `ReturnType`, `Awaited` sont **standards**. Réutilise-les.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type" data-wiki-title="Concept - Les mapped types transforment chaque clé d'un type en un nouveau type" data-wiki-preview="Un **mapped type** s'écrit `{ [K in keyof T]: ... }` — il **itère sur toutes les clés** de `T` pour produire un nouveau type — avec la possibilité d'ajouter ou retirer `?` (optionalité) et `readonly`, et même de **renommer** la clé via `as`…">Concept - Les mapped types transforment chaque clé d'un type en un nouveau type</a>

---

## 4. Template literal types — manipuler des chaînes au niveau du type

### La syntaxe

```typescript
type Greeting = `Hello, ${string}`
type Specific = `Hello, ${"Alice" | "Bob"}`
// "Hello, Alice" | "Hello, Bob"
```

Tu peux **interpoler des types string** dans une string littérale au niveau type. La **distribution** sur les unions s'applique.

### Combiner avec `infer`

```typescript
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S]

type R = Split<"a.b.c.d", ".">  // ["a", "b", "c", "d"]
```

Tu peux **parser des chaînes** au niveau du type. C'est ce que font tRPC (parsing de routes), zod (key paths), Effect (services).

### Utilities natives sur les chaînes

```typescript
type A = Uppercase<"hello">     // "HELLO"
type B = Lowercase<"HELLO">     // "hello"
type C = Capitalize<"hello">    // "Hello"
type D = Uncapitalize<"HELLO">  // "hELLO"
```

### Bonne pratique : des routes typées

```typescript
type Method = "GET" | "POST"
type Route = `${Method} /${string}`

const route: Route = "GET /users"   // ✅
const bad: Route = "PATCH /users"   // ❌ erreur compile
```

Tu peux modéliser un router HTTP avec des types qui **rejettent** les routes mal formées au compile-time.

### Bonne pratique : key paths

```typescript
type Path<T, P extends string = ""> = T extends object
  ? { [K in keyof T & string]: P extends "" ? `${K}` | Path<T[K], `${K}`> : `${P}.${K}` | Path<T[K], `${P}.${K}`> }[keyof T & string]
  : never

type User = { name: string; address: { city: string; zip: number } }
type UserPaths = Path<User>
// "name" | "address" | "address.city" | "address.zip"
```

C'est ce qui permet à React Hook Form, Formik, lodash.get/set d'avoir des **paths typés**. Une faute de frappe = erreur compile.

### Mauvaise pratique : tout typer en string littéral

```typescript
// ❌ Combinatoire explosive
type Permission = `${"read" | "write" | "admin"}-${"users" | "posts" | "comments"}-${"v1" | "v2" | "v3"}`
// 27 types — déjà beaucoup. Ajoute des dimensions et tu satures TS.
```

À l'extrême, le compilateur TS plafonne (notamment via `Type instantiation is excessively deep`). Garde l'usage **focalisé** : key paths, routes, formats simples.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-template-literal-types-manipulent-des-chaines-au-niveau-du-type" data-wiki-title="Concept - Les template literal types manipulent des chaînes au niveau du type" data-wiki-preview="Un **template literal type** est une chaîne littérale interpolée **au niveau type** — `` `Hello, ${string}` `` — qui peut contraindre des formats, **distribuer** sur des unions, et **parser des chaînes** via `infer` pour reconstruire des ty…">Concept - Les template literal types manipulent des chaînes au niveau du type</a>

---

## 5. Soundness vs praticité — pourquoi TS ment parfois

### Définition

**Sound** = "si le programme type-check, il ne peut pas avoir de bug de type au runtime."  
**Unsound** = il peut type-check ET planter quand même.

**TypeScript est unsound de manière délibérée**. Quelques exemples :

### `any` désactive tout

```typescript
const x: any = "hello"
const n: number = x        // ✅ TS ne se plaint pas
n.toFixed(2)               // 💥 RuntimeError: x.toFixed is not a function
```

C'est un **escape hatch**. Très pratique en migration JS→TS, mais à éviter en code applicatif.

### Bivariance des méthodes (cf. variance plus haut)

```typescript
type EventMap = { click: (e: MouseEvent) => void }
const m: EventMap = { click: (e: KeyboardEvent) => e.key }
// ✅ TS l'accepte (méthode bivariante)
// 💥 m.click(new MouseEvent(...)) — KeyboardEvent.key est undefined
```

### Mutation d'arrays — l'invariance "trichée"

```typescript
const cats: Cat[] = [new Cat()]
const animals: Animal[] = cats   // ✅ covariant
animals.push(new Dog())           // ✅ TS accepte (Dog <: Animal)
const c: Cat = cats[1]            // ✅ TS le type Cat
c.meow()                          // 💥 RuntimeError — c'est un Dog
```

`Array<Cat>` devrait être **invariant** (parce qu'on peut écrire dedans), mais TS le traite covariant pour ergonomie. Sound: non. Pratique: oui.

### `as` cast — toi, tu mens

```typescript
const x: unknown = "hello"
const n = x as number   // ✅ TS te fait confiance
n.toFixed(2)             // 💥 RuntimeError
```

Le **type assertion** dit "fais-moi confiance" — pas de vérification.

### `Object.keys` retourne `string[]`

```typescript
const u: User = { name: "Alice", age: 30 }
const keys = Object.keys(u)    // string[], pas (keyof User)[]
```

Pourquoi ? Parce qu'au runtime, l'objet peut avoir **plus** de clés que le type ne déclare (un objet `User` peut être un `User & { extra: string }` upcasté). Sound: oui. Frustrant: oui.

### Bonne pratique : connaître les escape hatches dangereux

```typescript
// ⚠️ as est un cast non vérifié — utiliser uniquement si tu CONNAIS la valeur
const data = JSON.parse(input) as User   // ⚠️ rien ne valide

// ✅ Préférer une validation runtime (zod, valibot)
const user = UserSchema.parse(JSON.parse(input))   // throw si invalide
```

### Mauvaise pratique : tout en `any` pour passer

```typescript
// ❌ Désactive le système de types entièrement
function process(data: any) {
  return data.field.subfield    // 💥 si data ne matche pas
}

// ✅ Type d'entrée + validation
function process(data: unknown) {
  const valid = MySchema.parse(data)
  return valid.field.subfield
}
```

Préférer `unknown` à `any` : `unknown` te force à narrow avant usage.

### Le compromis assumé

L'équipe TS a choisi explicitement de prioriser :
- **Adoption** (un dev JS doit pouvoir migrer un fichier sans tout réécrire)
- **Productivité** (les annotations doivent être ergonomiques)
- **Compatibilité JS** (le typage doit refléter la réalité du JS qui est dynamique)

Le prix : quelques unsoundness connus. **Flow** (Facebook) avait choisi l'inverse — soundness max — et a perdu la guerre d'adoption.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/typescript-sacrifie-le-soundness-pour-la-praticite" data-wiki-title="Concept - TypeScript sacrifie le soundness pour la praticité" data-wiki-preview="**Sound** signifie &quot;si le programme type-check, il ne plante pas au runtime sur un type&quot; — TypeScript est **délibérément unsound** : `any`, covariance des arrays, bivariance des méthodes, casts non vérifiés, et plus encore — pour rester **e…">Concept - TypeScript sacrifie le soundness pour la praticité</a>

---

## 6. Higher-Kinded Types — abstraire sur le constructeur

### Le problème

Tu veux écrire un `map` générique qui marche sur `Array`, `Option`, `Promise`, `Effect` :

```typescript
// On voudrait écrire :
function map<F<_>, A, B>(fa: F<A>, f: (a: A) => B): F<B>

// Pas possible — TS n'a pas de syntaxe `F<_>` (HKT natifs)
```

`F` ici serait un **constructeur de type** (ce qu'on appelle un **type kind* d'ordre 2**). TS / JS ne supportent pas ça nativement.

### Pourquoi c'est utile

Une **typeclass** comme `Functor<F>` doit pouvoir parler de "tout `F` qui sait map". Sans HKT, tu dois la dupliquer :

```typescript
interface ArrayFunctor { map<A, B>(arr: A[], f: (a: A) => B): B[] }
interface OptionFunctor { map<A, B>(opt: Option<A>, f: (a: A) => B): Option<B> }
interface PromiseFunctor { map<A, B>(p: Promise<A>, f: (a: A) => B): Promise<B> }
// ...
```

C'est ce qu'on fait en pratique en TS. Mais on aimerait **factoriser**.

### Le pattern HKT (simulation)

fp-ts et Effect simulent les HKT via un truc appelé **"defunctionalization"** :

```typescript
// On déclare un registre de constructeurs
interface URItoKind<A> {
  Array: A[]
  Option: Option<A>
  Promise: Promise<A>
}

type URI = keyof URItoKind<any>           // "Array" | "Option" | "Promise"
type Kind<F extends URI, A> = URItoKind<A>[F]

// Maintenant Functor générique
interface Functor<F extends URI> {
  readonly map: <A, B>(fa: Kind<F, A>, f: (a: A) => B) => Kind<F, B>
}

const arrayFunctor: Functor<"Array"> = {
  map: (arr, f) => arr.map(f)
}
```

C'est verbeux mais ça fonctionne. **fp-ts** a popularisé ça en TS, **Effect** a son propre encodage plus moderne (basé sur les variances déclarées).

### Effect-TS et les HKT modernes

Effect utilise des **types branchés (branded)** et l'inférence pour faire passer la pilule HKT :

```typescript
import { Effect, Either, Option, pipe } from "effect"

// Tous ces .map ont la même signature généralisée
const a = Option.map(Option.some(5), n => n * 2)        // Option<number>
const b = Either.map(Either.right(5), n => n * 2)       // Either<never, number>
const c = Effect.map(Effect.succeed(5), n => n * 2)     // Effect<number>
```

Sous le capot, Effect utilise un système de **type lambdas** (proposition TS qui n'existe toujours pas en natif fin 2025), simulé par des classes/interfaces.

### Bonne pratique : utiliser HKT via Effect ou fp-ts

```typescript
// ✅ Tu profites des HKT sans coder l'encodage toi-même
import { pipe, Effect } from "effect"

const program = pipe(
  Effect.succeed(5),
  Effect.map(n => n * 2),         // map abstract — peu importe le F
  Effect.flatMap(n => Effect.succeed(n + 1)),
)
```

Tu **utilises** l'abstraction sans avoir à écrire `URItoKind`. Effect fait ça en interne.

### Mauvaise pratique : implémenter HKT toi-même dans ton projet applicatif

```typescript
// ❌ Sauf à écrire une lib FP, ne fais pas ça
interface MyHKTRegistry<A> { ... }
// Reasoning : la complexité de typage va exploser pour ZÉRO bénéfice productif
```

Les HKT sont utiles pour **écrire des libs** (Effect, fp-ts). Pour le code applicatif, **utilise les libs** plutôt que de réinventer.

### TS aura-t-il des HKT natifs un jour ?

[Issue TypeScript #1213](https://github.com/microsoft/TypeScript/issues/1213) — ouverte depuis 2014. Pas de mouvement officiel en 2026. La proposition la plus avancée est les **type lambdas** : `<F = <_> extends Container<_>>(...)`. Pour l'instant on simule.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme" data-wiki-title="Concept - Les Higher-Kinded Types abstraient sur le constructeur de type lui-même" data-wiki-preview="Un **Higher-Kinded Type (HKT)** est un type qui prend en argument **un autre constructeur de type** plutôt qu'un type concret — `F&lt;_&gt;` au lieu de `T` — ce qui permet de définir des abstractions comme `Functor&lt;F&gt;` ou `Monad&lt;F&gt;` qui marchent…">Concept - Les Higher-Kinded Types abstraient sur le constructeur de type lui-même</a>

---

## 7. La hiérarchie d'importance

Si tu pratiques ces concepts dans un ordre :

1. **Types conditionnels + `infer`** — base de toute lib TS moderne, tu en croises tous les jours
2. **Mapped types** — pour transformer des shapes ; combinés à template literal pour des paths typés
3. **Variance** — pour comprendre **pourquoi** TS rejette tes assignations de génériques
4. **Soundness vs praticité** — pour ne pas être surpris quand TS te ment ; choisir entre `any`, `unknown`, validation runtime
5. **HKT** — pour **lire** Effect / fp-ts / monadiques. Tu n'as pas à les implémenter

---

## Citations brutes

> *"TypeScript is a great compromise between Java and JavaScript: it allows you to be as wrong as you want, but it also allows you to be as right as you want."* — esprit de l'équipe TS

> *"All non-trivial abstractions, to some degree, are leaky."* — Joel Spolsky (s'applique aux types comme aux abstractions de code)

---

## À explorer ensuite

- **`satisfies` operator** (TS 4.9+) : validation de type sans widening
- **`const` type parameters** (TS 5.0+) : `<const T>` pour préserver les littéraux
- **Branded types / nominal typing simulé** : `type UserId = string & { __brand: "UserId" }`
- **Recursive conditional types** : limites du compilateur (depth = 50)
- **Decorator metadata** (TS 5.0+ Stage 3 decorators) : nouveau standard
- **Effect-TS HKT en pratique** : lire le source de `Effect.map` pour comprendre les Variance markers

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

