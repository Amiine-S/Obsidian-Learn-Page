---
created: 2026-04-27T00:00:00.000Z
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
title: >-
  Concept - Big O analyse le comportement asymptotique d'un algo en temps et
  espace
slug: big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
excerpt: >-
  Big O est l'outil universel pour comparer des algos. Sans Big O, dire "ce code
  est lent" est subjectif. Avec, tu peux affirmer : "ce code est en O(n²), il
  sera 10 000× plus lent qu'un O(n) sur 100 entrées vs 10 000 entrées". Tu
  négocies sur des chiffres, pas sur des intuitions.
oneLiner: >-
  **Big O** (`O(f(n))`) dénote la **borne supérieure asymptotique** du nombre
  d'opérations (ou d'octets de mémoire) qu'un algorithme effectue en fonction de
  la taille `n` de son input — on ignore les constantes et les termes mineurs
  pour ne garder que le **comportement dominant** quand `n` grandit.
related:
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
topics:
  - architecture
---
## Idée en une phrase

> **Big O** (`O(f(n))`) dénote la **borne supérieure asymptotique** du nombre d'opérations (ou d'octets de mémoire) qu'un algorithme effectue en fonction de la taille `n` de son input — on ignore les constantes et les termes mineurs pour ne garder que le **comportement dominant** quand `n` grandit.

## Contexte / pourquoi ça compte

Big O est l'outil universel pour comparer des algos. Sans Big O, dire "ce code est lent" est subjectif. Avec, tu peux affirmer : "ce code est en O(n²), il sera 10 000× plus lent qu'un O(n) sur 100 entrées vs 10 000 entrées". Tu négocies sur des chiffres, pas sur des intuitions.

C'est aussi la base des entretiens techniques (FAANG and co.) — toute solution est jugée selon sa complexité Big O, pas selon son temps wall-clock.

## Détails / mécanisme

### Lecture canonique

| Notation | Nom | Pratique pour... |
|---|---|---|
| `O(1)` | Constant | Accès tableau, hash map lookup |
| `O(log n)` | Logarithmique | Binary search, BST balanced |
| `O(n)` | Linéaire | Scan, somme, max |
| `O(n log n)` | Linéarithmique | Sort efficient (mergesort, quicksort) |
| `O(n²)` | Quadratique | Boucles imbriquées sur input |
| `O(2ⁿ)` | Exponentiel | Force brute backtracking |
| `O(n!)` | Factoriel | Toutes les permutations |

### La règle des constantes ignorées

```typescript
function f(arr: T[]) {
  for (const x of arr) /* op A */    // n
  for (const x of arr) /* op B */    // n
  for (const x of arr) /* op C */    // n
}
// Total : 3n opérations
// Big O : O(n) — on drop le 3 (constante)
```

```typescript
function g(arr: T[]) {
  for (const x of arr) /* op */                                  // n
  for (let i = 0; i < arr.length; i++) for (let j = 0; j < arr.length; j++) /* op */  // n²
}
// Total : n + n²
// Big O : O(n²) — on drop le n (terme mineur dominé)
```

C'est volontaire : on regarde ce qui **explose** avec `n`, pas les détails. Pour `n = 1000`, un algo `n² + 100n` est dominé par `n²` (1 000 000 vs 100 000).

### Big O n'est pas une mesure de wall-clock

Deux algos en `O(n)` peuvent avoir des perfs très différentes en pratique :
- Algo A : `for (...) { /* 5 instructions */ }`
- Algo B : `for (...) { /* 5000 instructions, allocs, etc. */ }`

Big O dit : "tous les deux scalent linéairement". Wall-clock dit : "B est 1000× plus lent". Pour benchmarker la perf réelle, il faut **mesurer** (autocannon, hyperfine, console.time).

Big O sert à **identifier les algos qui ne scalent pas**. Pour les optimisations fines, c'est wall-clock + profiling.

### Analyse pas-à-pas

Comment déterminer la complexité d'une fonction :

1. Identifier toutes les boucles, calls récursifs, opérations
2. Pour chaque boucle, calculer combien de fois elle s'exécute en fonction de n
3. Pour chaque opération, sa propre complexité
4. Combiner : produit pour boucles imbriquées, somme pour séquentielles
5. Garder le terme dominant

```typescript
function example(arr: number[]): boolean {
  // O(n)
  const set = new Set(arr)
  
  // O(n²) — boucle dans une boucle, .includes() est O(n)
  for (const x of arr) {
    for (const y of arr) {
      if (x !== y && set.has(x + y)) return true
    }
  }
  return false
}
// Total : O(n) + O(n × n × 1) = O(n²)
```

### Espace

Même méthode pour l'espace :

```typescript
function copy(arr: T[]): T[] {
  return [...arr]  // O(n) espace
}

function inPlace(arr: number[]): void {
  arr.sort((a, b) => a - b)  // O(1) espace (sort modifie in-place)
}

function recurse(n: number): number {
  if (n === 0) return 0
  return n + recurse(n - 1)  // O(n) espace (n stack frames)
}
```

### Cas moyen, pire, meilleur

Big O est **upper bound** (worst case). Mais on annonce parfois :
- **Best case** : `Ω(f(n))` (Omega) — borne inférieure
- **Average case** : `Θ(f(n))` (Theta) — borne tight

Quicksort par exemple :
- Best : O(n log n)
- Average : O(n log n)
- Worst : O(n²) (mauvais pivot consécutif)

En pratique on dit "Quicksort O(n log n)" en sous-entendant *average case*, et on précise *worst case* si pertinent.

## Exemple concret

Identifier la complexité d'un code donné :

```typescript
// Q: Quelle est la complexité ?
function func(matrix: number[][]): number {
  let max = 0
  for (let i = 0; i < matrix.length; i++) {           // n
    for (let j = 0; j < matrix[i].length; j++) {       // m (peut être ≠ n si non carré)
      if (matrix[i][j] > max) max = matrix[i][j]
    }
  }
  return max
}
// Réponse : O(n * m)
// Si matrix est carrée n×n : O(n²)
```

```typescript
// Q: Et celle-ci ?
function bin(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}
// Réponse : O(log n) — chaque tour réduit l'espace de moitié
```

```typescript
// Q: Tricky — en apparence O(n²) mais en réalité ?
function pairs(arr: number[]): [number, number][] {
  const seen = new Map<number, number>()
  const result: [number, number][] = []
  for (const x of arr) {
    if (seen.has(-x)) result.push([x, -x])
    seen.set(x, true)
  }
  return result
}
// Réponse : O(n) — Map.has est O(1), pas de boucle imbriquée
```

Lire la complexité exige un peu d'entraînement. C'est rapidement intuitif.

### Le piège de la concaténation

```typescript
let s = ''
for (const part of parts) {
  s += part  // chaque concat est O(s.length) — la string grossit
}
// Total : O(n²) ! Pas O(n)

// Mieux :
const s = parts.join('')  // O(n)
```

Beaucoup de code "naïf" en JS est subtilement O(n²) sans que le dev s'en rende compte.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes" data-wiki-title="Concept - Le bon choix de structure de données dépend des opérations dominantes" data-wiki-preview="Une structure de données n'est ni &quot;bonne&quot; ni &quot;mauvaise&quot; dans l'absolu : elle a un **profil de complexité par opération** (insert, delete, search, access, iterate), et le bon choix consiste à identifier **quelles opérations dominent ton work…">Concept - Le bon choix de structure de données dépend des opérations dominantes</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas" data-wiki-title="Concept - Quicksort est O(n log n) en moyenne mais Mergesort le garantit en pire cas" data-wiki-preview="**Quicksort** (partitionne autour d'un pivot, récurse) et **Mergesort** (divise en deux moitiés triées récursivement, merge) ont le même best/average case en `O(n log n)` — la différence clé est que Quicksort dégénère en `O(n²)` sur un mauv…">Concept - Quicksort est O(n log n) en moyenne mais Mergesort le garantit en pire cas</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue" data-wiki-title="Concept - DFS explore en profondeur via stack, BFS en largeur via queue" data-wiki-preview="**DFS** (Depth-First Search) plonge le plus loin possible avant de backtracker via une **stack** (souvent récursive), **BFS** (Breadth-First Search) explore tous les voisins niveau par niveau via une **queue** — la **différence de structure…">Concept - DFS explore en profondeur via stack, BFS en largeur via queue</a>

**Prérequis** :
- Notion de boucle, récursion
- Math : logarithme, exponentielle (intuition seulement)

**S'oppose à / à comparer avec** :
- **Mesure wall-clock** : précise mais dépend de la machine, du runtime, du dataset spécifique
- **Profiling (CPU flame graph)** : utile en complément pour identifier les hot paths
- **Big Omega (Ω) / Big Theta (Θ)** : autres notations pour bornes inférieure / tight

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-algos-data-structures-essentiels-en-typescript" data-wiki-title="Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)" data-wiki-preview="1. **Big O** : la métrique qui compte. Identifier les boucles imbriquées, le stockage proportionnel à l'input, le coût caché des opérations courantes (concat de strings, push d'array). 2. **Recursion** : la base pour les arbres, les graphes…">Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

