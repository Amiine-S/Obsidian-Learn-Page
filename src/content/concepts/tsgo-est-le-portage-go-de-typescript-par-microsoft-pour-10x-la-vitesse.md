---
created: 2026-04-25T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la
  vitesse
slug: tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
excerpt: >-
  `tsc` est devenu le **goulot d'étranglement** de plein de projets : on
  type-check 30 secondes à plusieurs minutes à chaque commit, à chaque CI. Le
  LSP (intellisense IDE) rame sur les gros monorepos. Microsoft a évalué les
  options, et plutôt que d'optimiser à la marge, a fait un *
oneLiner: >-
  Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation
  officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera
  la base de **TypeScript 7**.
related:
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
  - frontend
backlinks:
  - 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - frontend
topics:
  - backend
  - devops
  - frontend
  - rust
  - typescript
---

# Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse

## Idée en une phrase

> Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.

## Contexte / pourquoi ça compte

`tsc` est devenu le **goulot d'étranglement** de plein de projets : on type-check 30 secondes à plusieurs minutes à chaque commit, à chaque CI. Le LSP (intellisense IDE) rame sur les gros monorepos. Microsoft a évalué les options, et plutôt que d'optimiser à la marge, a fait un **port complet** vers Go.

C'est la **première fois** que le compilateur de référence d'un langage majeur fait ce genre de migration. Signal fort que l'ère de "JS écrit le tooling JS" touche à sa fin.

## Détails / mécanisme

### Pourquoi Go (et pas Rust) ?

Question récurrente dans la communauté. Les raisons publiques de Hejlsberg :

1. **Portabilité du code source** : la base de code TS est OO, classique, beaucoup d'allocations transitoires. Go (GC + structures simples) ressemble plus à TS que Rust (ownership). L'équipe a pu **transpiler la structure** du code TS existant ligne à ligne, plutôt que de tout repenser.

2. **Concurrence simple** : goroutines + channels collent au pattern de type-checking parallèle (chaque module dans une goroutine, agrégation via channels). Pas besoin de réfléchir aux lifetimes pour une concurrence "raisonnable".

3. **Cible 5-10×, pas 100×** : Microsoft ne court pas après le record. Go suffit largement à passer de "trop lent" à "instantané ressenti".

4. **Capital interne** : Microsoft a une grosse compétence Go (Azure). Pour un projet maintenu par une équipe Microsoft sur 10 ans, c'est un facteur réel.

### Compatibilité

- **1:1 avec tsc** : même CLI, même `tsconfig.json`, même output `.d.ts`, mêmes erreurs
- Pas de rupture de comportement attendue (sinon ce ne serait pas un port mais un nouveau langage)
- Migration : `npm install @typescript/native-preview` → drop-in

### Gains mesurés (preview)

- Type-check du repo VS Code (~1.5M LoC TS) : ~60s → ~7s
- Type-check du repo TypeScript lui-même : ~30s → ~3s
- LSP : réponses sous 100ms même sur gros projets

### Statut

- Preview publique disponible
- Roadmap : devenir la base officielle de **TypeScript 7**
- Pas de date figée — probablement courant 2026-2027

## Exemple concret

```bash
# Aujourd'hui : tsc classique
npx tsc --noEmit
# (60 secondes sur un gros monorepo)

# Avec tsgo preview
npx tsgo --noEmit
# (6 secondes, mêmes erreurs, mêmes types)
```

Pour un projet pilote, tu peux le brancher dans la CI en parallèle de `tsc` actuel pour comparer, sans impact sur le build.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a> *(la tendance globale)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse" data-wiki-title="Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse" data-wiki-preview="**oxlint** (linter) et **oxfmt** (formatter) sont les briques Rust de l'écosystème **oxc**, qui réécrit toute la chaîne de tooling JS en Rust. Gain typique : 50-100× plus rapide qu'ESLint/Prettier sur les mêmes opérations.">Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse</a> *(autre brique du même mouvement)*

**Prérequis** :
- Avoir utilisé `tsc` et ressenti la lenteur

**S'oppose à / à comparer avec** :
- **stc** (TypeScript checker en Rust, projet de Donny — abandonné/stalled) : Go a gagné cette course
- **swc-tsc** : SWC visait aussi un type-checker, projet pas finalisé
- **Bun bunx tsc** : juste un wrapper sur tsc, pas un type-checker indépendant

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif" data-wiki-title="tsgo, oxlint, oxfmt — l'écosystème JS passe au natif" data-wiki-preview="1. **tsgo** : portage de TypeScript en **Go** par Microsoft (annoncé en mars 2025 par Anders Hejlsberg). Vise ~10× la vitesse de type-checking. Sera la base de **TypeScript 7**. 2. **oxlint** : linter Rust de l'écosystème **oxc** (par Boshe…">tsgo, oxlint, oxfmt — l'écosystème JS passe au natif</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

