---
created: 2026-04-27T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - Le speedup 10x de TS 7.0 vient de Go + multi-threading +
  type-checker réécrit
slug: le-speedup-10x-de-ts-70-vient-de-go-multi-threading-type-checker-reecrit
excerpt: >-
  Le narrative populaire dit "TS est plus rapide parce que Go est rapide". C'est
  partiellement vrai, mais réducteur. Sans réécriture du type-checker, le port
  Go aurait gagné 2-3×, pas 10×. Sans multi-threading, encore moins. Le 10×
  vient de **trois optimisations cumulatives**, et c
oneLiner: >-
  TypeScript 7.0 est ~10× plus rapide que 6.0 grâce à **trois leviers cumulés**
  : 1) **code natif Go** au lieu de JS interprété par V8, 2) **multi-threading**
  via goroutines pour paralléliser le check sur tous les cores, 3)
  **type-checker réécrit from scratch** avec des structures de données plus
  efficientes que la version JS historique.
related:
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - 2026-04-27-typescript-70-beta-le-compilateur-go-natif
  - backend-infra
topics:
  - backend
---
## Idée en une phrase

> TypeScript 7.0 est ~10× plus rapide que 6.0 grâce à **trois leviers cumulés** : 1) **code natif Go** au lieu de JS interprété par V8, 2) **multi-threading** via goroutines pour paralléliser le check sur tous les cores, 3) **type-checker réécrit from scratch** avec des structures de données plus efficientes que la version JS historique.

## Contexte / pourquoi ça compte

Le narrative populaire dit "TS est plus rapide parce que Go est rapide". C'est partiellement vrai, mais réducteur. Sans réécriture du type-checker, le port Go aurait gagné 2-3×, pas 10×. Sans multi-threading, encore moins. Le 10× vient de **trois optimisations cumulatives**, et chacune mérite d'être comprise pour ne pas attendre la même magie sur d'autres outils.

C'est aussi un cas d'école d'**ingénierie de réécriture** : Microsoft avait l'option "porter ligne par ligne le code TS en Go" (gain ~2-3×) ou "repenser l'architecture" (gain ~10× mais 2 ans de travail). Ils ont choisi la seconde.

## Détails / mécanisme

### Levier 1 — Go vs JS interprété

Le compilateur tsc 6.x est du TS compilé en JS, exécuté sur Node. Conséquences :
- **JIT V8** : doit interpréter d'abord, puis JIT (warm-up coût)
- **GC en pause** : V8 stoppe le world pendant les majeurs (rare mais visible)
- **Single-threaded** : Node est mono-thread par défaut
- **Allocations diffuses** : strings JS sont immuables, beaucoup d'allocations transient

Go résout :
- Code natif compilé AOT (ahead-of-time), pas d'interpréteur
- GC concurrent low-pause
- Goroutines légères (1000s OK)
- Strings/byte slices plus efficients

Gain solo : **2-3×**.

### Levier 2 — Multi-threading

Le type-checker TS fait beaucoup de travail indépendant : check de chaque fichier, résolution des modules, inférence des types. En théorie parallélisable, en pratique impossible en Node single-thread.

En Go, Microsoft a parallélisé :
- **Module resolution** : N fichiers résolus en parallèle
- **Per-file type-check** : les fichiers indépendants checkés en goroutines
- **Diagnostics aggregation** : merge final concurrent

Sur une machine 8-core, tu utilises 6-7 cores en même temps (pas 100% à cause des dépendances inter-fichiers).

Gain : **2-3×** supplémentaire.

### Levier 3 — Type-checker réécrit

Le type system de TS (en TS) avait accumulé 10+ ans de patches, classes, héritage, layers. Microsoft a profité du port pour **repenser** :
- **Symbol tables** : structures de données plus efficientes (hash maps vs object property lookups)
- **Type representations** : mémoire compacte, cache-friendly
- **Inference algorithms** : algos optimisés (memoization, sharing)
- **Diagnostics** : lazy generation, ne calcule pas si pas demandé

Gain : **1.5-2×** supplémentaire.

### Cumul

```
Code natif : 2.5×
× Multi-threading : 2.5×
× Type-checker rewrite : 1.5×
─────────
≈ 9.4×
```

D'où le ~10× annoncé. Sur certaines codebases, le facteur va à 12-15× (très parallélisable). Sur d'autres, il descend à 5-7× (très séquentiel).

### Ce qui ne change PAS

- Le **langage TypeScript** : zéro feature nouvelle, zéro changement syntaxique
- Le **comportement de check** : 99%+ parité avec 6.x sur les diagnostics
- Le **`tsconfig.json`** : 100% compat
- L'**API** programatique (pour outils écrits sur tsc) : conservée mais portée

C'est strictement un **port + optimisations internes**. Vu de l'utilisateur, c'est plus rapide. Vu du code source, tout marche pareil.

### Pourquoi pas Rust ?

Question fréquente : "pourquoi Go et pas Rust ?". Réponses Microsoft :
- **Familiarité interne** : Microsoft a des équipes Go étendues (Azure SDK, Kubernetes, etc.)
- **GC** : un compilateur a besoin de gérer beaucoup de structures temporaires ; le GC Go simplifie vs ownership Rust
- **Goroutines** : modèle de concurrence très simple à utiliser, idéal pour paralléliser un compilateur
- **Time-to-market** : Go a permis de livrer en 2 ans plutôt qu'en 4 que Rust aurait demandé

Rust aurait peut-être donné +20% de perf, au prix de 2× le temps de dev. Trade-off raisonnable.

## Exemple concret

Mesurer toi-même la différence sur ton projet :

```bash
# Sans tsgo
time npx tsc --noEmit > /dev/null
# real    0m32.418s

# Avec tsgo (après install @typescript/native-preview@beta)
time npx tsgo --noEmit > /dev/null
# real    0m3.215s

# Speedup : 10×
```

Sur un projet de ~50k LOC, c'est typiquement ~10×. Sur un projet de ~5k LOC, 5×. Sur un monorepo de 500k+ LOC, jusqu'à 15× (parallélisme paie).

### L'effet UX en éditeur

Le tsserver (LSP backend dans VS Code) tourne en JS comme tsc 6.x. Quand tu tapes du code, il :
1. Re-check le fichier modifié
2. Recalcule les diagnostics
3. Met à jour autocomplete

Sur un gros projet en TS 6.x : **300-1000ms** de délai. Avec tsgo (extension TypeScript Native Preview) : **30-100ms**. Tu **sens** la différence dans tes doigts. C'est ce qui rend tsgo réellement utilisable au quotidien.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a> *(la version courte du concept — celle-ci ajoute le détail des leviers)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a>

**Prérequis** :
- Bases du compilateur TypeScript
- Notion de single-thread vs multi-thread

**S'oppose à / à comparer avec** :
- **`oxc`** (Rust, type-checker dans le pipeline oxc) : approche Rust, encore en alpha, perfs visées comparables
- **`swc-checker`** : abandonné — l'équipe SWC a renoncé à un type-checker complet, focalisée sur transpilation
- **Bundling tools (Vite, esbuild)** : ne font pas de type-check, complémentaires à tsgo

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-typescript-70-beta-le-compilateur-go-natif" data-wiki-title="TypeScript 7.0 Beta — le compilateur Go natif" data-wiki-preview="1. **Compilateur réécrit en Go** : la nouvelle implémentation tourne en binaire natif via `tsgo` (à terme renommé `tsc`). Le speedup mesuré est constant : **5× à 15×** selon les workloads, **~10× moyenne**. 2. **Sémantique TypeScript identi…">TypeScript 7.0 Beta — le compilateur Go natif</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

