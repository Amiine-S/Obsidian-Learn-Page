---
created: 2026-04-26
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
---

# Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent

## Idée en une phrase

> Programmer en déclaratif ne fait pas disparaître la complexité de l'exécution — ça **la déplace** vers le moteur (compilateur, runtime, query planner) — donc plus le moteur est puissant, plus le déclaratif est utilisable, et plus son **abstraction peut fuir** quand le moteur prend de mauvaises décisions.

## Contexte / pourquoi ça compte

C'est le piège classique du déclaratif "naïf" : on imagine qu'écrire en haut niveau supprime les considérations de perf, d'allocation, de scheduling. **Ce n'est pas vrai.** Quelque part, **quelqu'un** doit décider comment exécuter ton intent. En déclaratif, ce quelqu'un est le moteur — et quand il se trompe ou prend des décisions opaques, tu dois plonger sous l'abstraction.

Comprendre ce déplacement t'aide à :
- Choisir un outil déclaratif en sachant **où la fuite va apparaître**
- Apprendre proactivement le moteur (l'optimiseur SQL, le réconciliateur React, le runtime Effect)
- Savoir quand redescendre en impératif (zone perf-critique, debugging précis)

## Détails / mécanisme

### Le déplacement

```
Impératif :
  "Pour chaque ligne, vérifier si active = true, mettre dans un tableau, trier"
  → tu écris l'algo, le CPU exécute LITTÉRALEMENT

Déclaratif (SQL) :
  "Donne-moi les lignes où active = true, triées par date"
  → l'optimiseur DB :
     - choisit s'il scan ou utilise un index
     - choisit l'ordre des prédicats
     - choisit l'algorithme de sort
     - estime les coûts via les statistiques
```

L'algorithme **existe** dans les deux cas. Il est juste **caché** dans le second. La complexité n'est pas évaporée — elle est dans le code de l'optimiseur PostgreSQL, dans le réconciliateur React, dans le compilateur Terraform.

### Loi générale (en pratique)

| Plus le moteur est sophistiqué... | ...plus tu peux écrire haut niveau, ...mais plus tu dois apprendre quand il fuit |
|---|---|
| GCC -O3 | Tu écris du C de haut niveau | Mais tu dois lire l'asm pour les hot loops |
| PostgreSQL planner | Tu écris du SQL "naturel" | Mais tu dois `EXPLAIN ANALYZE` pour les queries lentes |
| React reconciler | Tu écris du JSX "oublie le DOM" | Mais tu dois `useMemo` quand le profile montre du re-render |
| Terraform | Tu décris l'infra voulue | Mais tu dois `lifecycle.prevent_destroy` pour éviter les destructions surprises |
| Effect runtime | Tu écris du métier sans gérer cancellation/retry | Mais tu dois comprendre les fibers en debug fin |

### Quand l'abstraction fuit

C'est l'expression de **Joel Spolsky** ("All non-trivial abstractions, to some degree, are leaky").

Le déclaratif **fuit** quand :
1. **Performance** : le moteur fait un mauvais choix → tu dois descendre
2. **Debug** : le moteur cache l'exécution → tu dois lire ses logs/traces
3. **Erreur** : le moteur jette une erreur dans son langage interne → tu dois traduire
4. **Edge case** : ton intent se rapproche d'une frontière du moteur → tu dois la connaître

### Trois tactiques face à la fuite

**Tactique 1 — Apprendre le moteur**. Inévitable au-delà d'un certain niveau.
- React → comprends fiber tree, batching, scheduling
- SQL → comprends index, statistiques, query plans
- Effect → comprends fibers, scheduler, supervision

**Tactique 2 — Échappatoire impérative**. Beaucoup de bons outils déclaratifs **fournissent une trappe** :
- React : `useRef`, `flushSync`, `unstable_batchedUpdates`
- SQL : hints, raw queries
- Rust : `unsafe`
- Effect : `Effect.sync`, `Effect.async`

C'est volontaire. **Une bonne abstraction est une bonne abstraction parce qu'elle assume sa propre fuite.**

**Tactique 3 — Migrer un sous-ensemble vers l'impératif**. Le code applicatif moderne typique :
- Top-level : déclaratif (composants, schémas, queries)
- Hot path / parser / codec : impératif

Tu n'as pas à choisir un seul style pour tout le projet.

## Exemple concret

**Cas typique React** :

```jsx
// Code déclaratif "joli"
function Dashboard({ items }) {
  const filtered = items.filter(i => i.active)
  const sorted = filtered.sort((a, b) => b.date - a.date)
  return <List items={sorted} />
}
```

Tout va bien jusqu'à ce que le profiler montre que `Dashboard` re-render 60 fois/sec et alloue un nouveau tableau à chaque render. Le moteur React fait son job — il ré-exécute et différe — mais **c'est trop**. Tu plonges :

```jsx
function Dashboard({ items }) {
  const sorted = useMemo(
    () => items.filter(i => i.active).sort((a, b) => b.date - a.date),
    [items]
  )
  return <List items={sorted} />
}
```

`useMemo` est une **fuite** de l'abstraction. Tu donnes une instruction au moteur ("ne refais pas ça si `items` n'a pas changé"). Tu n'es plus 100% déclaratif.

Et avec **React Compiler 19** ? La fuite est colmatée par un compilateur qui insère le `useMemo` lui-même. Mais le **principe** demeure : il y avait une décision impérative à prendre.

### En résumé

- Le déclaratif n'est **pas** "plus simple" — il est **autre**.
- Le moteur prend des décisions à ta place. Tant qu'il décide bien, c'est une victoire. Quand il décide mal, c'est ton problème.
- La règle pratique : **apprends ton moteur**. Les vrais experts d'un outil déclaratif connaissent l'impératif sous-jacent.

## Connexions

**Concepts liés** :
- [[Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi]]
- [[Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI]]

**Prérequis** :
- Notion impératif / déclaratif

**S'oppose à / à comparer avec** :
- **"L'abstraction est gratuite"** — vue naïve, démentie par toute pratique sérieuse
- **"L'abstraction est inutile, écris du C"** — vue extrême, perd les bénéfices de productivité

## Sources

- [[2026-04-26 - Programmation impérative vs déclarative]]

## MOC

[[MOC - Architecture & Fondamentaux]]
