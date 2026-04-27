---
created: '2026-04-26T21:58:35.767Z'
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - zod unifie validation runtime et types compile-time depuis un seul
  schéma
slug: zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema
excerpt: >-
  C'est le piège classique de TypeScript : les types existent à la **compile
  time** uniquement. Au runtime, `req.body` peut contenir absolument n'importe
  quoi, peu importe que tu aies typé `req.body as User`. Sans validation
  runtime, les types TS **mentent** dès qu'on touche à du J
oneLiner: >-
  **zod** te permet de définir un schéma **une seule fois** qui sert
  simultanément de **validateur runtime** (parse, refine, transform) et de
  **source de type TypeScript** (via `z.infer<...>`) — éliminant la double
  maintenance des `interface User { ... }` et des fonctions `validateUser(...)`
  séparées.
related:
  - >-
    validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - backend-infra
backlinks:
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - typescript-sacrifie-le-soundness-pour-la-praticite
topics:
  - backend
  - typescript
---
## Idée en une phrase

> **zod** te permet de définir un schéma **une seule fois** qui sert simultanément de **validateur runtime** (parse, refine, transform) et de **source de type TypeScript** (via `z.infer<...>`) — éliminant la double maintenance des `interface User { ... }` et des fonctions `validateUser(...)` séparées.

## Contexte / pourquoi ça compte

C'est le piège classique de TypeScript : les types existent à la **compile time** uniquement. Au runtime, `req.body` peut contenir absolument n'importe quoi, peu importe que tu aies typé `req.body as User`. Sans validation runtime, les types TS **mentent** dès qu'on touche à du JSON externe (API, formulaire, env var, message queue).

Zod (ou ses cousins `@effect/schema`, `valibot`, `yup`) résout ça en faisant des types et de la validation **la même chose** :

```typescript
const User = z.object({ email: z.string().email(), age: z.number() })
type User = z.infer<typeof User>
// type User = { email: string; age: number }
```

Une seule définition. Le type est la garantie que le runtime a passé.

## Détails / mécanisme

### Schémas de base

```typescript
import { z } from 'zod'

const stringSchema = z.string()
const emailSchema = z.string().email()
const intSchema = z.number().int().min(0).max(100)
const dateSchema = z.coerce.date() // accepte string ISO ou Date
const enumSchema = z.enum(['admin', 'user', 'guest'])
const literalSchema = z.literal('hello')
const optional = z.string().optional() // string | undefined
const nullable = z.string().nullable() // string | null
```

### Objects et imbrication

```typescript
const Address = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().regex(/^\d{5}$/),
})

const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().min(18),
  role: z.enum(['admin', 'user']),
  address: Address.optional(),
  tags: z.array(z.string()),
  createdAt: z.coerce.date(),
})

type User = z.infer<typeof User>
// {
//   id: string
//   email: string
//   age: number
//   role: 'admin' | 'user'
//   address?: { street: string; city: string; zip: string }
//   tags: string[]
//   createdAt: Date
// }
```

### Parse vs safeParse

```typescript
// .parse() : throw une ZodError si invalide
const user = User.parse(req.body)

// .safeParse() : retourne un Result-like
const result = User.safeParse(req.body)
if (!result.success) {
  // result.error : ZodError avec détails par champ
  return res.status(422).json({ errors: result.error.flatten() })
}
const user = result.data // typé User
```

### Refine — règles cross-field

```typescript
const SignUp = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})
```

### Transform — coercition typée

```typescript
const NumberFromString = z.string().transform(s => parseInt(s, 10))
NumberFromString.parse('42') // 42 (typé number, pas string)

const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
})
// .parse({}) → { page: 1, size: 20 }
```

### Discriminated unions

```typescript
const Event = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), target: z.string() }),
  z.object({ type: z.literal('scroll'), position: z.number() }),
])
type Event = z.infer<typeof Event>
// { type: 'click'; target: string } | { type: 'scroll'; position: number }
```

TS narrowe par tag :
```typescript
const e = Event.parse(input)
if (e.type === 'click') {
  e.target // typé string
}
```

## Exemple concret

Endpoint Express avec validation Zod :

```typescript
const CreateUserBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
})

app.post('/users', async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors })
    // {
    //   errors: {
    //     email: ['Invalid email'],
    //     password: ['String must contain at least 8 character(s)']
    //   }
    // }
  }
  const user = await createUser(parsed.data)
  res.status(201).json(user)
})
```

Pas un seul `if (!email)` à la main. Erreurs structurées prêtes pour le front.

### Validation env vars

```typescript
const env = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
}).parse(process.env)

// env est typé garanti et validé. Si une variable manque, le process crash IMMÉDIATEMENT au boot avec un message clair.
export default env
```

C'est l'idiome **fail-fast** appliqué à la config — mieux que de découvrir 30 minutes après que `JWT_SECRET` est `undefined`.

### Performance

Zod est suffisamment rapide pour la plupart des usages (~100 µs par parse pour un objet de 10 champs). Pour des cas extrêmes (parse de millions d'objets) :
- **`valibot`** : 8× plus léger que zod en bundle, perfs similaires
- **`@effect/schema`** : couplage fort avec Effect-TS, perfs similaires
- **`typia`** : code-gen, ultra-rapide mais nécessite un transformer ttsc/Deno

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat" data-wiki-title="Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat" data-wiki-preview="Le pattern **validate first** (ou **early return**, ou **guard clauses**) consiste à grouper toutes les vérifications d'invariants au **début** d'une fonction et à retourner / throw immédiatement en cas d'échec, pour que le reste du corps s…">Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat</a> *(zod est l'outil parfait pour validate first)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end" data-wiki-title="Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end" data-wiki-preview="`HttpApi` est une **description déclarative** de la surface d'une API : pour chaque endpoint, tu déclares la méthode, le path, les schémas (path, query, body, response, erreurs) — cette spec devient une **source unique de vérité** dont sont…">Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end</a> *(@effect/schema est l'équivalent dans l'écosystème Effect)*

**Prérequis** :
- TypeScript de base
- Discriminated unions

**S'oppose à / à comparer avec** :
- **`as User`** sans validation : le type ment au runtime
- **`yup`** : moins bien typé, plus ancien
- **`valibot`** : alternative plus légère
- **`io-ts`** : style FP, moins ergonomique pour les non-FP
- **JSON Schema + Ajv** : standard mais pas de typage TS automatique

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026" data-wiki-title="5 packages Node à inclure dans tout projet 2026" data-wiki-preview="1. **`consola`** — un logger 100× plus agréable que `console.log`. Niveaux, couleurs, formats, intégré aux process Node. 2. **`zod`** (ou `@effect/schema`) — validation runtime + typage compile-time depuis un seul schéma. La fin des `if (!i…">5 packages Node à inclure dans tout projet 2026</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

