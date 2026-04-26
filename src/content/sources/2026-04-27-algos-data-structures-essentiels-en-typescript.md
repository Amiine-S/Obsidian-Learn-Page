---
title: Algos & data structures essentiels en TypeScript (cours Frontend Masters)
url: >-
  https://medium.com/javarevisited/is-frontend-masters-the-last-algorithms-course-you-ll-need-course-worth-it-review-ea6cfbe6d972
author: ThePrimeagen (cours original) + synthèse Claude
published: 2026
digested: 2026-04-27T00:00:00.000Z
format: course
domain: architecture
level: intermediate
tags:
  - type/source
  - status/done
  - domain/architecture
  - format/course
  - level/intermediate
slug: 2026-04-27-algos-data-structures-essentiels-en-typescript
excerpt: >-
  1. **Big O** : la métrique qui compte. Identifier les boucles imbriquées, le
  stockage proportionnel à l'input, le coût caché des opérations courantes
  (concat de strings, push d'array). 2. **Recursion** : la base pour les arbres,
  les graphes, le divide-and-conquer. Comprendre la s
related:
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - architecture-fondamentaux
backlinks:
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
topics:
  - architecture
  - frontend
  - typescript
---
## Pourquoi cette source

> Le cours Frontend Masters *"The Last Algorithms Course You'll Need"* (par **ThePrimeagen**, 9h20) est devenu une référence pour les devs JS/TS qui veulent **rattraper** une formation algos sans repasser par Cracking The Coding Interview. Cette note est le résumé riche du cours, **avec des exemples TypeScript** prêts à l'emploi : structures de données, complexité, algos, traversées de graphe.

## Résumé en 5 lignes

1. **Big O** : la métrique qui compte. Identifier les boucles imbriquées, le stockage proportionnel à l'input, le coût caché des opérations courantes (concat de strings, push d'array).
2. **Recursion** : la base pour les arbres, les graphes, le divide-and-conquer. Comprendre la stack, les cas de base, les calls.
3. **Structures de données** : array, linked list (single, doubly), queue, stack, hash map, tree, graph. Chacune a sa zone de pertinence en termes de complexité.
4. **Algos de tri** : Bubble (pour comprendre), Quick, Merge — différentes complexités, différentes garanties (stable / in-place).
5. **Graph traversals** : DFS et BFS, l'épine dorsale de 80% des problèmes algorithmiques (shortest path, connectivity, cycles, topological sort).

---

## 1. Big O — la grille d'analyse

Un algo a **deux complexités** : temps (combien d'opérations) et espace (combien de mémoire). Big O note le **comportement asymptotique** quand l'input grandit.

### Le cheat sheet

| Notation | Nom | Exemple | Verdict |
|---|---|---|---|
| `O(1)` | Constant | Accès tableau par index | ✅ |
| `O(log n)` | Logarithmique | Binary search | ✅ |
| `O(n)` | Linéaire | Scan tableau | ✅ |
| `O(n log n)` | Linéarithmique | Quicksort, Mergesort | ✅ |
| `O(n²)` | Quadratique | 2 boucles imbriquées sur input | ⚠️ |
| `O(n³)` | Cubique | 3 boucles imbriquées | ❌ Sauf si n petit |
| `O(2ⁿ)` | Exponentiel | Fibonacci naïf récursif | ❌ |
| `O(n!)` | Factoriel | Brute force permutations | ❌ |

### Identifier la complexité d'une fonction

```typescript
// O(1) — temps constant, input ne joue pas
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}

// O(n) — une boucle linéaire sur l'input
function sum(arr: number[]): number {
  let s = 0
  for (const x of arr) s += x
  return s
}

// O(n²) — deux boucles imbriquées
function hasDuplicates<T>(arr: T[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true
    }
  }
  return false
}

// O(n) avec Set — meilleure approche
function hasDuplicatesFast<T>(arr: T[]): boolean {
  const seen = new Set<T>()
  for (const x of arr) {
    if (seen.has(x)) return true
    seen.add(x)
  }
  return false
}
```

### Pièges TS / JS courants

```typescript
// O(n²) caché : .includes() est O(n), dans une loop ça devient O(n²)
const result = array.filter(x => other.includes(x))  // 😱 O(n × m)

// Préférer un Set, qui rend .has() O(1)
const otherSet = new Set(other)
const result = array.filter(x => otherSet.has(x))  // O(n + m)
```

```typescript
// O(n²) sur les strings : concat dans une boucle
let s = ''
for (const part of parts) s += part  // chaque concat est O(s.length)

// Préférer .join() qui est O(n)
const s = parts.join('')
```

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace" data-wiki-title="Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace" data-wiki-preview="**Big O** (`O(f(n))`) dénote la **borne supérieure asymptotique** du nombre d'opérations (ou d'octets de mémoire) qu'un algorithme effectue en fonction de la taille `n` de son input — on ignore les constantes et les termes mineurs pour ne g…">Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace</a>

---

## 2. Recursion — penser en cas de base + cas récursif

### La structure canonique

```typescript
function recursion(input) {
  if (CAS_DE_BASE) return RESULTAT_BASE
  // Récursion sur un sous-problème PLUS PETIT
  return COMBINER(recursion(SOUS_PROBLEME))
}
```

### Exemples

**Factorielle** :
```typescript
function factorial(n: number): number {
  if (n <= 1) return 1                  // cas de base
  return n * factorial(n - 1)            // cas récursif
}
```

**Reverse une linked list** (typique d'entretien) :
```typescript
type ListNode = { value: number; next: ListNode | null }

function reverse(head: ListNode | null, prev: ListNode | null = null): ListNode | null {
  if (!head) return prev
  const next = head.next
  head.next = prev
  return reverse(next, head)
}
```

**Fibonacci naïf — mauvais exemple** :
```typescript
function fibBad(n: number): number {
  if (n < 2) return n
  return fibBad(n - 1) + fibBad(n - 2)  // O(2ⁿ) — explose
}

// Mieux avec memoization (DP)
function fibGood(n: number, memo: number[] = []): number {
  if (n < 2) return n
  if (memo[n] !== undefined) return memo[n]
  return memo[n] = fibGood(n - 1, memo) + fibGood(n - 2, memo)  // O(n)
}
```

**Tail call vs non-tail call** :
- Tail call : l'appel récursif est la **dernière** opération → optimisable par le compilateur (pas de stack frame supplémentaire)
- Non-tail : opération après le call → la stack peut overflow sur grands inputs

JS/TS **n'a pas** de TCO (Tail Call Optimization) standardisé. Donc grands inputs → switcher en boucle itérative.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit" data-wiki-title="Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit" data-wiki-preview="Une fonction récursive a **deux éléments invariants** : un **cas de base** (condition de terminaison qui retourne directement) et un **cas récursif** (appel à elle-même sur un sous-problème **strictement plus petit**) — sans le premier, inf…">Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit</a>

---

## 3. Data structures — quand utiliser quoi

### Array (tableau)

| Op | Complexité | Note |
|---|---|---|
| Accès `arr[i]` | O(1) | Idéal pour random access |
| Append `push` | O(1)* | *amortized, occasionnellement O(n) si re-alloc |
| Insert/delete au milieu | O(n) | Doit shifter |
| Recherche linéaire | O(n) | |
| Binary search (trié) | O(log n) | |

```typescript
const arr: number[] = [3, 1, 4, 1, 5, 9, 2, 6]
arr.push(5)            // O(1)
arr.splice(2, 1)       // O(n) — supprime à l'index 2
arr.indexOf(4)         // O(n)
```

### Linked List

```typescript
type Node<T> = { value: T; next: Node<T> | null }

class LinkedList<T> {
  head: Node<T> | null = null

  prepend(value: T): void {                  // O(1) — INSERT au début
    this.head = { value, next: this.head }
  }

  append(value: T): void {                   // O(n) — doit traverser jusqu'à la fin
    if (!this.head) { this.head = { value, next: null }; return }
    let cur = this.head
    while (cur.next) cur = cur.next
    cur.next = { value, next: null }
  }

  *[Symbol.iterator]() { let n = this.head; while (n) { yield n.value; n = n.next } }
}
```

| Op | Complexité |
|---|---|
| Insert head | O(1) |
| Insert tail | O(n) (sans pointer tail), O(1) (doubly linked) |
| Delete | O(n) |
| Random access | O(n) |

**Quand préférer une linked list à un array** : insertions/suppressions fréquentes au milieu, pas de besoin d'accès indexé. Sinon, **array** par défaut (cache-friendly, mémoire compacte).

### Stack et Queue

```typescript
class Stack<T> {
  private items: T[] = []
  push(x: T): void { this.items.push(x) }              // O(1)
  pop(): T | undefined { return this.items.pop() }     // O(1)
  peek(): T | undefined { return this.items[this.items.length - 1] }
  get size(): number { return this.items.length }
}

class Queue<T> {
  private items: T[] = []
  enqueue(x: T): void { this.items.push(x) }           // O(1)
  dequeue(): T | undefined { return this.items.shift() } // O(n) — naïf !
}
```

⚠️ Une `Queue` implémentée avec `Array.shift()` est O(n) parce que JS doit re-indexer. Pour une vraie queue O(1), utiliser une **deque circulaire** ou une linked list.

### Hash Map

```typescript
const map = new Map<string, number>()
map.set('a', 1)        // O(1) amortized
map.get('a')           // O(1) amortized
map.has('a')           // O(1) amortized
map.delete('a')        // O(1) amortized

// Object aussi mais limité aux clés string/symbol
const obj: Record<string, number> = { a: 1 }
```

**Map vs Object** : Map garde l'ordre d'insertion, accepte n'importe quel type de clé, performance plus prévisible. Object est plus rapide en JIT V8 pour des clés string courtes mais fragile sur les clés exotiques.

### Tree (arbre binaire)

```typescript
type TreeNode<T> = {
  value: T
  left: TreeNode<T> | null
  right: TreeNode<T> | null
}

function insertBST(root: TreeNode<number> | null, value: number): TreeNode<number> {
  if (!root) return { value, left: null, right: null }
  if (value < root.value) root.left = insertBST(root.left, value)
  else root.right = insertBST(root.right, value)
  return root
}
```

| Op (BST équilibré) | Complexité |
|---|---|
| Insert | O(log n) |
| Search | O(log n) |
| Delete | O(log n) |

⚠️ Un BST déséquilibré (insertions ordonnées) dégrade en O(n). D'où les variantes auto-équilibrantes : AVL tree, Red-Black tree.

### Graph

Représentation typique : **adjacency list** (Map de Sets).

```typescript
class Graph<T> {
  private adj = new Map<T, Set<T>>()

  addNode(v: T): void {
    if (!this.adj.has(v)) this.adj.set(v, new Set())
  }

  addEdge(from: T, to: T): void {
    this.addNode(from)
    this.addNode(to)
    this.adj.get(from)!.add(to)
    this.adj.get(to)!.add(from) // undirected; remove for directed
  }

  neighbors(v: T): Set<T> {
    return this.adj.get(v) ?? new Set()
  }
}
```

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes" data-wiki-title="Concept - Le bon choix de structure de données dépend des opérations dominantes" data-wiki-preview="Une structure de données n'est ni &quot;bonne&quot; ni &quot;mauvaise&quot; dans l'absolu : elle a un **profil de complexité par opération** (insert, delete, search, access, iterate), et le bon choix consiste à identifier **quelles opérations dominent ton work…">Concept - Le bon choix de structure de données dépend des opérations dominantes</a>

---

## 4. Algos de tri

### Quicksort — divide and conquer

```typescript
function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr
  const pivot = arr[Math.floor(arr.length / 2)]
  const left = arr.filter((x, i) => x < pivot && i !== Math.floor(arr.length / 2))
  const right = arr.filter(x => x > pivot)
  const equal = arr.filter(x => x === pivot)
  return [...quicksort(left), ...equal, ...quicksort(right)]
}
```

- **Temps** : O(n log n) en moyenne, O(n²) worst case (mauvais pivot)
- **Espace** : O(log n) stack récursif (in-place possible)
- **Stable** : non
- **Default** dans `Array.prototype.sort()` (V8) en pratique pour les arrays de taille moyenne

### Mergesort — divide and merge

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
  return [...result, ...a.slice(i), ...b.slice(j)]
}
```

- **Temps** : O(n log n) **garanti** (pas de pire cas)
- **Espace** : O(n)
- **Stable** : oui
- Bon pour gros datasets, données externes (peut être out-of-core)

### Bubble sort — pour comprendre

```typescript
function bubbleSort(arr: number[]): number[] {
  const a = [...arr]
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]]
    }
  }
  return a
}
```

O(n²). À ne **jamais** utiliser en prod, mais bon exemple pédagogique de boucles imbriquées.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas" data-wiki-title="Concept - Quicksort est O(n log n) en moyenne mais Mergesort le garantit en pire cas" data-wiki-preview="**Quicksort** (partitionne autour d'un pivot, récurse) et **Mergesort** (divise en deux moitiés triées récursivement, merge) ont le même best/average case en `O(n log n)` — la différence clé est que Quicksort dégénère en `O(n²)` sur un mauv…">Concept - Quicksort est O(n log n) en moyenne mais Mergesort le garantit en pire cas</a>

---

## 5. Graph traversals — DFS et BFS

### DFS (Depth-First Search) — récursif ou avec stack

```typescript
function dfs<T>(graph: Graph<T>, start: T, visited = new Set<T>()): T[] {
  if (visited.has(start)) return []
  visited.add(start)
  const result = [start]
  for (const neighbor of graph.neighbors(start)) {
    result.push(...dfs(graph, neighbor, visited))
  }
  return result
}
```

Cas d'usage : **path finding**, cycle detection, topological sort, connectivity.

### BFS (Breadth-First Search) — avec queue

```typescript
function bfs<T>(graph: Graph<T>, start: T): T[] {
  const visited = new Set<T>([start])
  const queue: T[] = [start]
  const result: T[] = []
  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)
    for (const neighbor of graph.neighbors(node)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }
  return result
}
```

Cas d'usage : **shortest path** (graphes non pondérés), level-by-level traversal, web crawling.

### Différence clé

- **DFS** : utilise une **stack** (récursif ou explicite). Va le plus loin possible avant de backtracker.
- **BFS** : utilise une **queue**. Explore tous les voisins d'un niveau avant de passer au suivant. **Garantit** le shortest path en non-pondéré.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue" data-wiki-title="Concept - DFS explore en profondeur via stack, BFS en largeur via queue" data-wiki-preview="**DFS** (Depth-First Search) plonge le plus loin possible avant de backtracker via une **stack** (souvent récursive), **BFS** (Breadth-First Search) explore tous les voisins niveau par niveau via une **queue** — la **différence de structure…">Concept - DFS explore en profondeur via stack, BFS en largeur via queue</a>

### Dijkstra — shortest path pondéré

```typescript
function dijkstra(graph: WeightedGraph<string>, start: string): Map<string, number> {
  const dist = new Map<string, number>()
  for (const node of graph.nodes()) dist.set(node, Infinity)
  dist.set(start, 0)

  const pq = new MinHeap<[string, number]>((a, b) => a[1] - b[1])
  pq.push([start, 0])

  while (!pq.isEmpty()) {
    const [u, d] = pq.pop()!
    if (d > dist.get(u)!) continue
    for (const [v, w] of graph.neighbors(u)) {
      const alt = d + w
      if (alt < dist.get(v)!) {
        dist.set(v, alt)
        pq.push([v, alt])
      }
    }
  }
  return dist
}
```

Avec une min-heap, complexité O((V + E) log V). Utile pour : routing, GPS, network delays.

---

## 6. Quoi retenir pour les entretiens

Top 10 patterns qui couvrent ~80% des problèmes en interview :

1. **Two pointers** : pour les arrays triés, palindromes
2. **Sliding window** : sub-array max/min avec contrainte
3. **Hash map count** : compter les occurrences
4. **Binary search** : sur tableau trié, ou sur réponse (O(log n))
5. **DFS / BFS** : tous les problèmes de graphes
6. **Backtracking** : génération de toutes les solutions (permutations, sous-ensembles)
7. **Dynamic programming** : memoization + tabulation
8. **Greedy** : choisir l'optimum local quand ça donne l'optimum global
9. **Heap / priority queue** : top-k, scheduling
10. **Union-Find** : connectivity dynamique, MST

À pratiquer sur LeetCode (tag par pattern).

---

## Citations brutes

> *"Algorithms aren't tricks. They're patterns. Once you see them, you see them everywhere."* — esprit ThePrimeagen.

---

## À explorer ensuite

- **Le cours en lui-même** sur Frontend Masters — les exercices interactifs sont la vraie valeur
- **`AlgoExpert`** ou **`NeetCode`** : compléments par problème typés
- **`Cracking The Coding Interview`** (Gayle McDowell) : la bible legacy mais toujours utile
- **Big O Cheat Sheet** : [bigocheatsheet.com](https://www.bigocheatsheet.com/)
- **`Introduction to Algorithms`** (CLRS) : l'académique, pour aller en profondeur
- Practice : LeetCode 75 (le top 75 problèmes essentiels)

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

## Source web

- [Is Frontend Masters the Last Algorithms Course You'll Need? — Medium review](https://medium.com/javarevisited/is-frontend-masters-the-last-algorithms-course-you-ll-need-course-worth-it-review-ea6cfbe6d972)

