---
created: 2026-04-27T00:00:00.000Z
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
title: >-
  Concept - Le bon choix de structure de données dépend des opérations
  dominantes
slug: le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
excerpt: >-
  C'est l'un des skills les plus impactants en algo : choisir entre array,
  linked list, hash map, tree, heap. La majorité des "ça scale pas" viennent
  d'un mauvais choix de structure (recherche linéaire dans un array là où un Set
  ferait O(1)).
oneLiner: >-
  Une structure de données n'est ni "bonne" ni "mauvaise" dans l'absolu : elle a
  un **profil de complexité par opération** (insert, delete, search, access,
  iterate), et le bon choix consiste à identifier **quelles opérations dominent
  ton workload** puis à choisir celle qui les rend rapides — quitte à sacrifier
  les autres.
related:
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
topics:
  - architecture
---
## Idée en une phrase

> Une structure de données n'est ni "bonne" ni "mauvaise" dans l'absolu : elle a un **profil de complexité par opération** (insert, delete, search, access, iterate), et le bon choix consiste à identifier **quelles opérations dominent ton workload** puis à choisir celle qui les rend rapides — quitte à sacrifier les autres.

## Contexte / pourquoi ça compte

C'est l'un des skills les plus impactants en algo : choisir entre array, linked list, hash map, tree, heap. La majorité des "ça scale pas" viennent d'un mauvais choix de structure (recherche linéaire dans un array là où un Set ferait O(1)).

Ça se résume à trois questions :
1. Quelles opérations je fais **souvent** ?
2. Combien d'éléments dans le pire cas ?
3. Est-ce que l'**ordre** importe ?

## Détails / mécanisme

### Cheat sheet — opérations courantes

| Structure | Access | Search | Insert | Delete | Itération | Notes |
|---|---|---|---|---|---|---|
| **Array** | O(1) | O(n) | O(1) end / O(n) middle | O(n) | O(n) ordonnée | Cache-friendly, default |
| **Singly Linked List** | O(n) | O(n) | O(1) head / O(n) tail | O(1) si node connue | O(n) | Insertions multiples |
| **Doubly Linked List** | O(n) | O(n) | O(1) ends | O(1) si node connue | O(n) | LRU caches |
| **Stack** | - | O(n) | O(1) push | O(1) pop | O(n) LIFO | Backtracking, DFS |
| **Queue** (deque) | - | O(n) | O(1) enqueue | O(1) dequeue | O(n) FIFO | BFS, scheduling |
| **Hash Map** | O(1) avg | O(1) avg | O(1) avg | O(1) avg | O(n) non-ordonnée | Lookup par clé |
| **Set** | - | O(1) avg | O(1) avg | O(1) avg | O(n) | Unicité, membership |
| **Binary Search Tree** | - | O(log n) avg | O(log n) avg | O(log n) avg | O(n) ordonnée | Sorted lookup |
| **Heap** (priority queue) | - | - (top only O(1)) | O(log n) | O(log n) (top) | O(n) | Top-k, Dijkstra |
| **Trie** | - | O(L) | O(L) | O(L) | - | Préfixes, autocomplete |

(L = longueur de la string pour Trie)

### Décider en 3 questions

**1. Tu cherches par clé ?**
- Oui → **Hash Map / Set**
- Non, par index → **Array**
- Non, par préfixe (string) → **Trie**

**2. L'ordre compte ?**
- Ordonné par insertion → **Array** ou **LinkedList**
- Ordonné par valeur → **BST** ou **sorted array**
- Top élément (min ou max) → **Heap**
- Pas d'ordre → **Set / Map**

**3. Insertions / suppressions au milieu ?**
- Oui, fréquentes → **LinkedList** (ou tableau circulaire)
- Non, principalement à la fin → **Array**

### Pièges classiques en JS / TS

#### Piège 1 : utiliser un array là où un Set conviendrait

```typescript
// ❌ O(n) par check, O(n²) total dans une loop
const userIds: string[] = [...]
function isUser(id: string) {
  return userIds.includes(id)  // O(n) — scan complet
}

// ✓ O(1) par check
const userIds: Set<string> = new Set([...])
function isUser(id: string) {
  return userIds.has(id)  // O(1)
}
```

Sur 10 000 utilisateurs vérifiés 10 000 fois : passer de 100M opérations à 100k. **Énorme**.

#### Piège 2 : queue avec Array.shift()

```typescript
// ❌ O(n) par dequeue (shift réalloue tout)
class BadQueue<T> {
  private items: T[] = []
  enqueue(x: T) { this.items.push(x) }
  dequeue() { return this.items.shift() }  // O(n) !
}

// ✓ Queue via deux stacks ou linked list O(1)
class GoodQueue<T> {
  private head: Node<T> | null = null
  private tail: Node<T> | null = null
  enqueue(x: T) {
    const node = { value: x, next: null }
    if (this.tail) this.tail.next = node
    else this.head = node
    this.tail = node
  }
  dequeue() {
    if (!this.head) return undefined
    const value = this.head.value
    this.head = this.head.next
    if (!this.head) this.tail = null
    return value
  }
}
```

Pour une BFS sur 1M nodes, BadQueue est plusieurs ordres de grandeur plus lent.

#### Piège 3 : Object au lieu de Map

```typescript
// Object : OK pour cas simples mais
const counts: Record<string, number> = {}
for (const word of words) {
  counts[word] = (counts[word] ?? 0) + 1
}

// Map : meilleure perf si beaucoup d'updates, supporte n'importe quel type de clé
const counts = new Map<string, number>()
for (const word of words) {
  counts.set(word, (counts.get(word) ?? 0) + 1)
}
```

V8 a longtemps optimisé Object pour les "fast paths" string keys. Map est plus prévisible et plus rapide en charge.

### Stratégies de combinaison

Pour des cas tordus, on combine :

```typescript
// LRU Cache : Map (lookup O(1)) + Doubly Linked List (move O(1))
class LRUCache<K, V> {
  private map = new Map<K, DoubleNode<K, V>>()
  // ... insertion linkedlist + map.set
  // ... eviction : pop tail of linkedlist + map.delete
}

// Top-k : Heap de taille k (O(n log k))
function topK<T>(arr: T[], k: number, compare: (a: T, b: T) => number): T[] {
  const heap = new MinHeap(compare)
  for (const x of arr) {
    heap.push(x)
    if (heap.size() > k) heap.pop()
  }
  return [...heap]
}
```

## Exemple concret

Cas réel : on doit retourner les 10 utilisateurs avec le plus de points parmi 1 million.

**Solution naïve** : sort puis prends 10 → O(n log n) = ~20M ops.
```typescript
return users.sort((a, b) => b.points - a.points).slice(0, 10)
```

**Solution optimale** : min-heap de taille 10 → O(n log k) = ~3.3M ops.
```typescript
const heap = new MinHeap<User>((a, b) => a.points - b.points)
for (const u of users) {
  heap.push(u)
  if (heap.size() > 10) heap.pop()  // jette le plus petit
}
return [...heap].sort((a, b) => b.points - a.points)
```

Sur 1M users, on passe de **~150ms à ~25ms**. C'est ce que le bon choix de structure rapporte.

### Patterns reconnaissables

| Problème reconnu | Structure idéale |
|---|---|
| Compter occurrences | Hash Map |
| Tester unicité | Set |
| Trouver paires (sum to target) | Hash Map |
| Top-k éléments | Min-heap (taille k) |
| Shortest path non pondéré | Queue (BFS) |
| Shortest path pondéré | Min-heap (Dijkstra) |
| Backtracking | Stack (récursif) |
| Plages glissantes (sliding window) | Deque |
| Préfixes / autocomplete | Trie |
| LRU eviction | Hash Map + DLL |

À mémoriser. Beaucoup de problèmes "moyens" en interview se résolvent en 30s en reconnaissant le pattern.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace" data-wiki-title="Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace" data-wiki-preview="**Big O** (`O(f(n))`) dénote la **borne supérieure asymptotique** du nombre d'opérations (ou d'octets de mémoire) qu'un algorithme effectue en fonction de la taille `n` de son input — on ignore les constantes et les termes mineurs pour ne g…">Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit" data-wiki-title="Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit" data-wiki-preview="Une fonction récursive a **deux éléments invariants** : un **cas de base** (condition de terminaison qui retourne directement) et un **cas récursif** (appel à elle-même sur un sous-problème **strictement plus petit**) — sans le premier, inf…">Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue" data-wiki-title="Concept - DFS explore en profondeur via stack, BFS en largeur via queue" data-wiki-preview="**DFS** (Depth-First Search) plonge le plus loin possible avant de backtracker via une **stack** (souvent récursive), **BFS** (Breadth-First Search) explore tous les voisins niveau par niveau via une **queue** — la **différence de structure…">Concept - DFS explore en profondeur via stack, BFS en largeur via queue</a>

**Prérequis** :
- Big O
- Bases des structures (array, hashmap)

**S'oppose à / à comparer avec** :
- **"Use the same structure for everything"** : par exemple tout faire avec des arrays — perds 10× sur du membership testing
- **Premature optimization** : ne pas non plus introduire un Trie si tu as 10 entrées

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-algos-data-structures-essentiels-en-typescript" data-wiki-title="Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)" data-wiki-preview="1. **Big O** : la métrique qui compte. Identifier les boucles imbriquées, le stockage proportionnel à l'input, le coût caché des opérations courantes (concat de strings, push d'array). 2. **Recursion** : la base pour les arbres, les graphes…">Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

