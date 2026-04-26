---
domain: rust
tags:
  - type/moc
  - domain/rust
title: MOC - Rust
slug: rust
excerpt: >-
  - Concept - Rust vise sécurité mémoire performance et concurrence
  simultanément
related:
  - rust-vise-securite-memoire-performance-et-concurrence-simultanement
  - l-ownership-de-rust-remplace-garbage-collector-et-malloc-free
  - >-
    les-traits-rust-offrent-du-polymorphisme-a-cout-zero-grace-au-dispatch-statique
  - en-rust-l-absence-et-l-erreur-sont-des-valeurs-typees-avec-option-et-result
  - cargo-unifie-build-test-doc-et-lint-en-un-seul-outil
  - le-borrowing-rust-permet-d-acceder-a-une-valeur-sans-en-prendre-l-ownership
  - une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race
  - les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference
  - box-rc-arc-gerent-l-ownership-partage-selon-le-besoin-de-threading
backlinks:
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - 2026-04-26-rust-borrowing-references-et-lifetimes-en-pratique
  - box-rc-arc-gerent-l-ownership-partage-selon-le-besoin-de-threading
  - cargo-unifie-build-test-doc-et-lint-en-un-seul-outil
  - en-rust-l-absence-et-l-erreur-sont-des-valeurs-typees-avec-option-et-result
  - l-ownership-de-rust-remplace-garbage-collector-et-malloc-free
  - le-borrowing-rust-permet-d-acceder-a-une-valeur-sans-en-prendre-l-ownership
  - les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference
  - >-
    les-traits-rust-offrent-du-polymorphisme-a-cout-zero-grace-au-dispatch-statique
  - rust-vise-securite-memoire-performance-et-concurrence-simultanement
  - une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race
topics:
  - database
  - fp
  - performance
  - rust
  - systems
  - tooling
---

# MOC - Rust

## Vue d'ensemble

> Domaine prioritaire de la veille. Rust est un langage système avec ownership, types stricts, et un écosystème async maturé. Objectif : maîtriser ownership, async/Tokio, traits avancés, puis l'écosystème (Axum, Serde, etc.).

## Concepts clés

### Fondations & philosophie
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/rust-vise-securite-memoire-performance-et-concurrence-simultanement" data-wiki-title="Concept - Rust vise sécurité mémoire performance et concurrence simultanément" data-wiki-preview="Rust est conçu pour offrir **les trois en même temps** — sécurité mémoire, performance native, concurrence sans data races — là où les langages précédents en abandonnaient toujours au moins un.">Concept - Rust vise sécurité mémoire performance et concurrence simultanément</a>

### Ownership & borrow checker
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ownership-de-rust-remplace-garbage-collector-et-malloc-free" data-wiki-title="Concept - L'ownership de Rust remplace garbage collector et malloc-free" data-wiki-preview="Chaque valeur a un seul propriétaire, libérée automatiquement à la fin de son scope — la mémoire est gérée **à la compilation**, sans garbage collector et sans `free()` manuel.">Concept - L'ownership de Rust remplace garbage collector et malloc-free</a>

### Types & traits
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-traits-rust-offrent-du-polymorphisme-a-cout-zero-grace-au-dispatch-statique" data-wiki-title="Concept - Les traits Rust offrent du polymorphisme à coût zéro grâce au dispatch statique" data-wiki-preview="Un `trait` Rust ressemble à une `interface` TS, mais l'appel d'une méthode sur un générique compile en **code spécialisé** (monomorphisation) — donc aussi rapide qu'un appel direct, sans vtable.">Concept - Les traits Rust offrent du polymorphisme à coût zéro grâce au dispatch statique</a>

### Error handling & null safety
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/en-rust-l-absence-et-l-erreur-sont-des-valeurs-typees-avec-option-et-result" data-wiki-title="Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result" data-wiki-preview="Rust n'a **ni `null` ni exceptions** : l'absence d'une valeur s'exprime via `Option&lt;T&gt;`, l'erreur via `Result&lt;T, E&gt;`, et le compilateur **t'oblige** à gérer les deux cas.">Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result</a>

### Outillage
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/cargo-unifie-build-test-doc-et-lint-en-un-seul-outil" data-wiki-title="Concept - Cargo unifie build test doc et lint en un seul outil" data-wiki-preview="Là où l'écosystème JS empile `npm` + `tsc` + `vite` + `vitest` + `eslint` + `prettier` + `typedoc`, Rust met **tout** dans `cargo` — un seul outil officiel, intégré, cohérent.">Concept - Cargo unifie build test doc et lint en un seul outil</a>

### Borrowing, références, lifetimes
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-borrowing-rust-permet-d-acceder-a-une-valeur-sans-en-prendre-l-ownership" data-wiki-title="Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership" data-wiki-preview="Le **borrowing** consiste à passer une **référence** (`&amp;T` ou `&amp;mut T`) à une fonction au lieu de transférer l'ownership : la fonction peut **lire** (et éventuellement modifier) la valeur, mais **la valeur reste possédée par l'appelant** —…">Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race" data-wiki-title="Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race" data-wiki-preview="À tout instant, sur une même valeur, le borrow checker n'autorise **qu'une seule référence mutable** (`&amp;mut T`) **OU** **plusieurs références immutables** (`&amp;T`) — jamais les deux à la fois — règle qui élimine les data races par constructio…">Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference" data-wiki-title="Concept - Les lifetimes Rust expriment la durée de validité d'une référence" data-wiki-preview="Un **lifetime** est une **annotation de durée de validité** attachée à une référence — `&amp;'a T` signifie &quot;une référence valide pendant le lifetime nommé `'a`&quot; — et le compilateur s'en sert pour garantir qu'**aucune référence ne survit à la v…">Concept - Les lifetimes Rust expriment la durée de validité d'une référence</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/box-rc-arc-gerent-l-ownership-partage-selon-le-besoin-de-threading" data-wiki-title="Concept - Box Rc Arc gèrent l'ownership partagé selon le besoin de threading" data-wiki-preview="`Box&lt;T&gt;`, `Rc&lt;T&gt;` et `Arc&lt;T&gt;` sont les **trois smart pointers** principaux de Rust pour allouer sur le tas et/ou partager l'ownership : `Box` = un seul propriétaire, `Rc` = N propriétaires mono-thread, `Arc` = N propriétaires multi-thread —…">Concept - Box Rc Arc gèrent l'ownership partagé selon le besoin de threading</a>

## Sous-domaines à explorer

### Ownership & borrow checker
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-borrowing-rust-permet-d-acceder-a-une-valeur-sans-en-prendre-l-ownership" data-wiki-title="Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership" data-wiki-preview="Le **borrowing** consiste à passer une **référence** (`&amp;T` ou `&amp;mut T`) à une fonction au lieu de transférer l'ownership : la fonction peut **lire** (et éventuellement modifier) la valeur, mais **la valeur reste possédée par l'appelant** —…">Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race" data-wiki-title="Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race" data-wiki-preview="À tout instant, sur une même valeur, le borrow checker n'autorise **qu'une seule référence mutable** (`&amp;mut T`) **OU** **plusieurs références immutables** (`&amp;T`) — jamais les deux à la fois — règle qui élimine les data races par constructio…">Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference" data-wiki-title="Concept - Les lifetimes Rust expriment la durée de validité d'une référence" data-wiki-preview="Un **lifetime** est une **annotation de durée de validité** attachée à une référence — `&amp;'a T` signifie &quot;une référence valide pendant le lifetime nommé `'a`&quot; — et le compilateur s'en sert pour garantir qu'**aucune référence ne survit à la v…">Concept - Les lifetimes Rust expriment la durée de validité d'une référence</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/box-rc-arc-gerent-l-ownership-partage-selon-le-besoin-de-threading" data-wiki-title="Concept - Box Rc Arc gèrent l'ownership partagé selon le besoin de threading" data-wiki-preview="`Box&lt;T&gt;`, `Rc&lt;T&gt;` et `Arc&lt;T&gt;` sont les **trois smart pointers** principaux de Rust pour allouer sur le tas et/ou partager l'ownership : `Box` = un seul propriétaire, `Rc` = N propriétaires mono-thread, `Arc` = N propriétaires multi-thread —…">Concept - Box Rc Arc gèrent l'ownership partagé selon le besoin de threading</a>

### Types & traits
- *(à venir : génériques, `dyn Trait`, derive macros, blanket impls)*

### Async & concurrence (Tokio)
- *(à venir : modèle async/await Rust, runtime Tokio, channels, `Send`/`Sync`)*

### Error handling
- *(à venir : opérateur `?`, `thiserror` vs `anyhow`, conversion d'erreurs)*

### Écosystème (crates phares)
- *(à venir : Serde, Axum, Tokio, Reqwest, SQLx)*

### Macros & metaprogramming
- *(à venir : macros déclaratives, derive macros, proc macros)*

### Performance & unsafe
- *(à venir : profiling, `unsafe`, FFI)*

## Sources de référence

- [The Rust Programming Language ("The Book")](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Jon Gjengset (YouTube)](https://www.youtube.com/c/JonGjengset)
- [This Week in Rust](https://this-week-in-rust.org/)

## Schémas

- *(à venir : ownership, lifetimes, async runtime)*

## Questions ouvertes

- Quand préférer `Arc<Mutex<T>>` vs message-passing avec channels ?
- Comment penser les lifetimes complexes (HRTB) sans s'y perdre ?
- Patterns idiomatiques pour les erreurs : `thiserror` vs `anyhow` selon le contexte ?
- Async trait : où en est-on en 2026 (stabilisation, perfs, dyn) ?

