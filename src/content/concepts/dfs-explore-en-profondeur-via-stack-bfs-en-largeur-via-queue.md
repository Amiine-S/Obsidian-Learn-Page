---
created: 2026-04-27T00:00:00.000Z
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
title: 'Concept - DFS explore en profondeur via stack, BFS en largeur via queue'
slug: dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
excerpt: >-
  DFS et BFS sont les deux algos de **traversée de graphe** universels. ~80% des
  problèmes de graphe en interview ou en prod se réduisent à un DFS ou un BFS
  bien posé.
oneLiner: >-
  **DFS** (Depth-First Search) plonge le plus loin possible avant de backtracker
  via une **stack** (souvent récursive), **BFS** (Breadth-First Search) explore
  tous les voisins niveau par niveau via une **queue** — la **différence de
  structure de données** est la seule chose qui les sépare, et elle change
  radicalement les usages : DFS pour la connectivité / cycles / topo sort, BFS
  pour le **shortest path** non pondéré.
related:
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
topics:
  - architecture
---
## Idée en une phrase

> **DFS** (Depth-First Search) plonge le plus loin possible avant de backtracker via une **stack** (souvent récursive), **BFS** (Breadth-First Search) explore tous les voisins niveau par niveau via une **queue** — la **différence de structure de données** est la seule chose qui les sépare, et elle change radicalement les usages : DFS pour la connectivité / cycles / topo sort, BFS pour le **shortest path** non pondéré.

## Contexte / pourquoi ça compte

DFS et BFS sont les deux algos de **traversée de graphe** universels. ~80% des problèmes de graphe en interview ou en prod se réduisent à un DFS ou un BFS bien posé.

Comprendre la différence te permet de choisir instantanément :
- "Plus court chemin entre 2 points en non-pondéré" → BFS
- "Existe-t-il un cycle ?" → DFS
- "Composantes connexes" → DFS ou BFS, peu importe
- "Topological sort" → DFS
- "Graphe pondéré" → ni l'un ni l'autre, va en Dijkstra / A*

## Détails / mécanisme

### DFS — récursif (le plus naturel)

```typescript
function dfs<T>(
  graph: Map<T, T[]>,
  start: T,
  visited: Set<T> = new Set()
): T[] {
  if (visited.has(start)) return []
  visited.add(start)

  const result: T[] = [start]
  for (const neighbor of graph.get(start) ?? []) {
    result.push(...dfs(graph, neighbor, visited))
  }
  return result
}
```

La **stack** est la **call stack JS** elle-même (récursion). Chaque appel push une frame.

### DFS — itératif avec stack explicite

```typescript
function dfsIter<T>(graph: Map<T, T[]>, start: T): T[] {
  const visited = new Set<T>()
  const stack: T[] = [start]
  const result: T[] = []
  while (stack.length > 0) {
    const node = stack.pop()!  // LIFO
    if (visited.has(node)) continue
    visited.add(node)
    result.push(node)
    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) stack.push(neighbor)
    }
  }
  return result
}
```

La **stack** est ici explicite (`stack.pop()` est LIFO). Utile pour éviter le stack overflow JS sur de très grands graphes.

### BFS — toujours itératif avec queue

```typescript
function bfs<T>(graph: Map<T, T[]>, start: T): T[] {
  const visited = new Set<T>([start])
  const queue: T[] = [start]
  const result: T[] = []
  while (queue.length > 0) {
    const node = queue.shift()!  // FIFO ! (mais Array.shift est O(n) — voir note)
    result.push(node)
    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }
  return result
}
```

⚠️ `Array.shift()` est **O(n)** en JS — pour de gros graphes, utiliser une vraie queue O(1) (linked list ou index pointer).

### Différence visuelle

```
Graphe :
       A
      / \
     B   C
    /|   |\
   D E   F G

Ordre DFS depuis A : A → B → D → E → C → F → G (plonge profond)
Ordre BFS depuis A : A → B → C → D → E → F → G (par niveau)
```

C'est la même information, ordre différent. Le bon choix dépend de **ce que tu veux faire**.

### Cas d'usage canonique de BFS — shortest path non pondéré

```typescript
function shortestPath<T>(graph: Map<T, T[]>, start: T, target: T): T[] | null {
  const visited = new Set<T>([start])
  const queue: { node: T; path: T[] }[] = [{ node: start, path: [start] }]
  while (queue.length > 0) {
    const { node, path } = queue.shift()!
    if (node === target) return path
    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push({ node: neighbor, path: [...path, neighbor] })
      }
    }
  }
  return null
}
```

**Garantie** : BFS retourne le **chemin le plus court** (en nombre d'arêtes). DFS pourrait trouver **un** chemin, pas forcément le plus court.

### Cas d'usage canonique de DFS — détection de cycle

```typescript
function hasCycle<T>(graph: Map<T, T[]>, start: T): boolean {
  const visiting = new Set<T>()
  const visited = new Set<T>()

  function dfs(node: T): boolean {
    if (visiting.has(node)) return true   // back-edge → cycle
    if (visited.has(node)) return false   // déjà exploré
    visiting.add(node)
    for (const neighbor of graph.get(node) ?? []) {
      if (dfs(neighbor)) return true
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }

  return dfs(start)
}
```

DFS permet de distinguer les nodes "en cours de visite" (sur la stack courante) des nodes "déjà visités". C'est crucial pour cycle detection.

### Cas d'usage canonique de DFS — topological sort

```typescript
function topoSort<T>(graph: Map<T, T[]>): T[] {
  const visited = new Set<T>()
  const result: T[] = []

  function dfs(node: T): void {
    if (visited.has(node)) return
    visited.add(node)
    for (const neighbor of graph.get(node) ?? []) dfs(neighbor)
    result.unshift(node)  // post-order
  }

  for (const node of graph.keys()) dfs(node)
  return result
}
```

L'ajout en **post-order** (après avoir exploré tous les enfants) donne un ordre topologique. Utile pour : ordre de build (CMake, Make), planification de tâches, dépendances.

### Comparaison récap

| Critère | DFS | BFS |
|---|---|---|
| Structure | Stack (récursif ou explicit) | Queue |
| Mémoire | O(h) profondeur | O(w) largeur — peut être pire |
| Trouve shortest path ? | Non (sauf en pondéré modifié) | **Oui** (non pondéré) |
| Détecte cycles | Oui (back-edge) | Plus complexe |
| Topological sort | Oui (post-order) | Non |
| Backtracking | Oui (naturel) | Non |
| Première feuille trouvée | Profonde | Proche de la racine |

### Choisir entre DFS et BFS

```
Question                                      | Algo
----------------------------------------------|------
Est-ce que tu cherches LE chemin LE PLUS court | BFS
Est-ce que tu veux explorer toutes les options | DFS
Détecter cycle / topological order             | DFS
Traverser un arbre level-by-level              | BFS
Backtracking (combinaisons, sudoku)            | DFS
Web crawling à profondeur limitée              | BFS (puis cap)
Graph non pondéré, plus court chemin           | BFS
Graph pondéré, plus court chemin               | Dijkstra (heap), pas DFS/BFS
```

## Exemple concret

Problème classique LeetCode : **Number of Islands**.

> Étant donné une grille de '1' (terre) et '0' (eau), retourner le nombre d'îles (régions connectées de '1').

```typescript
function numIslands(grid: string[][]): number {
  const m = grid.length, n = grid[0].length
  let count = 0

  function dfs(r: number, c: number): void {
    if (r < 0 || r >= m || c < 0 || c >= n) return
    if (grid[r][c] !== '1') return
    grid[r][c] = '0'  // marquer visité
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
  }

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === '1') {
        count++
        dfs(r, c)  // marque toute l'île
      }
    }
  }
  return count
}
```

DFS est ici parfait : on veut juste explorer la composante connexe, peu importe l'ordre.

Avec BFS, c'est aussi correct, juste avec une queue à la place de la récursion.

### Le piège — DFS récursif sur grand graphe

JS / TS limite la stack à ~10-15k frames. Sur un graphe de 100k nodes en une chaîne, le DFS récursif **stack overflow**.

Solution :
1. DFS itératif avec stack explicite
2. ou, si vraiment grand, traversée par chunks

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace" data-wiki-title="Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace" data-wiki-preview="**Big O** (`O(f(n))`) dénote la **borne supérieure asymptotique** du nombre d'opérations (ou d'octets de mémoire) qu'un algorithme effectue en fonction de la taille `n` de son input — on ignore les constantes et les termes mineurs pour ne g…">Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit" data-wiki-title="Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit" data-wiki-preview="Une fonction récursive a **deux éléments invariants** : un **cas de base** (condition de terminaison qui retourne directement) et un **cas récursif** (appel à elle-même sur un sous-problème **strictement plus petit**) — sans le premier, inf…">Concept - Recursion = cas de base + appel récursif sur sous-problème plus petit</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes" data-wiki-title="Concept - Le bon choix de structure de données dépend des opérations dominantes" data-wiki-preview="Une structure de données n'est ni &quot;bonne&quot; ni &quot;mauvaise&quot; dans l'absolu : elle a un **profil de complexité par opération** (insert, delete, search, access, iterate), et le bon choix consiste à identifier **quelles opérations dominent ton work…">Concept - Le bon choix de structure de données dépend des opérations dominantes</a>

**Prérequis** :
- Notion de graphe (nodes, edges)
- Notion de stack / queue

**S'oppose à / à comparer avec** :
- **Dijkstra** : graphes pondérés, utilise une heap (priority queue)
- **A\*** : Dijkstra + heuristique, optimal pour pathfinding GPS / jeux
- **Bellman-Ford** : poids négatifs (Dijkstra ne supporte pas)
- **Floyd-Warshall** : all-pairs shortest paths

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-algos-data-structures-essentiels-en-typescript" data-wiki-title="Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)" data-wiki-preview="1. **Big O** : la métrique qui compte. Identifier les boucles imbriquées, le stockage proportionnel à l'input, le coût caché des opérations courantes (concat de strings, push d'array). 2. **Recursion** : la base pour les arbres, les graphes…">Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

