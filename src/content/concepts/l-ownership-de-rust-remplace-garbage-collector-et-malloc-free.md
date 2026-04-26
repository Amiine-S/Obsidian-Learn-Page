---
created: 2026-04-25T00:00:00.000Z
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
title: Concept - L'ownership de Rust remplace garbage collector et malloc-free
slug: l-ownership-de-rust-remplace-garbage-collector-et-malloc-free
excerpt: >-
  C'est **l'idée centrale** de Rust. Toute sa singularité par rapport aux autres
  langages part d'ici. Si tu comprends ownership, tu comprends 80 % de ce qui
  rend Rust différent.
oneLiner: >-
  Chaque valeur a un seul propriétaire, libérée automatiquement à la fin de son
  scope — la mémoire est gérée **à la compilation**, sans garbage collector et
  sans `free()` manuel.
related:
  - rust-vise-securite-memoire-performance-et-concurrence-simultanement
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - rust
backlinks:
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - 2026-04-26-rust-borrowing-references-et-lifetimes-en-pratique
  - box-rc-arc-gerent-l-ownership-partage-selon-le-besoin-de-threading
  - le-borrowing-rust-permet-d-acceder-a-une-valeur-sans-en-prendre-l-ownership
  - >-
    les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out
  - les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference
  - rust-vise-securite-memoire-performance-et-concurrence-simultanement
  - une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race
  - rust
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
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/rust-vise-securite-memoire-performance-et-concurrence-simultanement" data-wiki-title="Concept - Rust vise sécurité mémoire performance et concurrence simultanément" data-wiki-preview="Rust est conçu pour offrir **les trois en même temps** — sécurité mémoire, performance native, concurrence sans data races — là où les langages précédents en abandonnaient toujours au moins un.">Concept - Rust vise sécurité mémoire performance et concurrence simultanément</a> *(c'est ownership qui rend ça possible)*

**Prérequis** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/rust-vise-securite-memoire-performance-et-concurrence-simultanement" data-wiki-title="Concept - Rust vise sécurité mémoire performance et concurrence simultanément" data-wiki-preview="Rust est conçu pour offrir **les trois en même temps** — sécurité mémoire, performance native, concurrence sans data races — là où les langages précédents en abandonnaient toujours au moins un.">Concept - Rust vise sécurité mémoire performance et concurrence simultanément</a> *(comprendre le pourquoi avant le comment)*

**S'oppose à / à comparer avec** :
- **Garbage collection** (Java, Go, JS) : libération à l'exécution, pause GC
- **Manuel** (C, C++) : `malloc`/`free`, bugs faciles
- **RAII C++** : Rust formalise et étend cette idée avec le borrow checker

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-introduction-a-rust-pour-un-dev-typescript" data-wiki-title="Introduction à Rust pour un dev TypeScript" data-wiki-preview="1. Rust est un **langage système** créé chez Mozilla (2010, 1.0 en 2015), maintenant porté par la Rust Foundation. 2. Son objectif : offrir **les performances de C/C++ + la sécurité mémoire + la concurrence sans data races**, simultanément.…">Introduction à Rust pour un dev TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/rust" data-wiki-title="MOC - Rust" data-wiki-preview="- Concept - Rust vise sécurité mémoire performance et concurrence simultanément">MOC - Rust</a>

