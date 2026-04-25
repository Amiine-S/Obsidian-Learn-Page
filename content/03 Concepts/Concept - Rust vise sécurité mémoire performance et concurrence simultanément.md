---
created: 2026-04-25
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
---

# Concept - Rust vise sécurité mémoire performance et concurrence simultanément

## Idée en une phrase

> Rust est conçu pour offrir **les trois en même temps** — sécurité mémoire, performance native, concurrence sans data races — là où les langages précédents en abandonnaient toujours au moins un.

## Contexte / pourquoi ça compte

Pendant des décennies, choisir un langage = faire des compromis sur ce trilemme :

| Langage | Sécurité mémoire | Performance native | Concurrence sûre |
|---|---|---|---|
| **C / C++** | ❌ (segfaults, leaks, use-after-free) | ✅ | ❌ (data races faciles) |
| **Java / C# / Go** | ✅ (GC) | ⚠️ (pause GC, allocations) | ⚠️ (sûr en partie, encore des data races possibles en Go) |
| **JS / TS / Python** | ✅ (GC + interprété) | ❌ | ❌ (single-thread + event loop) |
| **Rust** | ✅ | ✅ | ✅ |

C'est le pitch fondamental de Rust. Tout le reste du langage (ownership, traits, lifetimes) découle de cet objectif.

## Détails / mécanisme

Rust déplace les vérifications **du runtime vers le compilateur** :

- **Pas de garbage collector** : la libération mémoire est calculée à la compilation par le système d'ownership → pas de pause GC, mémoire prédictible.
- **Pas de runtime managé lourd** : un binaire Rust tourne sans VM, comme un binaire C.
- **"Fearless concurrency"** : le compilateur prouve qu'aucune donnée partagée n'est accédée en lecture/écriture simultanément sans synchronisation. Si le code compile, il est garanti sans data race.
- **Zero-cost abstractions** : les abstractions haut niveau (génériques, traits, async) compilent en code aussi efficace que du C écrit à la main.

Le prix à payer : une **courbe d'apprentissage abrupte**, surtout autour de l'ownership/borrowing. Le compilateur refusera beaucoup de code qui marcherait en TS — souvent à juste titre.

## Exemple concret

Comparaison du même problème "deux threads incrémentent un compteur" :

**JavaScript / TypeScript** : single-thread, le problème ne se pose pas (mais tu ne peux pas profiter de plusieurs cœurs sans `worker_threads`).

**Java** : compile et tourne, mais peut avoir un data race silencieux. Bug en prod, à toi de poser un `synchronized`.

**Rust** :
```rust
let counter = 0;
std::thread::spawn(|| { counter += 1 }); // ❌ ne compile pas
```
Le compilateur refuse : `counter` ne peut pas être partagé entre threads sans `Arc<Mutex<…>>`. Tu **ne peux pas** introduire un data race par accident.

## Connexions

**Concepts liés** :
- [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]] *(le mécanisme qui permet la sécurité mémoire sans GC)*
- [[Concept - Les traits Rust offrent du polymorphisme à coût zéro grâce au dispatch statique]] *(une des "zero-cost abstractions")*

**Prérequis** :
- *(aucun, c'est le point de départ)*

**S'oppose à / à comparer avec** :
- Modèle JS/TS : sécurité par GC + single-thread → pas de problème de concurrence mais pas de perf multi-cœurs
- Modèle C/C++ : perf maximale mais responsabilité totale du dev sur la sécurité

## Sources

- [[2026-04-25 - Introduction à Rust pour un dev TypeScript]]

## MOC

[[MOC - Rust]]
