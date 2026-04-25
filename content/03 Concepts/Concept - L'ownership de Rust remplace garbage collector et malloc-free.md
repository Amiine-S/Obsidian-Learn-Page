---
created: 2026-04-25
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
---

# Concept - L'ownership de Rust remplace garbage collector et malloc-free

## Idée en une phrase

> Chaque valeur a un seul propriétaire, libérée automatiquement à la fin de son scope — la mémoire est gérée **à la compilation**, sans garbage collector et sans `free()` manuel.

## Contexte / pourquoi ça compte

C'est **l'idée centrale** de Rust. Toute sa singularité par rapport aux autres langages part d'ici. Si tu comprends ownership, tu comprends 80 % de ce qui rend Rust différent.

Les deux modèles classiques avant Rust :

- **Manuel (C/C++)** : `malloc()` puis `free()` à la main. Source de tous les pires bugs : leaks, double-free, use-after-free, dangling pointers. Performance maximale, sécurité minimale.
- **Automatique (Java, Go, JS, Python)** : un garbage collector scanne périodiquement la mémoire et libère ce qui n'est plus référencé. Sûr, mais : pause GC imprévisible, surcoût mémoire (le GC consomme), tuning compliqué (G1, ZGC, etc.).

Rust propose un **troisième modèle** : la mémoire est gérée à la compilation via les **3 règles d'ownership** vérifiées par le compilateur ("borrow checker").

## Détails / mécanisme

**Les 3 règles d'ownership** :
1. Chaque valeur a un **propriétaire** (une variable).
2. Il n'y a **qu'un seul propriétaire à la fois**.
3. Quand le propriétaire **sort de scope**, la valeur est libérée (le compilateur insère un appel à `drop()`).

À ça s'ajoutent les **règles de borrowing** (emprunt par référence) :
- Tu peux avoir **soit une référence mutable**, **soit plusieurs références immutables** — jamais les deux en même temps.
- Toutes les références doivent rester valides tant qu'elles existent (pas de dangling).

Ces règles paraissent restrictives mais elles **éliminent par construction** tous les bugs mémoire et la majorité des data races.

## Exemple concret

```rust
fn main() {
    let s1 = String::from("hello");  // s1 possède la String
    let s2 = s1;                     // ownership transférée à s2 (move)
    
    println!("{}", s1);              // ❌ erreur de compil : s1 n'est plus valide
    println!("{}", s2);              // ✅ ok
}                                    // s2 sort de scope → la String est libérée
```

**Équivalent TS/JS** :
```typescript
const s1 = "hello";
const s2 = s1;        // s1 et s2 référencent la même string
console.log(s1);      // ✅ marche, GC s'occupera des deux
console.log(s2);      // ✅
// Le GC libère quand plus rien ne référence
```

Pour partager au lieu de transférer, Rust utilise les **références** :
```rust
let s1 = String::from("hello");
let s2 = &s1;          // emprunt immutable, s1 reste propriétaire
println!("{} {}", s1, s2);  // ✅ les deux marchent
```

## Connexions

**Concepts liés** :
- [[Concept - Rust vise sécurité mémoire performance et concurrence simultanément]] *(c'est ownership qui rend ça possible)*

**Prérequis** :
- [[Concept - Rust vise sécurité mémoire performance et concurrence simultanément]] *(comprendre le pourquoi avant le comment)*

**S'oppose à / à comparer avec** :
- **Garbage collection** (Java, Go, JS) : libération à l'exécution, pause GC
- **Manuel** (C, C++) : `malloc`/`free`, bugs faciles
- **RAII C++** : Rust formalise et étend cette idée avec le borrow checker

## Sources

- [[2026-04-25 - Introduction à Rust pour un dev TypeScript]]

## MOC

[[MOC - Rust]]
