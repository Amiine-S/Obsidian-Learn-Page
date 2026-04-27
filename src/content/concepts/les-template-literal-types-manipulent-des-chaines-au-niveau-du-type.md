---
created: '2026-04-27T06:49:31.499Z'
domain: frontend
level: advanced
tags:
  - type/concept
  - domain/frontend
  - level/advanced
title: Concept - Les template literal types manipulent des chaînes au niveau du type
slug: les-template-literal-types-manipulent-des-chaines-au-niveau-du-type
excerpt: >-
  Cette feature (TS 4.1+) a transformé ce qu'on peut typer : - **Paths d'objet**
  typés (form libs, lodash.get/set, traduction i18n) - **Routes HTTP** typées
  (Express, tRPC, Hono) - **Format strings** validés (`Uppercase<T>`, masques de
  date) - **Brand de strings** (UUIDs, emails, I
oneLiner: >-
  Un **template literal type** est une chaîne littérale interpolée **au niveau
  type** — `` `Hello, ${string}` `` — qui peut contraindre des formats,
  **distribuer** sur des unions, et **parser des chaînes** via `infer` pour
  reconstruire des types complexes (paths d'objet, routes HTTP, formats SQL).
related:
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - frontend
backlinks:
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Un **template literal type** est une chaîne littérale interpolée **au niveau type** — `` `Hello, ${string}` `` — qui peut contraindre des formats, **distribuer** sur des unions, et **parser des chaînes** via `infer` pour reconstruire des types complexes (paths d'objet, routes HTTP, formats SQL).

## Contexte / pourquoi ça compte

Cette feature (TS 4.1+) a transformé ce qu'on peut typer :
- **Paths d'objet** typés (form libs, lodash.get/set, traduction i18n)
- **Routes HTTP** typées (Express, tRPC, Hono)
- **Format strings** validés (`Uppercase<T>`, masques de date)
- **Brand de strings** (UUIDs, emails, IDs typés)

C'est aussi ce qui permet à des libs comme **tRPC**, **HonoJS**, **drizzle-orm** d'avoir des typages "magiques" qui parsent une string comme `"GET /users/:id"`.

## Détails / mécanisme

### La syntaxe de base

```typescript
type Greeting = `Hello, ${string}`

const a: Greeting = "Hello, Alice"   // ✅
const b: Greeting = "Hi"             // ❌
```

Tu peux **interpoler des types** dans une chaîne littérale :
- `string`, `number`, `bigint`, `boolean`, `null`, `undefined`
- Des unions de littéraux
- D'autres template literals

### Distribution sur les unions

```typescript
type Greeting = `Hello, ${"Alice" | "Bob"}`
// = "Hello, Alice" | "Hello, Bob"

type Combo = `${"a" | "b"}-${"1" | "2"}`
// = "a-1" | "a-2" | "b-1" | "b-2"
```

Chaque variant d'une union est interpolé séparément. C'est très puissant mais peut **exploser combinatoirement** (si tu combines 4 unions de 5, tu obtiens 625 variants).

### Utilities natives sur les chaînes

```typescript
type A = Uppercase<"hello">     // "HELLO"
type B = Lowercase<"HELLO">     // "hello"
type C = Capitalize<"hello">    // "Hello"
type D = Uncapitalize<"HELLO">  // "hELLO"
```

À combiner massivement avec `as` dans les mapped types pour renommer des clés.

### `infer` pour parser des strings

```typescript
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S]

type R = Split<"a.b.c.d", ".">
// ["a", "b", "c", "d"]
```

`infer Head` matche **le plus petit** préfixe qui satisfait le pattern. C'est ce qui permet de **parser** une string au niveau type.

```typescript
type StripPrefix<S extends string, P extends string> =
  S extends `${P}${infer Rest}` ? Rest : S

type X = StripPrefix<"get_user", "get_">   // "user"
```

### Bonne pratique : routes HTTP typées

```typescript
type Method = "GET" | "POST" | "PUT" | "DELETE"
type Route = `${Method} /${string}`

const get: Route = "GET /users"      // ✅
const bad: Route = "PATCH /users"    // ❌

// Plus précis : extraire les parts
type Parsed<R extends string> = R extends `${infer M} ${infer P}`
  ? { method: M; path: P }
  : never

type T = Parsed<"GET /users">
// { method: "GET"; path: "/users" }
```

C'est exactement ce que font **Hono** et **tRPC** pour offrir des routes typées avec params.

### Bonne pratique : paths d'objet typés (form libs, get/set)

```typescript
type Path<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T & string]:
        | (P extends "" ? `${K}` : `${P}.${K}`)
        | Path<T[K], P extends "" ? `${K}` : `${P}.${K}`>
    }[keyof T & string]
  : never

type User = {
  name: string
  address: {
    city: string
    zip: number
  }
}

type UserPaths = Path<User>
// "name" | "address" | "address.city" | "address.zip"
```

C'est la base derrière `react-hook-form`, `formik`, et les `lodash.get(obj, "user.address.city")` typés.

### Bonne pratique : Brand strings (typage nominal)

```typescript
type Email = string & { __brand: "Email" }
type Uuid  = string & { __brand: "Uuid" }

function parseEmail(s: string): Email | null {
  return /\w+@\w+\.\w+/.test(s) ? (s as Email) : null
}

function sendMail(to: Email) { ... }

const email = "alice@x.com"
sendMail(email)             // ❌ TS error : c'est juste une string
const valid = parseEmail(email)
if (valid) sendMail(valid)  // ✅
```

Avec template literal types, tu peux pousser plus loin et **valider le format au compile time** dans certains cas :

```typescript
type EmailLike<S extends string> = S extends `${string}@${string}.${string}` ? S : never

type T1 = EmailLike<"alice@x.com">   // "alice@x.com"
type T2 = EmailLike<"hello">         // never
```

### Bonne pratique : générer des keys i18n

```typescript
type I18nKey<T, P extends string = ""> = {
  [K in keyof T]: T[K] extends string
    ? P extends "" ? `${K & string}` : `${P}.${K & string}`
    : I18nKey<T[K], P extends "" ? `${K & string}` : `${P}.${K & string}`>
}[keyof T]

const messages = {
  user: { profile: { title: "Profil", subtitle: "Infos" } },
  errors: { notFound: "Pas trouvé" },
} as const

type Keys = I18nKey<typeof messages>
// "user.profile.title" | "user.profile.subtitle" | "errors.notFound"

function t(key: Keys) { ... }
t("user.profile.title")     // ✅
t("user.profile.bad")       // ❌
```

C'est exactement ce que fait `i18next-typed`.

### Mauvaise pratique : combinatoire qui sature TS

```typescript
// ❌ Type instantiation is excessively deep / 27000 variants
type Permission = `${"read" | "write" | "admin" | "owner"}-${"users" | "posts" | "comments" | "likes" | "media"}-${"v1" | "v2" | "v3"}-${"prod" | "staging" | "dev"}`
```

TS plafonne à environ **100 000 unions** combinées. Au-delà, le compilateur jette l'éponge ou plante. Garde la combinatoire **focalisée** : 2-3 dimensions.

### Mauvaise pratique : parser à outrance

```typescript
// ❌ Parser SQL au niveau type — possible mais douleur
type ParseSelect<S extends string> = S extends `SELECT ${infer Cols} FROM ${infer Table}`
  ? { cols: Split<Cols, ","> ; table: Table }
  : never
// ... puis parser WHERE, JOIN, etc.
```

Possible mais le code TS devient illisible et compile lentement. **drizzle-orm** et **kysely** font ça mais en investissant des mois de typage. Pour un usage applicatif, **laisse le runtime parser** et type seulement la résultat.

### Mauvaise pratique : oublier le `string &`

```typescript
type Renamed<T> = {
  [K in keyof T as `prefix_${K}`]: T[K]   // ❌ K peut être number/symbol
}

// ✅
type Renamed<T> = {
  [K in keyof T as `prefix_${K & string}`]: T[K]
}
```

`keyof T` peut inclure `number | symbol`. Pour interpoler dans un template literal, force `& string`.

## Exemple concret

### Cas réel : tRPC routes typées

```typescript
const appRouter = t.router({
  user: t.router({
    getById: t.procedure.input(z.string()).query(({ input }) => fetchUser(input)),
    list: t.procedure.query(() => listUsers()),
  }),
  post: t.router({
    list: t.procedure.query(() => listPosts()),
  }),
})

// Sous le capot, tRPC reconstruit les paths
type Routes = "user.getById" | "user.list" | "post.list"

trpc.user.getById.query("123")   // ✅
```

Les paths `"user.getById"` sont générés via mapped types + template literal types, à partir du shape du router.

### Cas réel : drizzle-orm — query builder typé

```typescript
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
})

const result = await db.select({ id: users.id, name: users.name }).from(users)
//    ^? Array<{ id: number; name: string }>
```

drizzle-orm utilise template literal types pour construire le type SQL résultat à partir du select choisi. Sans template literal types, ce typage serait impossible.

### Cas réel : Hono routes typées

```typescript
const app = new Hono()
  .get("/users/:id", (c) => c.json({ id: c.req.param("id") }))
  //                                       ^? string ("id" est extrait de "/users/:id")
```

Hono parse `"/users/:id"` au niveau type pour extraire les params dynamiques et les exposer typés via `c.req.param`.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types" data-wiki-title="Concept - Les types conditionnels font des branchements dans le système de types" data-wiki-preview="Un **type conditionnel** s'écrit `T extends U ? X : Y` — c'est un **if/else exécuté par le compilateur** sur les types — et combiné à `infer` pour extraire des sous-types, il forme la base de quasi toutes les **utility types** modernes (`Re…">Concept - Les types conditionnels font des branchements dans le système de types</a> *(infer dans un template literal fait du parsing)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type" data-wiki-title="Concept - Les mapped types transforment chaque clé d'un type en un nouveau type" data-wiki-preview="Un **mapped type** s'écrit `{ [K in keyof T]: ... }` — il **itère sur toutes les clés** de `T` pour produire un nouveau type — avec la possibilité d'ajouter ou retirer `?` (optionalité) et `readonly`, et même de **renommer** la clé via `as`…">Concept - Les mapped types transforment chaque clé d'un type en un nouveau type</a> *(combinés avec `as` pour renommer les clés)*

**Prérequis** :
- Conditional types et `infer`
- Template literals JS (les `` `${var}` `` runtime)

**S'oppose à / à comparer avec** :
- **Branded types simples** : `string & { __brand: "Foo" }` — moins puissant mais plus simple
- **Validation runtime (zod, valibot)** : check à l'exécution, plus permissif (regex, contraintes complexes)
- **Macros Rust (`macro_rules!`)** : génèrent du code, beaucoup plus puissant mais hors du scope TS

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-typescript-types-avances-de-la-variance-aux-hkt" data-wiki-title="TypeScript types avancés — de la variance aux Higher-Kinded Types" data-wiki-preview="1. **Variance** : si `Cat &lt;: Animal`, est-ce que `Container&lt;Cat&gt; &lt;: Container&lt;Animal&gt;` ? Ça dépend de la **position** de `T` (input = contravariant, output = covariant). C'est le coeur des erreurs de génériques. 2. **Types conditionnels** (…">TypeScript types avancés — de la variance aux Higher-Kinded Types</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

