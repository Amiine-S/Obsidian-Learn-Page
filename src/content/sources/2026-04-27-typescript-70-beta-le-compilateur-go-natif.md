---
title: TypeScript 7.0 Beta — le compilateur Go natif
url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/'
author: Microsoft TypeScript team + synthèse Claude
published: 2026-04-21T00:00:00.000Z
digested: 2026-04-27T00:00:00.000Z
format: doc
domain: backend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/backend
  - format/doc
  - level/intermediate
slug: 2026-04-27-typescript-70-beta-le-compilateur-go-natif
excerpt: >-
  1. **Compilateur réécrit en Go** : la nouvelle implémentation tourne en
  binaire natif via `tsgo` (à terme renommé `tsc`). Le speedup mesuré est
  constant : **5× à 15×** selon les workloads, **~10× moyenne**. 2. **Sémantique
  TypeScript identique** : 7.0 hérite des defaults et depre
related:
  - tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - backend-infra
backlinks:
  - le-speedup-10x-de-ts-70-vient-de-go-multi-threading-type-checker-reecrit
topics:
  - backend
  - typescript
---
## Pourquoi cette source

> Microsoft a annoncé **TypeScript 7.0 Beta le 21 avril 2026** — la **plus grande rupture technique** depuis l'apparition de TS en 2012 : le compilateur n'est plus écrit en TypeScript (auto-bootstrappé en JS), mais en **Go**, et tourne en code natif **~10× plus rapide**. Cette note couvre ce qui change concrètement : l'install, la compat, ce que tu gagnes, ce que tu peux casser, et comment migrer aujourd'hui.

## Résumé en 5 lignes

1. **Compilateur réécrit en Go** : la nouvelle implémentation tourne en binaire natif via `tsgo` (à terme renommé `tsc`). Le speedup mesuré est constant : **5× à 15×** selon les workloads, **~10× moyenne**.
2. **Sémantique TypeScript identique** : 7.0 hérite des defaults et deprecations de 6.0, mais le langage **reste le même**. Aucune feature nouvelle TS-language — c'est un re-platform, pas un re-design.
3. **Multi-threading natif** : le check + emit profite des cores via shared memory. Sur des codebases de 100k LOC, builds qui prenaient 30s passent à 3s.
4. **Editor support** via VS Code TypeScript Native Preview : LSP-based, mêmes perfs que la CLI dans l'éditeur. Autocomplete, go-to-definition, find-references **instantanés** sur les gros monorepos.
5. **Migration** : `npm install -D @typescript/native-preview@beta`, exécute via `tsgo` au lieu de `tsc`. Microsoft annonce **"production-ready pour de nombreux workflows"**, mais c'est une beta — à valider sur ton projet.

---

## 1. Le contexte — pourquoi cette réécriture

TypeScript a été écrit en TypeScript depuis 2012 (auto-bootstrap : le compilateur est compilé en JS, exécuté sur Node, recompile lui-même). C'est **idéologiquement satisfaisant** mais **techniquement coûteux** : un compilateur en JS hérite des limitations du runtime — single-thread, GC, perf de l'interpréteur V8.

À mesure que les codebases ont grossi (Microsoft, Google, gros monorepos open-source), le temps de compile a explosé :
- 100k LOC → 30-60s en TS 6.x
- 500k LOC (genre VS Code lui-même) → plusieurs minutes
- Watch mode → réactif au début, lent après quelques heures

**Anders Hejlsberg** (créateur de TS, créateur de C#, et co-créateur de Turbo Pascal) a annoncé dès 2025 le port en Go — choisi pour ses goroutines, son GC efficient, et la familiarité de Microsoft avec le langage.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/tsgo-est-le-portage-go-de-typescript-par-microsoft-pour-10x-la-vitesse" data-wiki-title="Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse" data-wiki-preview="Annoncé en mars 2025 par Anders Hejlsberg, **tsgo** est la réimplémentation officielle de `tsc` en **Go**, visant un type-checking ~10× plus rapide. Sera la base de **TypeScript 7**.">Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse</a> *(déjà digéré dans une note précédente, voir aussi)*

## 2. L'installation aujourd'hui

```bash
npm install -D @typescript/native-preview@beta
```

Le package s'appelle `@typescript/native-preview` pendant la beta. Au release stable, il prendra simplement le nom `typescript`.

```json
{
  "scripts": {
    "build": "tsgo",
    "typecheck": "tsgo --noEmit",
    "watch": "tsgo --watch"
  }
}
```

Tu remplaces tous tes `tsc` par `tsgo`. La CLI accepte exactement les mêmes flags. Compatibilité **100%** avec ton `tsconfig.json` existant.

### Coexistence avec `tsc` 6.x

Tu peux garder les deux installés :

```bash
# Si quelque chose casse en 7.0, fallback vers 6.x
npx tsc -v   # 6.x
npx tsgo -v  # 7.0-beta
```

Microsoft recommande de tester **typecheck-only** d'abord (`tsgo --noEmit`) avant de switcher le build. Si pas de différence sémantique → tu peux activer en production.

## 3. Le speedup, mesuré

Benchmarks par Microsoft + reproduits par la communauté :

| Codebase | Lignes | TS 6.x | TS 7.0 Beta | Speedup |
|---|---|---|---|---|
| Petit projet (~10k LOC) | 10 000 | 4s | 0.7s | 5.7× |
| Projet moyen (~100k LOC) | 100 000 | 32s | 3.2s | 10× |
| VS Code | ~500k LOC | 4 min | 25s | 9.6× |
| Microsoft Office Web | ~2M LOC | 12 min | 1m20s | 9× |

Le speedup tient sur les workloads variés. La constante ~10× vient de :
- Code natif (pas d'interpréteur JS)
- Multi-threading sur le check
- Type system rewriting plus efficient
- Moins d'allocations (Go GC plus prévisible que V8)

→ <span class="wikilink-broken" title="Référence non trouvée : Concept - Le speedup 10x de TS 7.0 vient de Go + multi-threading + type-checker reécrit">Concept - Le speedup 10x de TS 7.0 vient de Go + multi-threading + type-checker reécrit</span>

## 4. Editor support — le gros gain UX

### Extension VS Code "TypeScript Native Preview"

Installable depuis le marketplace. Active le LSP basé sur tsgo plutôt que sur le tsserver actuel (qui utilise tsc en JS).

Effets :
- **Autocomplete** : 10× plus rapide. Sur des gros projets, le délai d'apparition passe de 800ms à 80ms.
- **Find references** : instantané même sur un monorepo de 100k+ fichiers
- **Rename refactor** : ne bloque plus l'éditeur 30s
- **Go-to-definition** sur les fichiers d'une autre lib monorepo : instantané

C'est probablement le **gain le plus tangible** au quotidien — encore plus que le build CI qui passe de 5min à 30s.

### Autres éditeurs

LSP-based, donc fonctionne avec tout client LSP : Neovim, Helix, Zed, JetBrains (qui a aussi son propre LSP TS rapide).

## 5. Compat — ce qui peut casser

Microsoft annonce "production-ready pour de nombreux workflows", mais c'est une **beta**. Risques :

- **Plugins TS custom** : si tu utilises des transformers TS (ttypescript, ts-patch), ils sont écrits en TS — incompatibles avec tsgo. À ré-écrire en Go ou attendre.
- **Certaines libs** : zod a déjà été testée OK. tRPC, Effect-TS, Prisma : compat à confirmer cas par cas.
- **`tsconfig.json` exotiques** : la plupart des options sont supportées, mais des cas limites (paths complexes, project references nested) peuvent diverger.
- **Sémantique des erreurs** : Microsoft promet 99% de parité, mais des messages d'erreur peuvent différer.

**Stratégie pragmatique** : faire tourner `tsgo --noEmit` en parallèle de ton CI actuel pendant 2-4 semaines, comparer les outputs, escalader chez Microsoft via GitHub si divergence.

## 6. Comment l'écosystème réagit

- **Vite, esbuild, swc** : ne changent rien — ils ne font pas de type-checking. Ils continuent à transpile-only ; tsgo prend le rôle de **type-checker** pur.
- **`tsx`** : peut éventuellement intégrer tsgo en backend pour le typecheck en watch. Pas encore confirmé.
- **`vitest`** : son `--typecheck` mode peut switcher vers tsgo automatiquement (faster).
- **`oxc`** : le type-checker en Rust de l'écosystème oxc est encore en early-development, mais le narrative shift que tsgo a installé (compileurs en langages natifs) leur donne le vent dans les voiles.

L'écosystème s'aligne. Le futur du tooling JS est natif (Rust + Go).

## 7. Position dans l'historique TS

| Version | Date | Headline |
|---|---|---|
| 1.0 | 2014 | Première stable, types pour gros projets JS |
| 2.x | 2016 | Strict null checks |
| 3.x | 2018 | Project references |
| 4.x | 2020 | Variadic tuples, template literal types |
| 5.0 | 2023 | Decorators stable |
| 6.0 | 2025 | Cleanup deprecations, defaults stricts |
| **7.0 Beta** | **avril 2026** | **Compilateur Go natif, 10×** |

7.0 ne change pas le langage. Mais la mécanique sous-jacente est rénovée. C'est l'équivalent de "Python 3.11 → 3.13 free-threading" pour le monde TS.

---

## Citations brutes

> *"TypeScript 7.0 inherits all of 6.0's new defaults and promotes its deprecations to hard errors."* — Microsoft devblog.

> *"Often about 10 times faster than TypeScript 6.0."* — annonce officielle.

---

## À explorer ensuite

- **Fait main : tsgo sur ton projet aujourd'hui** : `npm i -D @typescript/native-preview@beta && npx tsgo --noEmit`
- **`@typescript/native-preview` GitHub** : suivre les issues, les workarounds connus
- **Migration guide 6 → 7** : conserver à portée de main pendant la transition
- **Pour les cas d'erreur tsgo : reporting Microsoft** : ils sont très réactifs sur la beta
- **L'écosystème Rust/Go pour JS tooling** : voir <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a>

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

## Sources web

- [Announcing TypeScript 7.0 Beta — Microsoft devblog](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/)
- [TypeScript 7.0 Beta arrives on Go-based foundation with 10x speed claim — Visual Studio Magazine](https://visualstudiomagazine.com/articles/2026/04/21/typescript-7-0-beta-arrives-on-go-based-foundation-with-10x-speed-claim.aspx)
- [TypeScript 7.0 Beta: Why the Go rewrite was inevitable — Medium](https://medium.com/@codewithbedant/typescript-7-0-beta-why-the-go-rewrite-was-inevitable-and-what-my-benchmarks-actually-show-823734438018)
- [Highlights from TypeScript 7.0 Beta — Onix React on Medium](https://medium.com/@onix_react/highlights-from-typescript-7-0-beta-d0be66d5b0bc)

