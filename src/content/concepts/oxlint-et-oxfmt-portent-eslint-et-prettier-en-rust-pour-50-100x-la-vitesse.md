---
created: 2026-04-25T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la
  vitesse
slug: oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
excerpt: >-
  ESLint et Prettier sont **les goulots d'étranglement les plus fréquents** d'un
  projet TS moderne après tsc : - ESLint : full lint d'un repo monolithique =
  30s à plusieurs minutes - Prettier : formattage de tous les fichiers = idem -
  Pre-commit hooks deviennent insupportables sur
oneLiner: >-
  **oxlint** (linter) et **oxfmt** (formatter) sont les briques Rust de
  l'écosystème **oxc**, qui réécrit toute la chaîne de tooling JS en Rust. Gain
  typique : 50-100× plus rapide qu'ESLint/Prettier sur les mêmes opérations.
related:
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
  - frontend
backlinks:
  - 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - frontend
topics:
  - backend
  - devops
  - frontend
  - rust
  - typescript
---

# Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse

## Idée en une phrase

> **oxlint** (linter) et **oxfmt** (formatter) sont les briques Rust de l'écosystème **oxc**, qui réécrit toute la chaîne de tooling JS en Rust. Gain typique : 50-100× plus rapide qu'ESLint/Prettier sur les mêmes opérations.

## Contexte / pourquoi ça compte

ESLint et Prettier sont **les goulots d'étranglement les plus fréquents** d'un projet TS moderne après tsc :
- ESLint : full lint d'un repo monolithique = 30s à plusieurs minutes
- Prettier : formattage de tous les fichiers = idem
- Pre-commit hooks deviennent insupportables sur les gros projets

Le port en Rust (par **Boshen** et l'équipe oxc) attaque ce problème à la racine en :
- Réécrivant le parser de zéro (le plus rapide JS/TS parser actuel)
- Parallélisant agressivement (Rust threads natifs)
- Évitant les allocations massives typiques de Node.js

## Détails / mécanisme

### oxlint

**Statut** : stable, prod-ready depuis 2024.

**Approche** : pas un sur-ensemble d'ESLint. L'équipe a porté **les rules les plus utilisées** :
- Règles ESLint core (`no-unused-vars`, `no-undef`, `eqeqeq`, …)
- typescript-eslint (les règles essentielles)
- eslint-plugin-react / react-hooks
- eslint-plugin-jsx-a11y
- eslint-plugin-import (résolution de modules)

Pas (encore) toutes les rules. Si tu utilises des plugins custom ou très rares, tu garderas ESLint en complément.

**Drop-in progressif** : tu peux runner `oxlint` en parallèle d'ESLint, comparer, basculer rule par rule.

**Vitesse** : sur un monorepo de 10000 fichiers, ESLint = 90s, oxlint = 1.2s. Sur de la CI/pre-commit, c'est un changement **qualitatif** — le lint devient invisible.

### oxfmt

**Statut** : plus récent, en route vers stable.

**Concurrent direct** : **Biome** (https://biomejs.dev), aussi en Rust, plus mature côté formatter (drop-in Prettier). Si tu veux un formatter Rust *aujourd'hui*, **Biome est probablement le bon choix**. oxfmt rattrape.

**Différence philosophique** :
- **Biome** = un seul outil qui fait tout (linter + formatter + parseur)
- **oxc** = briques composables (oxlint, oxfmt, oxc_transformer, etc., utilisables séparément)

### Adoption en prod

- **Shopify** : oxlint en CI sur leur monorepo (Hydrogen)
- **Airbnb**, **Mongoose**, **Ant Design** : pareil
- **Rspack** (le bundler Rust) : utilise oxc en interne

## Exemple concret

```bash
# Avant : ESLint
npx eslint . --max-warnings=0
# 60-90 secondes sur un gros monorepo

# Après : oxlint (drop-in progressif)
npx oxlint
# 1-2 secondes, mêmes erreurs sur les rules portées
```

Configuration : oxlint lit ton `.eslintrc.json` en best-effort, ou tu lui donnes son propre `oxlintrc.json` :

```json
{
  "rules": {
    "no-unused-vars": "error",
    "react/jsx-uses-vars": "error"
  }
}
```

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a> *(la tendance globale)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a> *(autre brique du même mouvement)*

**Prérequis** :
- Avoir utilisé ESLint/Prettier et ressenti la lenteur sur gros repo

**S'oppose à / à comparer avec** :
- **ESLint** (JS, lent) : encore standard mais détrôné en perf
- **Prettier** (JS, lent) : idem
- **Biome** (Rust, unifié) : concurrent direct d'oxc, plus mature côté formatter
- **dprint** (Rust, formatter only) : autre alternative formatter

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif" data-wiki-title="tsgo, oxlint, oxfmt — l'écosystème JS passe au natif" data-wiki-preview="1. **tsgo** : portage de TypeScript en **Go** par Microsoft (annoncé en mars 2025 par Anders Hejlsberg). Vise ~10× la vitesse de type-checking. Sera la base de **TypeScript 7**. 2. **oxlint** : linter Rust de l'écosystème **oxc** (par Boshe…">tsgo, oxlint, oxfmt — l'écosystème JS passe au natif</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

