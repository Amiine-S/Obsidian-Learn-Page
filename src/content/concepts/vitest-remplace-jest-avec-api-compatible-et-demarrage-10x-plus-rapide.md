---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: beginner
tags:
  - type/concept
  - domain/backend
  - level/beginner
title: >-
  Concept - vitest remplace Jest avec API compatible et démarrage 10x plus
  rapide
slug: vitest-remplace-jest-avec-api-compatible-et-demarrage-10x-plus-rapide
excerpt: >-
  Jest a régné en master pendant 7 ans (2018-2024) mais son architecture
  (CommonJS + Babel) a accumulé de la dette : ESM galère, démarrage long sur
  gros projets, transformIgnorePatterns devenu un casse-tête. Vitest est arrivé
  en 2021 avec un objectif clair : "Jest mais en mieux", e
oneLiner: >-
  **Vitest** est un runner de tests JS/TS bâti sur **Vite** : il offre la **même
  API que Jest** (drop-in replacement avec `describe` / `it` / `expect`), mais
  démarre en ~100ms (vs 2-5s pour Jest), supporte ESM nativement, intègre une UI
  web, le coverage, le watch mode et le browser mode — c'est devenu le runner de
  tests par défaut sur les projets TS modernes.
related:
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - backend-infra
backlinks:
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
topics:
  - backend
---
## Idée en une phrase

> **Vitest** est un runner de tests JS/TS bâti sur **Vite** : il offre la **même API que Jest** (drop-in replacement avec `describe` / `it` / `expect`), mais démarre en ~100ms (vs 2-5s pour Jest), supporte ESM nativement, intègre une UI web, le coverage, le watch mode et le browser mode — c'est devenu le runner de tests par défaut sur les projets TS modernes.

## Contexte / pourquoi ça compte

Jest a régné en master pendant 7 ans (2018-2024) mais son architecture (CommonJS + Babel) a accumulé de la dette : ESM galère, démarrage long sur gros projets, transformIgnorePatterns devenu un casse-tête. Vitest est arrivé en 2021 avec un objectif clair : "Jest mais en mieux", en s'appuyant sur Vite/esbuild pour la perf.

En 2026, c'est devenu **le** standard sur les projets TS récents (Vue, Solid, Astro, Vite-based tout court).

## Détails / mécanisme

### API compatible Jest

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('user service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a user', async () => {
    const u = await createUser({ email: 'a@b.com' })
    expect(u.id).toBeDefined()
    expect(u.email).toBe('a@b.com')
  })

  it('throws on invalid email', () => {
    expect(() => createUser({ email: 'invalid' })).toThrow()
  })
})
```

Si tu connais Jest, tu connais Vitest. Migration souvent : `s/jest/vi/g` + adapter les imports.

### Setup minimal

```bash
pnpm add -D vitest
```

```json
// package.json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // si tu veux describe/it/expect sans import
    environment: 'node', // ou 'jsdom' / 'happy-dom' pour browser tests
    coverage: { provider: 'v8' }, // ou 'istanbul'
  },
})
```

### Pourquoi c'est plus rapide

| Étape | Jest | Vitest |
|---|---|---|
| Bootstrap | ~2-5 s | ~100-300 ms |
| Transform | Babel/SWC | esbuild (~10× plus rapide) |
| Module resolution | CJS lent | ESM natif |
| Watch mode | invalidation grossière | HMR ciblé via Vite |
| Type-aware | tsc séparé | optionnel `--typecheck` intégré |

Sur un projet de 500 tests, Jest met 30s, Vitest met 3-5s. Sur un projet géant (10k+ tests), l'écart se creuse.

### Mocks et spies

API alignée sur Jest :

```typescript
import { vi } from 'vitest'

const mockFn = vi.fn().mockReturnValue(42)
mockFn(1, 2)
expect(mockFn).toHaveBeenCalledWith(1, 2)

// Mock module
vi.mock('./db', () => ({
  findUser: vi.fn().mockResolvedValue({ id: '1' }),
}))

// Spy
const spy = vi.spyOn(console, 'log')
```

### Snapshot testing

```typescript
expect(component).toMatchInlineSnapshot(`...`)
expect(json).toMatchSnapshot()
```

### UI mode (web)

```bash
pnpm test:ui
```

Lance une UI web sur `localhost:51204/__vitest__` avec :
- Liste des tests
- Diff visuel des snapshots
- Re-run individuel
- Stack traces interactives

Plus pratique que la sortie terminal pour des sessions longues.

### Type checking intégré

```bash
vitest --typecheck
```

Lance `tsc` en parallèle des tests. Pas par défaut (perf), mais utile en CI.

### Browser mode (V2 stable en 2026)

```typescript
// vitest.config.ts
export default {
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
    },
  },
}
```

Tests qui tournent dans un vrai navigateur (pas jsdom). Indispensable pour tester du code DOM réel ou CSS-in-JS.

## Exemple concret

Test d'un module métier :

```typescript
// user.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createUser, getUser } from './user'
import * as db from './db'

describe('User module', () => {
  beforeEach(() => {
    vi.spyOn(db, 'insertUser').mockResolvedValue({ id: 'mock-id' })
    vi.spyOn(db, 'findUser').mockResolvedValue(null)
  })

  it('creates a user', async () => {
    const u = await createUser({ email: 'a@b.com', age: 30 })
    expect(u.id).toBe('mock-id')
    expect(db.insertUser).toHaveBeenCalledWith({ email: 'a@b.com', age: 30 })
  })

  it('throws if user not found', async () => {
    await expect(getUser('xyz')).rejects.toThrow('User xyz not found')
  })
})
```

```bash
$ pnpm vitest

 ✓ src/user.spec.ts (2)
   ✓ User module (2)
     ✓ creates a user
     ✓ throws if user not found

Test Files  1 passed (1)
     Tests  2 passed (2)
  Duration  208ms (transform 45ms, setup 0ms, collect 35ms, tests 12ms)
```

200ms pour 2 tests. Sur Jest c'était 2-3 secondes minimum.

### Quand préférer `node:test`

Node 20+ inclut un runner de test natif (`node --test`). C'est minimal, pas d'UI, pas de mocks aussi riches, mais zéro dep et plus que suffisant pour des libs pures :

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('math', () => {
  it('adds', () => {
    assert.equal(1 + 1, 2)
  })
})
```

```bash
node --test
```

Pour des libs npm distribuables : `node:test` est attractif (zéro dep). Pour des apps : Vitest reste meilleur.

## Connexions

**Concepts liés** :
- <span class="wikilink-broken" title="Référence non trouvée : Concept - tsx exécute TypeScript directement via esbuild, 10x plus rapide que ts-node">Concept - tsx exécute TypeScript directement via esbuild, 10x plus rapide que ts-node</span> *(même philosophie : esbuild pour la vélocité)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a>

**Prérequis** :
- Bases du testing (assertions, lifecycle hooks)

**S'oppose à / à comparer avec** :
- **Jest** : ancien standard, plus lent, ESM galère
- **`node:test`** : built-in, minimaliste, pas d'UI
- **Mocha + Chai** : legacy, moins ergonomique en 2026
- **Bun test** : si tu utilises Bun, son test runner intégré est viable

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026" data-wiki-title="5 packages Node à inclure dans tout projet 2026" data-wiki-preview="1. **`consola`** — un logger 100× plus agréable que `console.log`. Niveaux, couleurs, formats, intégré aux process Node. 2. **`zod`** (ou `@effect/schema`) — validation runtime + typage compile-time depuis un seul schéma. La fin des `if (!i…">5 packages Node à inclure dans tout projet 2026</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

