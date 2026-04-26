---
title: 5 packages Node à inclure dans tout projet 2026
url: >-
  https://medium.com/skillstuff/dont-start-another-node-js-project-without-these-5-packages-e6e00ae40122
author: CodeByUmar (article original) + sélection Claude
published: 2026-03
digested: 2026-04-26T00:00:00.000Z
format: article
domain: backend
level: beginner
tags:
  - type/source
  - status/done
  - domain/backend
  - format/article
  - level/beginner
slug: 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
excerpt: >-
  1. **`consola`** — un logger 100× plus agréable que `console.log`. Niveaux,
  couleurs, formats, intégré aux process Node. 2. **`zod`** (ou
  `@effect/schema`) — validation runtime + typage compile-time depuis un seul
  schéma. La fin des `if (!input.email)` à la main. 3. **`tsx`** — e
related:
  - >-
    validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
  - zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema
  - vitest-remplace-jest-avec-api-compatible-et-demarrage-10x-plus-rapide
  - pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone
  - 2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform
  - backend-infra
backlinks:
  - >-
    consola-remplace-console-log-par-un-logger-dev-friendly-avec-niveaux-et-icones
  - pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone
  - tsx-execute-typescript-directement-via-esbuild-10x-plus-rapide-que-ts-node
  - vitest-remplace-jest-avec-api-compatible-et-demarrage-10x-plus-rapide
  - zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema
topics:
  - backend
---
## Pourquoi cette source

> L'article original (paywallé) recommande 5 packages "**don't start without**" pour Node.js en 2026. La version visible publiquement mentionne **consola** comme #1. Ci-dessous, **mes 5 picks** (le mien étendant le sien) — les libs que tu devrais avoir dans tout `package.json` Node moderne, peu importe la stack (Express, Fastify, NestJS, AdonisJS, Effect-TS).

## Résumé en 5 lignes

1. **`consola`** — un logger 100× plus agréable que `console.log`. Niveaux, couleurs, formats, intégré aux process Node.
2. **`zod`** (ou `@effect/schema`) — validation runtime + typage compile-time depuis un seul schéma. La fin des `if (!input.email)` à la main.
3. **`tsx`** — exécute TypeScript directement, plus de step de build pour les scripts dev. Remplace `ts-node` (10× plus rapide via esbuild).
4. **`vitest`** (ou `node:test` si pure stdlib) — runner de tests rapide, API Jest-compatible, ESM-first, intègre coverage, watch, UI.
5. **`pino`** (en prod) — le logger structuré JSON le plus rapide de l'écosystème, pour la production où chaque ms compte. Pair avec `pino-pretty` en dev.

---

## 1. `consola` — logging dev-friendly

```bash
pnpm add consola
```

```typescript
import consola from 'consola'

consola.info('Server starting on port', 3000)
consola.success('User created:', user.id)
consola.warn('Cache miss for', key)
consola.error('Failed to fetch:', err)
consola.debug('Internal state:', state)

// Niveaux contrôlables via env
consola.level = 4 // 0=fatal, 1=error, 2=warn, 3=log, 4=info, 5=debug

// Multiline structured
consola.box('Welcome to my app!')
consola.start('Building project...')
```

**Pourquoi** : `console.log` est plat, sans niveau, sans contexte structuré. `consola` te donne immédiatement des logs lisibles au terminal avec couleurs, icônes, niveaux configurables. Pratique en dev, configurable en prod.

→ <span class="wikilink-broken" title="Référence non trouvée : Concept - consola remplace console.log par un logger dev-friendly avec niveaux et icônes">Concept - consola remplace console.log par un logger dev-friendly avec niveaux et icônes</span>

---

## 2. `zod` — validation + typage en un seul schéma

```bash
pnpm add zod
```

```typescript
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  role: z.enum(['admin', 'user']),
  createdAt: z.coerce.date(),
})

type User = z.infer<typeof UserSchema> // type TS inféré du schéma

// Parser
const result = UserSchema.safeParse(req.body)
if (!result.success) return res.status(422).json({ errors: result.error.flatten() })
const user = result.data // typé garanti
```

**Pourquoi** : un schéma = une source unique de vérité pour types **et** validation runtime. Fini les types TS qui mentent (`UserDto` dit `email: string`, mais à l'exécution c'est `null`). Combine particulièrement bien avec **Validate first** (cf. <a class="wikilink" href="/Obsidian-Learn-Page/concepts/validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat" data-wiki-title="Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat" data-wiki-preview="Le pattern **validate first** (ou **early return**, ou **guard clauses**) consiste à grouper toutes les vérifications d'invariants au **début** d'une fonction et à retourner / throw immédiatement en cas d'échec, pour que le reste du corps s…">Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat</a>).

Alternatives : **`@effect/schema`** (si Effect-TS), **`valibot`** (plus léger), **`yup`** (legacy).

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema" data-wiki-title="Concept - zod unifie validation runtime et types compile-time depuis un seul schéma" data-wiki-preview="**zod** te permet de définir un schéma **une seule fois** qui sert simultanément de **validateur runtime** (parse, refine, transform) et de **source de type TypeScript** (via `z.infer&lt;...&gt;`) — éliminant la double maintenance des `interface…">Concept - zod unifie validation runtime et types compile-time depuis un seul schéma</a>

---

## 3. `tsx` — exécute TS sans build

```bash
pnpm add -D tsx
```

```bash
# Au lieu de
node --loader ts-node/esm script.ts

# Tu écris
tsx script.ts

# Mode watch
tsx watch src/server.ts
```

```json
// package.json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "script": "tsx scripts/migrate.ts"
}
```

**Pourquoi** : `ts-node` est **lent** (parse via tsc), `tsx` utilise **esbuild** sous le capot et est ~10× plus rapide. Indispensable en 2026 pour le DX dev. Le sync-vault.ts de ton vault tourne avec tsx d'ailleurs.

Alternatives modernes : **`bun run`** (si tu utilises Bun comme runtime), **`tsgo`** (TypeScript 7.0 Beta — voir <span class="wikilink-broken" title="Référence non trouvée : 2026-04-26 - TypeScript 7.0 Beta — le compilateur Go natif">2026-04-26 - TypeScript 7.0 Beta — le compilateur Go natif</span>).

→ <span class="wikilink-broken" title="Référence non trouvée : Concept - tsx exécute TypeScript directement via esbuild, 10x plus rapide que ts-node">Concept - tsx exécute TypeScript directement via esbuild, 10x plus rapide que ts-node</span>

---

## 4. `vitest` — testing moderne

```bash
pnpm add -D vitest
```

```typescript
// user.test.ts
import { describe, it, expect } from 'vitest'
import { createUser } from './user'

describe('createUser', () => {
  it('creates a user with valid input', () => {
    const u = createUser({ email: 'a@b.com', age: 30 })
    expect(u.id).toBeDefined()
  })

  it('throws on invalid age', () => {
    expect(() => createUser({ email: 'a@b.com', age: -1 })).toThrow()
  })
})
```

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

**Pourquoi** : API Jest-compatible (drop-in replacement), démarre en <100ms, ESM-first (pas de hack `transformIgnorePatterns`), coverage avec V8 ou istanbul, UI web, watch parallèle. Standard de fait pour les projets TS modernes.

Alternative : **`node:test`** (built-in Node ≥ 20) — minimal, pas de dep, mais pas d'UI ni mocks aussi riches.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/vitest-remplace-jest-avec-api-compatible-et-demarrage-10x-plus-rapide" data-wiki-title="Concept - vitest remplace Jest avec API compatible et démarrage 10x plus rapide" data-wiki-preview="**Vitest** est un runner de tests JS/TS bâti sur **Vite** : il offre la **même API que Jest** (drop-in replacement avec `describe` / `it` / `expect`), mais démarre en ~100ms (vs 2-5s pour Jest), supporte ESM nativement, intègre une UI web,…">Concept - vitest remplace Jest avec API compatible et démarrage 10x plus rapide</a>

---

## 5. `pino` — logger production JSON structuré

```bash
pnpm add pino
pnpm add -D pino-pretty
```

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // Pretty en dev, JSON brut en prod
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
})

logger.info({ userId: '123', action: 'login' }, 'User logged in')
logger.error({ err, requestId: req.id }, 'Failed to process request')
```

**Pourquoi** : en prod, tu veux du **JSON structuré** (parseable par Datadog/Loki/Cloudwatch). `pino` est le logger le plus rapide de l'écosystème Node (~5× console.log, ~3× winston). Asynchrone, faible overhead, child loggers pour contexte par requête.

```typescript
// Child logger par requête (Express middleware)
app.use((req, res, next) => {
  req.log = logger.child({ requestId: req.id })
  next()
})
```

`consola` (point 1) reste plus pratique en dev. En prod : `pino`.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone" data-wiki-title="Concept - pino est le logger Node le plus rapide via JSON structuré asynchrone" data-wiki-preview="**pino** est un logger Node optimisé pour la production : il écrit du **JSON structuré** ligne par ligne sur stdout (plutôt que du texte formaté), de façon **asynchrone** via un worker thread, et atteint un débit ~5× supérieur à `console.lo…">Concept - pino est le logger Node le plus rapide via JSON structuré asynchrone</a>

---

## Bonus — packages que je n'ai pas mis dans le top 5 mais que j'aime

| Package | Rôle | Quand |
|---|---|---|
| **`@t3-oss/env-core`** | Env vars typées + validées | Tout projet sérieux avec des env vars |
| **`tsup`** ou **`unbuild`** | Bundle de bibliothèque | Si tu publies un package npm |
| **`drizzle-orm`** | ORM TS-first | Au lieu de Prisma (plus léger, plus typé) |
| **`hono`** | Web framework léger universel (Node, Bun, Cloudflare, Deno) | Alternative à Express/Fastify pour edge |
| **`commander`** | CLI builder | Quand tu fais une CLI |
| **`got`** ou **`undici`** | HTTP client (vs fetch built-in) | Pour les retries / pools de connexion fins |
| **`dotenv-flow`** | `.env` cascade (`.env.development.local` etc.) | En complément de `@t3-oss/env-core` |
| **`tinypool`** | Worker threads pool | Calculs CPU-bound parallèles |

---

## Tableau de synthèse — install minimal d'un projet Node 2026

```bash
pnpm init
pnpm add consola zod pino
pnpm add -D tsx vitest typescript @types/node
```

```json
// package.json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  }
}
```

Cinq commandes, cinq packages prod + dev. Tu peux écrire un backend solide.

---

## Citations brutes

> *"Don't start another Node.js project without these 5 packages."* — titre original de l'article.

---

## À explorer ensuite

- **`@effect/platform`** comme alternative complète à Express + zod + pino — déjà digéré dans <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform" data-wiki-title="Effect-TS — premier serveur HTTP avec @effect/platform" data-wiki-preview="1. **`@effect/platform`** est l'interface abstraite (HTTP, FS, runtime). **`@effect/platform-node`** (ou `-bun`, `-deno`) est l'implémentation concrète. Tu écris contre `platform`, tu lances avec `platform-node`. 2. Deux APIs cohabitent : *…">Effect-TS — premier serveur HTTP avec @effect/platform</a>
- **`Bun` runtime** : si tu démarres un nouveau projet en 2026, considère bun comme alternative à Node (ESM natif, sqlite intégré, perf 2-3× sur certains workloads)
- **`tsgo`** (TS 7.0 Beta) : remplace progressivement tsx pour build + run
- **`@t3-oss/env-core`** + zod : la combo standard pour env vars typées
- **`drizzle-orm`** : pourquoi c'est en train de remplacer Prisma sur les nouveaux projets

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

## Source web

- [Don't Start Another Node.js Project Without These 5 Packages — Medium (paywall)](https://medium.com/skillstuff/dont-start-another-node-js-project-without-these-5-packages-e6e00ae40122)

