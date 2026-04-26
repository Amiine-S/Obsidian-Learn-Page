---
created: 2026-04-25T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf
slug: l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
excerpt: >-
  C'est une **rupture de génération** silencieuse mais profonde. Pendant 15 ans,
  le tooling JS a été écrit en JS — naturel, accessible, contributions ouvertes.
  Mais les monorepos modernes (Nx, Turbo, Bazel) tapent dans 10⁴ à 10⁶ fichiers,
  et V8 atteint un mur sur ce type de workloa
oneLiner: >-
  Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes —
  est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les
  workloads CPU-bound (parsing, AST, traversal).
related:
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - cargo-unifie-build-test-doc-et-lint-en-un-seul-outil
  - 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
  - frontend
backlinks:
  - 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - frontend
topics:
  - frontend
  - rust
---

# Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf

## Idée en une phrase

> Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).

## Contexte / pourquoi ça compte

C'est une **rupture de génération** silencieuse mais profonde. Pendant 15 ans, le tooling JS a été écrit en JS — naturel, accessible, contributions ouvertes. Mais les monorepos modernes (Nx, Turbo, Bazel) tapent dans 10⁴ à 10⁶ fichiers, et V8 atteint un mur sur ce type de workload.

En 2026, démarrer un nouveau projet **sans envisager du tooling Rust/Go** = signer pour subir une CI lente et des dev loops frustrants.

## Détails / mécanisme

### Pourquoi V8 cale sur le tooling

V8 est excellent pour de la logique applicative (allocations courtes, branches imprévisibles). Il **gaspille** sur :
- **Parsing/traversal AST** : millions d'allocations courtes de noeuds → pression GC
- **Boucles serrées** sur des structures uniformes → V8 dé-optimise
- **Multi-threading CPU-bound** : Worker threads ne partagent pas la mémoire efficacement (pas de SharedArrayBuffer pour des objets, juste pour des bytes)
- **SIMD, layout mémoire contrôlé** : impossible

Rust et Go offrent les trois : threads natifs, allocations contrôlées, layout mémoire prédictible.

### Tableau de bord du remplacement (état 2026)

| Catégorie | Ancien (JS) | Nouveau (Rust/Go/Zig) | Gain typique |
|---|---|---|---|
| **Bundlers** | webpack, rollup | Turbopack, Rolldown, Rspack, esbuild | 10-100× |
| **Linters** | ESLint | oxlint, Biome | 50-100× |
| **Formatters** | Prettier | Biome, oxfmt, dprint | 30-80× |
| **Type checkers** | tsc | tsgo (Go) | 5-10× |
| **Transformers** | Babel | SWC, oxc_transformer | 20-50× |
| **Runtimes** | Node | Bun (Zig), Deno (Rust) | 2-5× |
| **Test runners** | Jest, Vitest | Bun test, Vitest sur SWC | 3-10× |

### Implications concrètes

- **Stack 2024 typique** : `node + tsc + eslint + prettier + jest + webpack` → CI lente, dev loop "ça se met à compiler"
- **Stack 2026 possible** : `bun + tsgo + biome + bun test + rspack` → tout instantané

Le **mental shift** : tu ne vis plus avec une CI à 5 minutes — tu vis avec une CI à 30 secondes. Ça change la culture (commits plus fréquents, retours plus courts, plus de tests).

### Ce qui reste en JS

- Les frameworks applicatifs (React, Vue, Svelte, Next, Remix) — pas de raison de bouger
- Les libs métier — idem
- Le linting de **rules custom** : ESLint reste pertinent pour les règles spécifiques à ton domaine

## Exemple concret

Migration progressive d'une stack TS-only :

```jsonc
// package.json — avant
{
  "scripts": {
    "lint": "eslint .",                   // 60s
    "format": "prettier --write .",       // 30s
    "typecheck": "tsc --noEmit",          // 45s
    "build": "webpack",                   // 90s
    "test": "vitest run"                  // 40s
  }
}

// package.json — après (drop-in Rust/Go)
{
  "scripts": {
    "lint": "oxlint",                     // 1.5s
    "format": "biome format --write .",   // 1s
    "typecheck": "tsgo --noEmit",         // 5s
    "build": "rspack build",              // 8s
    "test": "vitest run"                  // déjà rapide
  }
}
```

Tu peux migrer tâche par tâche, sans tout péter. C'est le gros avantage : ces outils visent le **drop-in**.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse" data-wiki-title="Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse" data-wiki-preview="**oxlint** (linter) et **oxfmt** (formatter) sont les briques Rust de l'écosystème **oxc**, qui réécrit toute la chaîne de tooling JS en Rust. Gain typique : 50-100× plus rapide qu'ESLint/Prettier sur les mêmes opérations.">Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/cargo-unifie-build-test-doc-et-lint-en-un-seul-outil" data-wiki-title="Concept - Cargo unifie build test doc et lint en un seul outil" data-wiki-preview="Là où l'écosystème JS empile `npm` + `tsc` + `vite` + `vitest` + `eslint` + `prettier` + `typedoc`, Rust met **tout** dans `cargo` — un seul outil officiel, intégré, cohérent.">Concept - Cargo unifie build test doc et lint en un seul outil</a> *(à terme, le tooling JS pourrait converger vers une intégration cargo-like)*

**Prérequis** :
- Avoir vécu une CI lente sur gros repo

**S'oppose à / à comparer avec** :
- **L'ère "JS écrit le tooling JS" (2010-2020)** : facilité de contribution mais perfs faibles
- **Approche bytecode (Java/.NET)** : compile en bytecode, JIT — autre solution mais pas le chemin que JS a pris

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif" data-wiki-title="tsgo, oxlint, oxfmt — l'écosystème JS passe au natif" data-wiki-preview="1. **tsgo** : portage de TypeScript en **Go** par Microsoft (annoncé en mars 2025 par Anders Hejlsberg). Vise ~10× la vitesse de type-checking. Sera la base de **TypeScript 7**. 2. **oxlint** : linter Rust de l'écosystème **oxc** (par Boshe…">tsgo, oxlint, oxfmt — l'écosystème JS passe au natif</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

