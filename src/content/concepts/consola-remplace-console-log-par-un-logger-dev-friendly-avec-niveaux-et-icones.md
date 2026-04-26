---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: beginner
tags:
  - type/concept
  - domain/backend
  - level/beginner
title: >-
  Concept - consola remplace console.log par un logger dev-friendly avec niveaux
  et icônes
slug: consola-remplace-console-log-par-un-logger-dev-friendly-avec-niveaux-et-icones
excerpt: >-
  `console.log` est le default JS, mais il a trois problèmes en pratique : 1.
  **Pas de niveau** : tout va sur stdout, impossible de filtrer en prod 2. **Pas
  de format** : tu lis du texte plat, faut chercher l'erreur dans 50 lignes 3.
  **Pas d'icônes / couleurs natives** : tu ajoutes
oneLiner: >-
  **consola** est un logger Node minimaliste qui remplace `console.log` par une
  API à niveaux (`info`, `success`, `warn`, `error`, `debug`, `fatal`) avec
  couleurs, icônes et formats — il rend les logs en dev immédiatement lisibles
  sans configuration, tout en restant configurable pour la prod.
related:
  - pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - backend-infra
topics:
  - backend
---
## Idée en une phrase

> **consola** est un logger Node minimaliste qui remplace `console.log` par une API à niveaux (`info`, `success`, `warn`, `error`, `debug`, `fatal`) avec couleurs, icônes et formats — il rend les logs en dev immédiatement lisibles sans configuration, tout en restant configurable pour la prod.

## Contexte / pourquoi ça compte

`console.log` est le default JS, mais il a trois problèmes en pratique :
1. **Pas de niveau** : tout va sur stdout, impossible de filtrer en prod
2. **Pas de format** : tu lis du texte plat, faut chercher l'erreur dans 50 lignes
3. **Pas d'icônes / couleurs natives** : tu ajoutes `chalk` à la main, écris des helpers

`consola` règle les trois en un `import` et zéro config. C'est un des packages "default install" sur tous les projets Node sérieux en 2026.

## Détails / mécanisme

### API basique

```typescript
import consola from 'consola'

consola.info('Server starting on port 3000')
//        ℹ Server starting on port 3000

consola.success('User created:', user.id)
//        ✔ User created: abc123

consola.warn('Cache miss for', key)
//        ⚠ Cache miss for "users:42"

consola.error('Failed to fetch:', err)
//        ✖ Failed to fetch: ECONNREFUSED

consola.debug('Internal state:', state)
//        ⚙ Internal state: { ... }   (visible seulement si level >= 5)

consola.fatal('Out of memory') // process.exit(1) implicite
```

### Niveaux

Hiérarchie standard, contrôlable via `consola.level` ou env var :

| Numérique | Méthode | Visible si level ≥ |
|---|---|---|
| 0 | `fatal`, `silent` | toujours |
| 1 | `error` | 1 |
| 2 | `warn` | 2 |
| 3 | `log` | 3 |
| 4 | `info`, `success`, `ready`, `start` | 4 (default) |
| 5 | `debug` | 5 |
| 6 | `trace` | 6 (verbose) |

```typescript
consola.level = parseInt(process.env.LOG_LEVEL ?? '4', 10)
// CONSOLA_LEVEL=5 node app.js → debug visible
```

### Sucre syntaxique : `box`, `start`, `ready`

```typescript
consola.box('🚀 My App\nv1.2.3\nhttp://localhost:3000')
// ┌────────────────────────┐
// │  🚀 My App             │
// │  v1.2.3                │
// │  http://localhost:3000 │
// └────────────────────────┘

consola.start('Building project...')
// ⏳ Building project...

consola.ready('Build complete in 2.3s')
// ✔ Build complete in 2.3s
```

### Tags / scope

```typescript
const dbLogger = consola.withTag('db')
dbLogger.info('Connected to postgres')
//   [db] ℹ Connected to postgres
```

### Reporter (custom output)

```typescript
import { createConsola } from 'consola'

const logger = createConsola({
  level: 4,
  reporters: [
    // Default fancy reporter en TTY
    // ou ton propre reporter en JSON pour piper en prod :
    {
      log: (logObj) => process.stdout.write(JSON.stringify(logObj) + '\n')
    }
  ]
})
```

C'est ainsi que `consola` peut servir EN PROD aussi — en swappant le reporter pour du JSON parseable par Datadog/Loki.

## Exemple concret

Dans un script CLI ou un `package.json` script :

```typescript
// scripts/seed.ts
import consola from 'consola'

async function seed() {
  consola.start('Seeding database...')
  
  const users = await consola.start('Creating users')
  // ⏳ Creating users
  await db.users.insertMany(USERS)
  consola.success(`Created ${USERS.length} users`)
  // ✔ Created 100 users
  
  await consola.start('Creating products')
  await db.products.insertMany(PRODUCTS)
  consola.success(`Created ${PRODUCTS.length} products`)
  
  consola.ready('Seeding complete')
}

seed().catch(err => {
  consola.fatal('Seeding failed:', err)
})
```

Tu lances `tsx scripts/seed.ts`, le terminal te donne immédiatement un retour visuel propre, sans avoir écrit une ligne de chalk / formatage.

### Comparaison rapide

| Outil | Cas |
|---|---|
| **`console.log`** | Debug rapide, scripts one-shot. **Pas en prod**. |
| **`consola`** | Dev, scripts CLI, builds, hooks. Excellent DX. |
| **`pino`** | Production logging structuré JSON, max perf. |
| **`winston`** | Legacy. Très configurable, mais plus lent que pino. |
| **`debug`** | Logs scoped par module (legacy mais répandu dans les libs Node). |

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone" data-wiki-title="Concept - pino est le logger Node le plus rapide via JSON structuré asynchrone" data-wiki-preview="**pino** est un logger Node optimisé pour la production : il écrit du **JSON structuré** ligne par ligne sur stdout (plutôt que du texte formaté), de façon **asynchrone** via un worker thread, et atteint un débit ~5× supérieur à `console.lo…">Concept - pino est le logger Node le plus rapide via JSON structuré asynchrone</a> *(le pendant prod)*

**Prérequis** :
- Bases de Node + npm/pnpm

**S'oppose à / à comparer avec** :
- **`console.log`** : default JS, pas de niveau, pas de format
- **`chalk` + helpers maison** : tu réinventes consola en moins bien
- **`debug`** : ancien standard mais format minimaliste

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026" data-wiki-title="5 packages Node à inclure dans tout projet 2026" data-wiki-preview="1. **`consola`** — un logger 100× plus agréable que `console.log`. Niveaux, couleurs, formats, intégré aux process Node. 2. **`zod`** (ou `@effect/schema`) — validation runtime + typage compile-time depuis un seul schéma. La fin des `if (!i…">5 packages Node à inclure dans tout projet 2026</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

