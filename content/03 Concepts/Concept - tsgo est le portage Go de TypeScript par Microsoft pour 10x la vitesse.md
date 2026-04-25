---
created: 2026-04-25
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
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
- [[Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf]] *(la tendance globale)*
- [[Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse]] *(autre brique du même mouvement)*

**Prérequis** :
- Avoir utilisé `tsc` et ressenti la lenteur

**S'oppose à / à comparer avec** :
- **stc** (TypeScript checker en Rust, projet de Donny — abandonné/stalled) : Go a gagné cette course
- **swc-tsc** : SWC visait aussi un type-checker, projet pas finalisé
- **Bun bunx tsc** : juste un wrapper sur tsc, pas un type-checker indépendant

## Sources

- [[2026-04-25 - tsgo oxlint oxfmt - l'écosystème JS passe au natif]]

## MOC

[[MOC - Frontend]]
