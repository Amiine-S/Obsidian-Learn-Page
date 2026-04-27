---
created: '2026-04-26T21:59:06.313Z'
domain: backend
level: beginner
tags:
  - type/concept
  - domain/backend
  - level/beginner
title: >-
  Concept - tsx exécute TypeScript directement via esbuild, 10x plus rapide que
  ts-node
slug: tsx-execute-typescript-directement-via-esbuild-10x-plus-rapide-que-ts-node
excerpt: >-
  Quand tu écris du TS en backend / scripts, tu as deux choix historiques : 1.
  **`tsc` puis `node dist/...`** : build à chaque fois, pénible en dev 2.
  **`ts-node`** : exécute TS directement, mais lent (parser tsc) et galère ESM
oneLiner: >-
  **`tsx`** est un runner Node qui transpile et exécute des fichiers TypeScript
  directement, sans étape de build préalable — il utilise **esbuild** sous le
  capot, ce qui le rend ~10× plus rapide que `ts-node` et en fait l'outil de
  référence pour `dev` scripts, hooks et CLI en TS.
related:
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - backend-infra
topics:
  - backend
  - devops
  - typescript
---
## Idée en une phrase

> **`tsx`** est un runner Node qui transpile et exécute des fichiers TypeScript directement, sans étape de build préalable — il utilise **esbuild** sous le capot, ce qui le rend ~10× plus rapide que `ts-node` et en fait l'outil de référence pour `dev` scripts, hooks et CLI en TS.

## Contexte / pourquoi ça compte

Quand tu écris du TS en backend / scripts, tu as deux choix historiques :
1. **`tsc` puis `node dist/...`** : build à chaque fois, pénible en dev
2. **`ts-node`** : exécute TS directement, mais lent (parser tsc) et galère ESM

`tsx` règle les deux problèmes : démarrage en ~50-200ms (vs 1-3s pour ts-node), ESM natif, watch mode intégré, pas de configuration. C'est devenu le standard de fait en 2026 pour exécuter du TS en dev ou scripts.

## Détails / mécanisme

### Installation

```bash
pnpm add -D tsx
```

### Usage basique

```bash
# Au lieu de
node dist/script.js  # nécessite un build préalable

# Tu écris
tsx script.ts        # exécute directement, transpile à la volée
```

### Watch mode

```bash
tsx watch src/server.ts
# Re-démarre automatiquement quand un fichier .ts change
```

### REPL

```bash
tsx
> const x: number = 42
> console.log(x * 2)
84
```

### Dans `package.json`

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test:e2e": "tsx tests/e2e.ts",
    "migrate": "tsx scripts/migrate.ts",
    "seed": "tsx scripts/seed.ts"
  }
}
```

### Pourquoi c'est rapide

`ts-node` invoque le compilateur TypeScript officiel (TSC), qui :
- Charge tout le programme TS
- Parse tous les fichiers
- Vérifie les types
- Émet du JS

→ Coût démarrage : 1-3 secondes pour un projet moyen.

`tsx` utilise **esbuild**, un transpileur écrit en Go qui :
- **Skip le type-checking** (transpilation only)
- Parse en parallèle
- Émet du JS optimisé

→ Coût démarrage : 50-200ms.

**Conséquence** : tu n'as **pas** de type checking au moment du `tsx`. Tu dois faire `tsc --noEmit` séparément (en pre-commit, en CI, ou via ton éditeur). En pratique, c'est ce que tout le monde fait : `tsc --noEmit` en CI, `tsx` pour exécuter.

### Configuration

Aucune par défaut. Si tu veux customiser :

```json
// package.json
"tsx": {
  "esbuild": {
    "target": "node20",
    "loader": { ".tsx": "tsx" }
  }
}
```

Mais 99% du temps, l'auto-config suffit.

### ESM natif

Avec Node 20+ et `"type": "module"`, tsx supporte ESM nativement :

```typescript
// ESM imports avec extensions .js (convention TS)
import { foo } from './lib.js' // résout lib.ts
import config from './config.json' assert { type: 'json' }
```

Pas besoin de hack `--experimental-loader` ou de double-suffixage.

## Exemple concret

Workflow typique d'un projet Node TS en 2026 :

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  }
}
```

- `pnpm dev` → `tsx watch` lance le serveur, redémarre à chaque save
- `pnpm typecheck` → vérification TS séparée
- `pnpm build` → produit du JS dans `dist/` pour la prod
- `pnpm start` → exécute le JS buildé en prod (Node natif, pas tsx)

### CLI rapide en TS

```typescript
#!/usr/bin/env tsx
import consola from 'consola'

const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'hello': consola.success('Hello!'); break
  case 'time': consola.info(new Date().toISOString()); break
  default: consola.error('Unknown command:', command)
}
```

```bash
chmod +x scripts/cli.ts
./scripts/cli.ts hello   # ✔ Hello!
```

### Alternatives 2026

| Outil | Pour | Avantages |
|---|---|---|
| **`tsx`** | Exécution TS dev / scripts | Le standard de fait, ~10× ts-node |
| **`bun run`** | Si tu utilises Bun comme runtime | Encore plus rapide, supporte TS natif |
| **`tsgo`** (TS 7.0 Beta) | Compilateur TS en Go par Microsoft | À terme remplacement complet de tsc |
| **`ts-node`** | Legacy | À remplacer si possible |
| **`@swc/cli`** | Build ou run via SWC | Concurrent direct d'esbuild |
| **Deno** | Si tu utilises Deno | TS natif depuis le début |

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a> *(complement long terme, pas encore production-ready en avril 2026)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a>

**Prérequis** :
- Bases de Node + TypeScript
- Notion de transpilation vs compilation

**S'oppose à / à comparer avec** :
- **`ts-node`** : ancien standard, ~10× plus lent
- **`node + tsc`** : workflow build-then-run, friction en dev
- **Bun** : runtime alternatif qui exécute TS natif

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026" data-wiki-title="5 packages Node à inclure dans tout projet 2026" data-wiki-preview="1. **`consola`** — un logger 100× plus agréable que `console.log`. Niveaux, couleurs, formats, intégré aux process Node. 2. **`zod`** (ou `@effect/schema`) — validation runtime + typage compile-time depuis un seul schéma. La fin des `if (!i…">5 packages Node à inclure dans tout projet 2026</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

