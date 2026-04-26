---
created: 2026-04-27T00:00:00.000Z
domain: architecture
level: beginner
tags:
  - type/concept
  - domain/architecture
  - level/beginner
title: >-
  Concept - Recursion = cas de base + appel récursif sur sous-problème plus
  petit
slug: recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
excerpt: >-
  La récursion est l'épine dorsale des algos sur arbres, graphes, et
  divide-and-conquer (mergesort, quicksort). Pour beaucoup de devs JS/TS, c'est
  un concept rébarbatif au début parce qu'on a moins l'occasion de l'utiliser au
  quotidien (la plupart du code applicatif est itératif).
oneLiner: >-
  Une fonction récursive a **deux éléments invariants** : un **cas de base**
  (condition de terminaison qui retourne directement) et un **cas récursif**
  (appel à elle-même sur un sous-problème **strictement plus petit**) — sans le
  premier, infinite recursion / stack overflow ; sans le second, pas de
  récursion.
related:
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
topics:
  - architecture
---
## Idée en une phrase

> Une fonction récursive a **deux éléments invariants** : un **cas de base** (condition de terminaison qui retourne directement) et un **cas récursif** (appel à elle-même sur un sous-problème **strictement plus petit**) — sans le premier, infinite recursion / stack overflow ; sans le second, pas de récursion.

## Contexte / pourquoi ça compte

La récursion est l'épine dorsale des algos sur arbres, graphes, et divide-and-conquer (mergesort, quicksort). Pour beaucoup de devs JS/TS, c'est un concept rébarbatif au début parce qu'on a moins l'occasion de l'utiliser au quotidien (la plupart du code applicatif est itératif).

Comprendre le pattern **cas de base + sous-problème** te donne immédiatement la clé pour résoudre :
- Tout problème sur un arbre
- Tout problème sur un graphe (avec un visited set)
- Tout problème de combinatoire (permutations, sous-ensembles, backtracking)
- Tout algo de divide-and-conquer

## Détails / mécanisme

### La structure canonique

```typescript
function recurse(input) {
  // 1. Cas de base : condition pour arrêter
  if (isBaseCase(input)) return baseValue(input)
  
  // 2. Cas récursif : appeler sur un input STRICTEMENT plus petit
  const subResult = recurse(smaller(input))
  
  // 3. Combiner avec la portion non-récursive
  return combine(input, subResult)
}
```

Les **trois ingrédients** :
1. Cas de base
2. Appel récursif sur sous-problème plus petit
3. Combinaison du résultat de la récursion

### Exemple — Factorielle

```typescript
function factorial(n: number): number {
  if (n <= 1) return 1                  // cas de base
  return n * factorial(n - 1)            // récursif sur (n-1) ; combinaison via *
}

factorial(4)
// = 4 * factorial(3)
//       = 4 * 3 * factorial(2)
//                = 4 * 3 * 2 * factorial(1)
//                            = 4 * 3 * 2 * 1
//                            = 24
```

### Exemple — Reverse une string

```typescript
function reverse(s: string): string {
  if (s.length <= 1) return s             // cas de base
  return reverse(s.slice(1)) + s[0]       // récursif sur substring ; combinaison via +
}

reverse('abc')
// = reverse('bc') + 'a'
//        = (reverse('c') + 'b') + 'a'
//        = 'c' + 'b' + 'a'
//        = 'cba'
```

### Exemple — Tree traversal (DFS)

```typescript
type Tree<T> = { value: T; children: Tree<T>[] }

function sumTree(t: Tree<number>): number {
  return t.value + t.children.reduce(
    (acc, child) => acc + sumTree(child),  // récursif sur enfants
    0
  )
  // cas de base implicite : si pas d'enfants, .reduce sur [] retourne 0 sans récursion
}
```

C'est le pattern qui généralise à **tous les arbres**.

### Le piège : récursion sans bornes

```typescript
// ❌ INFINITE — pas de cas de base correct
function bad(n: number): number {
  return n * bad(n - 1)  // arrive à -1, -2, -3, ... ne s'arrête jamais
}

// ❌ INFINITE — sous-problème pas plus petit
function bad2(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr[0] + bad2(arr)  // arr ne change pas !
}
```

Tu obtiens un **stack overflow** : `RangeError: Maximum call stack size exceeded`. JS a une limite de pile typiquement 10-20k frames.

### Tail call vs non-tail

```typescript
// Non-tail : il y a un travail APRÈS l'appel récursif (la multiplication)
function factA(n: number): number {
  if (n <= 1) return 1
  return n * factA(n - 1)
}

// Tail : l'appel récursif est la DERNIÈRE chose
function factB(n: number, acc = 1): number {
  if (n <= 1) return acc
  return factB(n - 1, n * acc)
}
```

En théorie, le tail call peut être optimisé par le compilateur (Tail Call Optimization, TCO) → pas de stack frame supplémentaire → équivalent à une boucle.

**JS / TS** : la TCO est dans la spec (ES2015) mais **non implémentée** par V8 / SpiderMonkey / JavaScriptCore en pratique. Donc pour les grands inputs, tu **dois** convertir en boucle :

```typescript
function factIter(n: number): number {
  let acc = 1
  for (let i = 2; i <= n; i++) acc *= i
  return acc
}
```

### Memoization — éviter les recalculs

```typescript
// Fibonacci naïf : O(2ⁿ) — explose
function fibBad(n: number): number {
  if (n < 2) return n
  return fibBad(n - 1) + fibBad(n - 2)
}
// fibBad(40) = ~1 milliard d'appels

// Avec memoization : O(n) car chaque sous-problème calculé 1 seule fois
function fib(n: number, memo = new Map<number, number>()): number {
  if (n < 2) return n
  if (memo.has(n)) return memo.get(n)!
  const result = fib(n - 1, memo) + fib(n - 2, memo)
  memo.set(n, result)
  return result
}
// fib(40) = 78 appels distincts
```

C'est l'entrée vers la **programmation dynamique** (DP).

## Exemple concret

Backtracking — générer toutes les permutations :

```typescript
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr]   // cas de base : 1 seule permutation
  
  const result: T[][] = []
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i]
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)]  // sous-problème + petit
    for (const perm of permutations(remaining)) {
      result.push([current, ...perm])
    }
  }
  return result
}

permutations([1, 2, 3])
// [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
```

Cas de base : array de 1 élément. Sous-problème : array sans l'élément courant. Combinaison : préfixer chaque permutation par l'élément courant.

### Un exercice mental

> Comment écrire `Array.prototype.flat()` en récursif ?

```typescript
function flat<T>(arr: any[], depth = Infinity): T[] {
  if (depth === 0) return arr
  return arr.reduce((acc: T[], x) => {
    if (Array.isArray(x)) acc.push(...flat<T>(x, depth - 1))  // récursif
    else acc.push(x)                                            // cas de base
    return acc
  }, [])
}
```

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace" data-wiki-title="Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace" data-wiki-preview="**Big O** (`O(f(n))`) dénote la **borne supérieure asymptotique** du nombre d'opérations (ou d'octets de mémoire) qu'un algorithme effectue en fonction de la taille `n` de son input — on ignore les constantes et les termes mineurs pour ne g…">Concept - Big O analyse le comportement asymptotique d'un algo en temps et espace</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue" data-wiki-title="Concept - DFS explore en profondeur via stack, BFS en largeur via queue" data-wiki-preview="**DFS** (Depth-First Search) plonge le plus loin possible avant de backtracker via une **stack** (souvent récursive), **BFS** (Breadth-First Search) explore tous les voisins niveau par niveau via une **queue** — la **différence de structure…">Concept - DFS explore en profondeur via stack, BFS en largeur via queue</a> *(DFS récursif est l'application directe)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(la récursion + closures donne les helpers + accumulators)*

**Prérequis** :
- Fonctions JS / TS de base
- Notion de stack d'appels

**S'oppose à / à comparer avec** :
- **Itération avec boucle** : équivalent en puissance, parfois plus simple, plus efficient en mémoire (pas de stack)
- **Trampolining** : technique pour simuler la TCO en JS
- **Generators** : alternative pour les structures avec lazy evaluation

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-algos-data-structures-essentiels-en-typescript" data-wiki-title="Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)" data-wiki-preview="1. **Big O** : la métrique qui compte. Identifier les boucles imbriquées, le stockage proportionnel à l'input, le coût caché des opérations courantes (concat de strings, push d'array). 2. **Recursion** : la base pour les arbres, les graphes…">Algos &amp; data structures essentiels en TypeScript (cours Frontend Masters)</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

