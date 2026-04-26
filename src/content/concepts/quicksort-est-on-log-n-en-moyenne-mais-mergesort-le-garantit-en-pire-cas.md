---
created: 2026-04-27T00:00:00.000Z
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
title: >-
  Concept - Quicksort est O(n log n) en moyenne mais Mergesort le garantit en
  pire cas
slug: quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
excerpt: >-
  Ce sont les deux algorithmes de tri O(n log n) classiques, et ils illustrent
  un **trade-off fondamental** : - **Vitesse + in-place** vs **prévisibilité +
  stable**
oneLiner: >-
  **Quicksort** (partitionne autour d'un pivot, récurse) et **Mergesort**
  (divise en deux moitiés triées récursivement, merge) ont le même best/average
  case en `O(n log n)` — la différence clé est que Quicksort dégénère en `O(n²)`
  sur un mauvais pivot consécutif, alors que Mergesort **garantit O(n log n)**
  en pire cas, au prix d'un espace `O(n)` (vs `O(log n)` pour Quicksort
  in-place) et d'une stabilité (Mergesort stable, Quicksort non).
related:
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
topics:
  - architecture
---
## Idée en une phrase

> **Quicksort** (partitionne autour d'un pivot, récurse) et **Mergesort** (divise en deux moitiés triées récursivement, merge) ont le même best/average case en `O(n log n)` — la différence clé est que Quicksort dégénère en `O(n²)` sur un mauvais pivot consécutif, alors que Mergesort **garantit O(n log n)** en pire cas, au prix d'un espace `O(n)` (vs `O(log n)` pour Quicksort in-place) et d'une stabilité (Mergesort stable, Quicksort non).

## Contexte / pourquoi ça compte

Ce sont les deux algorithmes de tri O(n log n) classiques, et ils illustrent un **trade-off fondamental** :
- **Vitesse + in-place** vs **prévisibilité + stable**

Comprendre cette dualité te permet de choisir le bon outil quand tu te poses la question (rare mais ça arrive : quand tu écris une lib, quand tu trie des objets complexes avec préservation d'ordre, quand tu dois optimiser un workload spécifique).

C'est aussi un bon exercice pour internaliser le **divide and conquer**, qui revient partout (DFS, BFS, segment trees, FFT…).

## Détails / mécanisme

### Quicksort

```typescript
function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr

  const pivot = arr[Math.floor(arr.length / 2)]
  const left: number[] = []
  const right: number[] = []
  const equal: number[] = []

  for (const x of arr) {
    if (x < pivot) left.push(x)
    else if (x > pivot) right.push(x)
    else equal.push(x)
  }

  return [...quicksort(left), ...equal, ...quicksort(right)]
}
```

**Idée** : choisir un pivot, partitionner en `< pivot`, `== pivot`, `> pivot`, récurser sur left et right.

**Complexité** :
- Best/avg : `O(n log n)` — le pivot divise bien à chaque tour
- Worst : `O(n²)` — pivot toujours le plus petit ou le plus grand (array déjà trié + pivot = premier élément, par exemple)
- Espace : `O(log n)` (stack récursive) — version in-place

**Mitigations du worst case** :
- Pivot **médian de 3** (premier, milieu, dernier) — réduit la prob d'un mauvais choix
- **Random pivot** — empêche les attaques sur les arrays déjà triés
- **Introsort** : commence en quicksort, switch sur heapsort si la profondeur dépasse `2 log n` — utilisé par C++ STL

### Mergesort

```typescript
function mergesort(arr: number[]): number[] {
  if (arr.length <= 1) return arr

  const mid = Math.floor(arr.length / 2)
  const left = mergesort(arr.slice(0, mid))
  const right = mergesort(arr.slice(mid))
  return merge(left, right)
}

function merge(a: number[], b: number[]): number[] {
  const result: number[] = []
  let i = 0, j = 0
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) result.push(a[i++])
    else result.push(b[j++])
  }
  while (i < a.length) result.push(a[i++])
  while (j < b.length) result.push(b[j++])
  return result
}
```

**Idée** : couper en deux moitiés, trier récursivement, merger en O(n).

**Complexité** :
- Best / avg / worst : `O(n log n)` **garanti** (partage 50/50 toujours)
- Espace : `O(n)` (besoin d'un buffer pour le merge)

### La stabilité

Un sort est **stable** si l'ordre relatif des éléments **égaux** est préservé.

```typescript
const data = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }, { name: 'Carol', age: 30 }]

// Tri stable par age
// Ordre attendu : Bob (25), Alice (30), Carol (30)  ← Alice avant Carol comme dans l'original

// Tri NON-stable par age
// Ordre possible : Bob (25), Carol (30), Alice (30)  ← Alice et Carol peuvent permuter
```

- **Mergesort** : stable
- **Quicksort** : non stable (en général)

Cas d'usage : si tu trie d'abord par `nom`, puis par `age`, tu veux préserver l'ordre alphabétique pour les âges égaux. **Stabilité requise**.

JS `Array.prototype.sort` est **stable depuis ES2019** (V8 utilise Timsort en interne pour ça).

### Comparaison

| Critère | Quicksort | Mergesort |
|---|---|---|
| Avg time | O(n log n) | O(n log n) |
| Worst time | O(n²) | O(n log n) |
| Space | O(log n) | O(n) |
| Stable | Non | **Oui** |
| In-place | Possible | Non (merge buffer) |
| Cache-friendly | Oui (locality) | Non (merge spread) |
| Parallélisable | Bien | Très bien |

### Quand préférer lequel

**Quicksort** :
- Mémoire limitée (in-place)
- Données aléatoires
- Pas besoin de stabilité

**Mergesort** :
- Garantie de perfs en pire cas
- Stabilité requise
- Données externes (sort sur fichiers >> RAM)
- Linked lists (mergesort fait O(1) extra space sur LL)

### En pratique

`Array.prototype.sort()` en JS utilise **Timsort** (variante de mergesort + insertion sort) — stable, optimisé pour des données partiellement triées. Tu n'écris **pas** de quicksort/mergesort en code applicatif normalement.

Quand tu en écris :
- Tu écris une lib de tri custom (ex: tri externe sur fichiers énormes)
- Tu enseignes / apprends ces algos
- Tu fais un benchmark

### Autres algos de tri à connaître

| Algo | Time | Space | Stable | Note |
|---|---|---|---|---|
| Bubble sort | O(n²) | O(1) | Oui | Pédagogique seulement |
| Insertion sort | O(n²) | O(1) | Oui | Best sur petits / triés |
| Selection sort | O(n²) | O(1) | Non | Pédagogique |
| Heapsort | O(n log n) | O(1) | Non | In-place + worst case OK |
| Counting sort | O(n + k) | O(k) | Oui | Si valeurs entières bornées |
| Radix sort | O(d × (n + k)) | O(n + k) | Oui | Strings / nombres digits |
| Timsort | O(n log n) | O(n) | Oui | **Default JS, Python** |

## Exemple concret

Bench rapide en TS :

```typescript
function bench(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  console.log(`${name}: ${(performance.now() - start).toFixed(1)}ms`)
}

const random = Array.from({ length: 100000 }, () => Math.random())
const sorted = [...random].sort((a, b) => a - b)

bench('Native sort (random)', () => [...random].sort((a, b) => a - b))
// ~25ms

bench('Quicksort (random)', () => quicksort([...random]))
// ~80ms (overhead de recopie via slice + filter)

bench('Quicksort (déjà trié)', () => quicksort([...sorted]))
// ~5000ms !!! O(n²) déclenché par pivot mauvais

bench('Mergesort (déjà trié)', () => mergesort([...sorted]))
// ~80ms — garantie maintenue
```

Le worst case de quicksort est réel et brutal sur des données déjà triées avec un pivot naïf. C'est une démo classique de pourquoi le pivoting matters.

### Le piège : tri sur des objets

```typescript
// ❌ MAUVAIS : default sort string
[3, 10, 2, 1].sort()  // [1, 10, 2, 3] !!! tri lexico

// ✓ Donner un comparator
[3, 10, 2, 1].sort((a, b) => a - b)  // [1, 2, 3, 10]
```

C'est l'erreur #1 en JS. Apprendre à toujours passer un comparator.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace" data-wiki-title="Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace" data-wiki-preview="**Big O** (`O(f(n))`) dénote la **borne supérieure asymptotique** du nombre d'opérations (ou d'octets de mémoire) qu'un algorithme effectue en fonction de la taille `n` de son input — on ignore les constantes et les termes mineurs pour ne g…">Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit" data-wiki-title="Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit" data-wiki-preview="Une fonction récursive a **deux éléments invariants** : un **cas de base** (condition de terminaison qui retourne directement) et un **cas récursif** (appel à elle-même sur un sous-problème **strictement plus petit**) — sans le premier, inf…">Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit</a> *(les deux algos sont récursifs)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes" data-wiki-title="Concept - Le bon choix de structure de données dépend des opérations dominantes" data-wiki-preview="Une structure de données n'est ni &quot;bonne&quot; ni &quot;mauvaise&quot; dans l'absolu : elle a un **profil de complexité par opération** (insert, delete, search, access, iterate), et le bon choix consiste à identifier **quelles opérations dominent ton work…">Concept - Le bon choix de structure de données dépend des opérations dominantes</a>

**Prérequis** :
- Big O
- Récursion divide-and-conquer

**S'oppose à / à comparer avec** :
- **Heapsort** : O(n log n) garanti, in-place mais pas stable
- **Timsort** : ce que JS et Python utilisent, hybride mergesort + insertion sort
- **Counting / Radix** : algos non-comparatifs, O(n) sous certaines conditions

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-algos-data-structures-essentiels-en-typescript" data-wiki-title="Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)" data-wiki-preview="1. **Big O** : la métrique qui compte. Identifier les boucles imbriquées, le stockage proportionnel à l'input, le coût caché des opérations courantes (concat de strings, push d'array). 2. **Recursion** : la base pour les arbres, les graphes…">Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

