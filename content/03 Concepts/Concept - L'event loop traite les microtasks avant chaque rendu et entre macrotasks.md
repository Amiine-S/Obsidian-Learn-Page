---
created: 2026-04-26
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks

## Idée en une phrase

> L'**event loop JS** alterne : exécuter le code synchrone jusqu'à pile vide, **vider toute la microtask queue** (Promises, `queueMicrotask`), prendre **une seule** macrotask (`setTimeout`, événements DOM, I/O), puis recommencer — c'est cette priorité microtask > macrotask qui explique l'ordre d'exécution étrange des Promises et timeouts.

## Contexte / pourquoi ça compte

L'event loop est **invisible** quand ton code marche, mais inévitable dès qu'il ne marche pas. Comprendre la distinction microtask / macrotask, c'est :
- Pouvoir prédire l'ordre de logs entre `setTimeout(fn, 0)` et `Promise.resolve().then(fn)`
- Comprendre pourquoi un freeze UI peut arriver sans CPU saturé (boucle infinie de microtasks)
- Savoir quand utiliser `queueMicrotask` vs `setTimeout(0)` vs `requestAnimationFrame`
- Débugger des courses entre rendu et update d'état

## Détails / mécanisme

### Les 3 queues principales

| Queue | Contient | Priorité |
|---|---|---|
| Call stack | Code synchrone en cours | exécuté immédiatement |
| Microtask queue | `Promise.then`, `queueMicrotask`, `MutationObserver` | drainée totalement après chaque task |
| Macrotask queue (Task queue) | `setTimeout`, `setInterval`, événements I/O, `MessageChannel`, `setImmediate` (Node) | une seule prise par tour de boucle |

À part :
- **Animation frame queue** : `requestAnimationFrame` — exécutée juste avant le rendu, ~16ms à 60Hz
- **Render steps** : layout + paint, intercalés entre macrotasks (browser only)

### Algorithme simplifié (browser)

```
loop:
  // 1. Exécuter une macrotask
  task = macrotask_queue.shift()
  run(task)
  
  // 2. Drainer toute la microtask queue
  while microtask_queue not empty:
    run(microtask_queue.shift())
  
  // 3. (Si rendering nécessaire)
  run_animation_frames()
  perform_layout()
  paint()
  
  // 4. Recommencer
```

Note importante : **la microtask queue est drainée jusqu'au bout**. Si une microtask en ajoute une nouvelle, celle-ci tourne aussi avant la prochaine macrotask. Ce qui peut **bloquer le rendu**.

### Le piège classique

```typescript
console.log("1")
setTimeout(() => console.log("2"), 0)
Promise.resolve().then(() => console.log("3"))
console.log("4")
```

Output : `1 4 3 2`

- `1` : sync
- `4` : sync (`setTimeout` enqueue la macrotask, `then` enqueue la microtask, mais on continue le sync)
- `3` : sync terminé → microtask drainée
- `2` : prochaine macrotask

### Le freeze sans CPU saturé

```typescript
function loop() {
  Promise.resolve().then(loop)  // microtask qui se réenqueue
}
loop()
// Le browser ne render JAMAIS — la microtask queue ne se vide jamais
```

Versus :
```typescript
function loop() {
  setTimeout(loop, 0)  // macrotask
}
loop()
// Le browser render normalement — chaque tour passe par le rendu
```

C'est pourquoi `setTimeout(0)` est parfois utilisé pour "céder le contrôle au browser" — il garantit qu'un cycle de rendu peut se glisser.

### Cas d'usage des différentes queues

| Tu veux... | Utilise |
|---|---|
| Différer juste après le code courant, avant rendu | `queueMicrotask` ou `Promise.resolve().then` |
| Différer après le prochain cycle, en laissant rendre | `setTimeout(0)` |
| Synchroniser avec un cycle de rendu | `requestAnimationFrame` |
| Dépanner un freeze de microtasks | passer en `setTimeout(0)` |
| Tâche longue + responsive | `requestIdleCallback` (idle queue) ou découper avec `setTimeout(0)` |

### Node.js — variations

Node a un event loop **différent** (libuv) avec plusieurs phases (timers, pending, poll, check, close). Microtasks (Promises) sont drainées entre phases. `setImmediate` ≈ macrotask post-I/O. `process.nextTick` est une queue **encore plus prioritaire** que les microtasks (utiliser avec précaution).

## Exemple concret

Démontrer l'interleaving avec un test concret :

```typescript
console.log("A")

setTimeout(() => console.log("B - timeout 1"), 0)

Promise.resolve()
  .then(() => {
    console.log("C - microtask 1")
    return Promise.resolve()
  })
  .then(() => console.log("D - microtask 2 (chained)"))

setTimeout(() => console.log("E - timeout 2"), 0)

queueMicrotask(() => console.log("F - explicit microtask"))

console.log("G")

// Output:
// A
// G
// C - microtask 1
// F - explicit microtask
// D - microtask 2 (chained)
// B - timeout 1
// E - timeout 2
```

Toutes les microtasks (C, F, D — même celles ajoutées dynamiquement) tournent **avant** les macrotasks (B, E).

## Connexions

**Concepts liés** :
- [[Concept - Un thunk est une fonction qui retarde l'évaluation]] *(les callbacks dans la macrotask queue sont des thunks)*
- [[Concept - this en JavaScript dépend du site d'appel pas de la définition]] *(l'event loop appelle tes callbacks "nus", donc `this` est souvent surprenant)*

**Prérequis** :
- Notion de Promise et `async/await`
- Notion de callback

**S'oppose à / à comparer avec** :
- **Threads OS** : vrai parallélisme, vs JS mono-thread
- **Coroutines (Kotlin, Go)** : autre façon de gérer la concurrence sans threads — Go a des goroutines, JS a l'event loop
- **Fibers (Effect-TS, React Concurrent)** : abstraction *au-dessus* de l'event loop pour gérer interruptions et priorités

## Sources

- [[2026-04-26 - JavaScript en profondeur - concepts mal connus]]

## MOC

[[MOC - Frontend]]
