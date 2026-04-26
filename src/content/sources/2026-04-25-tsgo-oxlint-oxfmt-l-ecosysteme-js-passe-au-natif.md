---
title: 'tsgo, oxlint, oxfmt — l''écosystème JS passe au natif'
author: Claude (synthèse)
digested: 2026-04-25T00:00:00.000Z
format: doc
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/intermediate
slug: 2026-04-25-tsgo-oxlint-oxfmt-l-ecosysteme-js-passe-au-natif
excerpt: >-
  1. **tsgo** : portage de TypeScript en **Go** par Microsoft (annoncé en mars
  2025 par Anders Hejlsberg). Vise ~10× la vitesse de type-checking. Sera la
  base de **TypeScript 7**. 2. **oxlint** : linter Rust de l'écosystème **oxc**
  (par Boshen). 50-100× plus rapide qu'ESLint. Stabl
related:
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - frontend
backlinks:
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
topics:
  - ai
  - devops
  - frontend
  - infra
  - javascript
  - performance
  - react
  - rust
  - systems
  - tooling
  - typescript
---

# tsgo, oxlint, oxfmt — l'écosystème JS passe au natif

## Pourquoi cette source

> 2024-2026 = la grande **réécriture de l'outillage JS en langages bas-niveau** (Rust, Go). `tsc`, `eslint`, `prettier`, `webpack`, `babel` : tous remplacés ou en cours. C'est une **rupture de génération** dans le tooling — comprendre les acteurs et le pourquoi devient essentiel pour ne pas rester sur du legacy.

## Résumé en 5 lignes

1. **tsgo** : portage de TypeScript en **Go** par Microsoft (annoncé en mars 2025 par Anders Hejlsberg). Vise ~10× la vitesse de type-checking. Sera la base de **TypeScript 7**.
2. **oxlint** : linter Rust de l'écosystème **oxc** (par Boshen). 50-100× plus rapide qu'ESLint. Stable et utilisé en prod (Shopify, Airbnb…).
3. **oxfmt** : formatter Rust de la même famille oxc. Plus récent, alternative à Prettier.
4. **Concurrent direct côté formatter/linter unifié** : **Biome** (fork de Rome, Rust aussi), plus mature côté formatter.
5. Le **pourquoi commun** : V8 + JS sur des outils CPU-bound (parsers, AST walks) atteint un mur de perf. Rust et Go offrent x10 à x100 sur ces workloads, surtout sur monorepos.

---

## 1. Le contexte — pourquoi ce mouvement maintenant

JS s'est imposé comme langage d'outillage parce que les outils sont écrits par les devs JS pour les devs JS (`webpack`, `babel`, `eslint`, `prettier`, `tsc` — tous en JS/TS). Ça avait du sens : un seul runtime, contributions faciles.

**Mais** :
- Les **monorepos** modernes (Nx, Turborepo) tapent dans des dizaines de milliers de fichiers
- `tsc` sur un gros projet = 30s à plusieurs minutes à chaque check
- `eslint` sur un repo entier = idem
- Les pipelines CI deviennent dominés par l'attente de tooling

Le runtime V8 (et son JIT) est rapide pour de la logique applicative, mais **gaspille** pour du parsing/traversal d'AST en boucle :
- Allocations massives → pause GC
- Pas de threads CPU-bound (Worker threads ≠ vrais threads partagés)
- Pas de SIMD, pas de contrôle bas-niveau

Rust et Go résolvent les deux problèmes : threads natifs + zero-cost / GC tuned. Et accessoirement, **mêmes runtimes** que les langages "système" — donc plus faciles à maintenir pour Microsoft, Cloudflare, etc., qui ont déjà ces compétences.

---

## 2. tsgo — TypeScript en Go

### Ce que c'est

En **mars 2025**, Microsoft (Anders Hejlsberg, créateur de TS) a annoncé le **portage de tsc en Go**, sous le nom interne *tsgo* (alias projet "Corsa"). Ce sera la base de **TypeScript 7**.

### Pourquoi Go (et pas Rust) ?

Question récurrente. Réponses publiques de Hejlsberg :
- **Portage 1:1** : Go ressemble plus à TypeScript (GC, structures simples) que Rust (ownership). Le port a pu être fait en transpilant la structure du code TS existant.
- **Concurrence** : goroutines + channels collent bien au pattern de type-checking parallélisable
- **Teams familiarité** : Microsoft a une grosse équipe Go (Azure)
- Pas de course aux perfs absolues : ils visent **5-10×**, pas 100× — Go suffit largement

### Gain attendu

- Type-check d'un gros projet (~1.5M LoC) : de ~60s avec tsc à ~6s avec tsgo
- LSP (langage server pour ton IDE) : réactivité immédiate, plus de "intellisense qui rame"
- Compilation d'un projet : du même ordre

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a>

### Statut

- Preview disponible (npm `@typescript/native-preview` ou similaire selon la roadmap)
- Compatible 1:1 avec tsc actuel (même config, même output)
- Prévu comme remplacement officiel **dans TypeScript 7** (date pas figée, probablement 2026-2027)

---

## 3. oxc — l'écosystème Rust pour JS

### Ce que c'est

**oxc** = "the JavaScript Oxidation Compiler". Projet open source porté par **Boshen**, qui réimplémente toute la chaîne d'outillage JS en Rust :

| Composant | Rôle | Statut |
|---|---|---|
| `oxc_parser` | Parser JS/TS/JSX | Stable, le + rapide |
| `oxlint` | Linter (alternative ESLint) | **Stable, prod-ready** |
| `oxc_transformer` | Transformer (alternative Babel) | Bêta avancée |
| `oxc_minifier` | Minifier (alternative Terser) | Bêta |
| `oxfmt` | Formatter (alternative Prettier) | Plus récent, en avance vers stable |
| `oxc_resolver` | Résolution de modules | Stable, utilisé par Rspack, etc. |

### oxlint en particulier

- **50 à 100× plus rapide** qu'ESLint (selon la taille du projet et les rules)
- Pas un sur-ensemble : il a porté **les rules les plus utilisées** (typescript-eslint, eslint-plugin-react, jsx-a11y, etc.)
- **Drop-in** pour ces rules : tu peux le runner en plus d'ESLint, ou progressivement le remplacer
- Utilisé en prod par Shopify, Airbnb, Mongoose, Ant Design

### oxfmt

- Plus récent que oxlint
- Alternative à Prettier (en Rust)
- Pas encore aussi mature que Biome côté formatter

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/oxlint-et-oxfmt-portent-eslint-et-prettier-en-rust-pour-50-100x-la-vitesse" data-wiki-title="Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse" data-wiki-preview="**oxlint** (linter) et **oxfmt** (formatter) sont les briques Rust de l'écosystème **oxc**, qui réécrit toute la chaîne de tooling JS en Rust. Gain typique : 50-100× plus rapide qu'ESLint/Prettier sur les mêmes opérations.">Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse</a>

---

## 4. Biome — l'autre acteur Rust

⚠️ Important : **oxc n'est pas seul**. **Biome** (https://biomejs.dev) est l'autre projet majeur, fork de l'ancien **Rome**.

| | Biome | oxc |
|---|---|---|
| Linter | ✅ stable | ✅ stable (oxlint) |
| Formatter | ✅ stable, **drop-in Prettier** | 🟡 en cours (oxfmt) |
| Vision | "Tout-en-un unifié" | "Briques composables" |
| Maturité | + mature côté formatter | + rapide, plus modulaire |

Si tu veux **un seul outil** qui remplace ESLint + Prettier *aujourd'hui*, **Biome est probablement le bon choix**. Si tu veux du **best-of-breed** modulaire, oxlint + (en attendant) Prettier.

---

## 5. Le mouvement plus large

Rust/Go ont déjà conquis :

- **Bundlers** : Turbopack (Vercel, Rust), Rolldown (Rust, Vite v6+), esbuild (Go), Rspack (Rust)
- **Linters** : oxlint (Rust), Biome (Rust)
- **Formatters** : Biome (Rust), dprint (Rust), oxfmt (Rust)
- **Type checkers** : tsgo (Go) — le dernier domino
- **Runtimes** : Bun (Zig), Deno (Rust)
- **Package managers** : Bun, pnpm (cœur en JS mais gagnant), turbo (Rust)

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a>

**Implication concrète pour toi** : sur un nouveau projet en 2026, tu peux raisonnablement remplacer :
- `tsc` → tsgo (preview)
- `eslint + prettier` → Biome
- `webpack` → Rspack ou Vite
- `node` → Bun (selon stack)

Et gagner facilement **5-10×** sur les builds et la CI.

---

## Citations brutes

> *"TypeScript is being ported to Go for a 10× speedup."* — Anders Hejlsberg, 11 mars 2025.

> *"oxc is the fastest JavaScript/TypeScript parser written in Rust."* — site oxc.

---

## À explorer ensuite

- Tester **tsgo** sur ton repo actuel : preview npm + comparer le temps de type-check
- Migrer un projet pilote vers **Biome** : `npx @biomejs/biome init`
- Comprendre **comment Bun fonctionne** (pas Rust mais Zig — autre rupture de génération)
- **Rolldown** : le bundler qui remplace Rollup et drive Vite v6+

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

