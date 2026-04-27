---
created: '2026-04-27T06:48:34.927Z'
domain: frontend
level: advanced
tags:
  - type/concept
  - domain/frontend
  - level/advanced
title: >-
  Concept - Les mapped types transforment chaque clé d'un type en un nouveau
  type
slug: les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
excerpt: >-
  Tu utilises `Partial<User>` ou `Pick<User, "id" | "name">` constamment.
  Comprendre comment c'est construit te permet : - D'écrire des **utilities
  métier** spécifiques à ton projet (ex: `WritableFields<T>`, `ApiPayload<T>`) -
  De **transformer un model** vers une variante (form, pa
oneLiner: >-
  Un **mapped type** s'écrit `{ [K in keyof T]: ... }` — il **itère sur toutes
  les clés** de `T` pour produire un nouveau type — avec la possibilité
  d'ajouter ou retirer `?` (optionalité) et `readonly`, et même de **renommer**
  la clé via `as`. C'est la base de `Partial`, `Required`, `Readonly`, `Pick`,
  `Record`.
related:
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - les-template-literal-types-manipulent-des-chaines-au-niveau-du-type
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - frontend
backlinks:
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - les-template-literal-types-manipulent-des-chaines-au-niveau-du-type
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Un **mapped type** s'écrit `{ [K in keyof T]: ... }` — il **itère sur toutes les clés** de `T` pour produire un nouveau type — avec la possibilité d'ajouter ou retirer `?` (optionalité) et `readonly`, et même de **renommer** la clé via `as`. C'est la base de `Partial`, `Required`, `Readonly`, `Pick`, `Record`.

## Contexte / pourquoi ça compte

Tu utilises `Partial<User>` ou `Pick<User, "id" | "name">` constamment. Comprendre comment c'est construit te permet :
- D'écrire des **utilities métier** spécifiques à ton projet (ex: `WritableFields<T>`, `ApiPayload<T>`)
- De **transformer un model** vers une variante (form, payload API, validation, mock)
- De combiner avec `template literal types` pour des **paths typés** (form libs, i18n keys)
- De saisir comment Zod, tRPC, Prisma typent leurs résultats

## Détails / mécanisme

### La syntaxe

```typescript
type Identity<T> = { [K in keyof T]: T[K] }   // copie identique

type User = { name: string; age: number }
type U2 = Identity<User>   // { name: string; age: number }
```

`[K in keyof T]` est la **boucle au niveau type**. `T[K]` est l'accès au type de la valeur pour la clé K.

### Les modifiers

```typescript
type Partial<T>  = { [K in keyof T]?: T[K] }                 // ajoute ?
type Required<T> = { [K in keyof T]-?: T[K] }                // retire ?
type Readonly<T> = { readonly [K in keyof T]: T[K] }         // ajoute readonly
type Mutable<T>  = { -readonly [K in keyof T]: T[K] }        // retire readonly
```

Le **`-`** est l'opérateur "retirer" — souvent oublié, très utile.

```typescript
type ReadonlyUser = { readonly name: string; readonly age: number }
type MutableUser = Mutable<ReadonlyUser>
// { name: string; age: number }
```

### Renommage via `as`

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

type User = { name: string; age: number }
type UserGetters = Getters<User>
// { getName: () => string; getAge: () => number }
```

`as` permet de **renommer** chaque clé pendant l'itération. Combiné aux **template literal types** et à `Capitalize` / `Uncapitalize`, c'est extrêmement expressif.

### Filtrer des clés via `as` + `never`

```typescript
type StringKeys<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

type User = { name: string; age: number; email: string }
type StrUser = StringKeys<User>
// { name: string; email: string }
```

Si la clé est mappée vers `never`, elle **disparaît** du type final. C'est l'idiome standard pour **filtrer des clés** par condition sur leur valeur.

### Bonne pratique : transformer un model vers un payload API

```typescript
// Model interne (ID + champs auto-générés)
type User = {
  readonly id: string
  readonly createdAt: Date
  name: string
  email: string
}

// Payload API : retire id et createdAt, rend tout writable
type CreateUserPayload = Mutable<Omit<User, "id" | "createdAt">>
// { name: string; email: string }

// Update payload : Partial du payload de création
type UpdateUserPayload = Partial<CreateUserPayload>
// { name?: string; email?: string }
```

Une seule source de vérité (`User`), tous les variants dérivés. Quand `User` change, **tous** les types dérivés se mettent à jour.

### Bonne pratique : mapper vers Promise / Observable

```typescript
type Promised<T> = { [K in keyof T]: Promise<T[K]> }

type Sync = { user: User; posts: Post[] }
type Async = Promised<Sync>
// { user: Promise<User>; posts: Promise<Post[]> }
```

Idéal pour modéliser un wrapper async d'un service synchrone (mocking, batching).

### Bonne pratique : extraire les méthodes d'une classe

```typescript
type Methods<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}

class UserService {
  cache: Map<string, User> = new Map()
  findById(id: string) { ... }
  create(dto: Dto) { ... }
}

type ServiceMethods = Methods<UserService>
// { findById: (id: string) => ...; create: (dto: Dto) => ... }
// `cache` est filtré
```

Utile pour générer un **mock typé** d'un service, ou des middlewares qui interceptent uniquement les méthodes.

### Bonne pratique : combiner avec template literal types

```typescript
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (value: T[K]) => void
}

type Form = { name: string; email: string }
type FormHandlers = EventHandlers<Form>
// { onName: (value: string) => void; onEmail: (value: string) => void }
```

Pattern courant dans les libs React (form, store) — la clé est dérivée du nom de propriété.

### Mauvaise pratique : recréer les utilities natives

```typescript
// ❌ Réinventer
type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// ✅ Utiliser les natives
type X = Partial<MyType>
type Y = Omit<MyType, "id">
```

`Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `NonNullable`, `Parameters`, `ReturnType`, `Awaited`, `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`, `ConstructorParameters`, `InstanceType` sont **natifs**.

### Mauvaise pratique : mapper sur `keyof T` quand `T` est mal contraint

```typescript
// ❌ T = {} ou T = unknown → keyof T = never → résultat vide
function f<T>(x: T): { [K in keyof T]: string } { ... }

f({})              // type vide {}
f({ a: 1 })        // OK
```

Toujours **contraindre** : `<T extends Record<string, unknown>>` ou `<T extends object>`.

### Mauvaise pratique : oublier que les unions distribuent

```typescript
// ❌ Si T est une union, le mapped type s'applique différemment
type Wrap<T> = { [K in keyof T]: { value: T[K] } }

type R = Wrap<{ a: 1 } | { b: 2 }>
// = { value: 1 } | { value: 2 } ?
// Non : c'est { } parce que keyof (A | B) = keyof A & keyof B = never
```

Pour mapper sur chaque variant d'une union, tu dois **distribuer manuellement** :

```typescript
type WrapDist<T> = T extends any ? { [K in keyof T]: { value: T[K] } } : never

type R = WrapDist<{ a: 1 } | { b: 2 }>
// { a: { value: 1 } } | { b: { value: 2 } }
```

L'idiome `T extends any ? ... : never` force la distribution sur les unions. À connaître absolument.

### Mapped types **homomorphes** vs non-homomorphes

```typescript
// Homomorphe : préserve les modifiers de T
type H<T> = { [K in keyof T]: T[K] }   // garde readonly et ?

// Non-homomorphe : explicit Keys, modifiers réinitialisés
type NH<T> = { [K in keyof T as K]: T[K] }   // perd readonly et ?
```

Subtil mais important : si tu utilises `keyof T` directement en tant que clé d'itération, les modifiers (readonly, ?) **survivent**. Si tu re-déclares les clés via `as` ou `[K in "a" | "b"]`, les modifiers **disparaissent**.

## Exemple concret

### Cas réel : Prisma

```typescript
// Prisma génère pour chaque model :
type UserCreateInput = {
  email: string
  name?: string
  posts?: { create?: PostCreateInput[]; connect?: { id: number }[] }
}

type UserUpdateInput = Partial<UserCreateInput>

type UserSelect = { [K in keyof User]?: boolean }
// { id?: boolean; email?: boolean; name?: boolean; ... }
```

Toutes les variantes (Create, Update, Select, Where, Include) sont des **mapped types dérivés du model**. C'est ce qui donne à Prisma son inférence "magique" sur les requêtes.

### Cas réel : React Hook Form

```typescript
// FieldErrors<T> = { [K in keyof T]?: { type: string; message: string } }
// FieldValues<T> = T avec recursion sur les nested
// Path<T> = chemins typés via mapped + template literal

const { register, formState: { errors } } = useForm<User>()

errors.name?.message   // ✅ typé
errors.address?.city?.message   // ✅ recursion
errors.foo            // ❌ erreur compile — clé inconnue
```

Tu profites d'un système de typage massif construit sur mapped types + template literal types.

### Cas réel : génération de stores Zustand typés

```typescript
type StoreState = {
  user: User | null
  count: number
}

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void
}

type Store = StoreState & Setters<StoreState>
// {
//   user: User | null
//   count: number
//   setUser: (value: User | null) => void
//   setCount: (value: number) => void
// }
```

Tu génères automatiquement les setters depuis le shape du state. Une seule définition.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types" data-wiki-title="Concept - Les types conditionnels font des branchements dans le système de types" data-wiki-preview="Un **type conditionnel** s'écrit `T extends U ? X : Y` — c'est un **if/else exécuté par le compilateur** sur les types — et combiné à `infer` pour extraire des sous-types, il forme la base de quasi toutes les **utility types** modernes (`Re…">Concept - Les types conditionnels font des branchements dans le système de types</a> *(`as never` pour filtrer dépend des conditionnels)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-template-literal-types-manipulent-des-chaines-au-niveau-du-type" data-wiki-title="Concept - Les template literal types manipulent des chaînes au niveau du type" data-wiki-preview="Un **template literal type** est une chaîne littérale interpolée **au niveau type** — `` `Hello, ${string}` `` — qui peut contraindre des formats, **distribuer** sur des unions, et **parser des chaînes** via `infer` pour reconstruire des ty…">Concept - Les template literal types manipulent des chaînes au niveau du type</a> *(combinés via `as`, ils renomment les clés)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques" data-wiki-title="Concept - La variance décrit comment les sous-types se propagent dans les génériques" data-wiki-preview="La **variance** est la règle qui décide, **quand `Cat &lt;: Animal`, si `F&lt;Cat&gt;` est un sous-type de `F&lt;Animal&gt;`** — selon que `T` est utilisé en **sortie** (covariant), en **entrée** (contravariant) ou aux deux (invariant).">Concept - La variance décrit comment les sous-types se propagent dans les génériques</a> *(les mapped types sont covariants en T)*

**Prérequis** :
- Génériques TS
- `keyof`, `T[K]` (indexed access)

**S'oppose à / à comparer avec** :
- **Object.keys / Object.entries au runtime** : équivalent runtime mais perd le typage précis
- **Reflect API** : metadata runtime (decorators TS legacy / 2023 stage 3)
- **Macros Rust** : transformation au build, plus puissante mais plus lourde

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-typescript-types-avances-de-la-variance-aux-hkt" data-wiki-title="TypeScript types avancés — de la variance aux Higher-Kinded Types" data-wiki-preview="1. **Variance** : si `Cat &lt;: Animal`, est-ce que `Container&lt;Cat&gt; &lt;: Container&lt;Animal&gt;` ? Ça dépend de la **position** de `T` (input = contravariant, output = covariant). C'est le coeur des erreurs de génériques. 2. **Types conditionnels** (…">TypeScript types avancés — de la variance aux Higher-Kinded Types</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

