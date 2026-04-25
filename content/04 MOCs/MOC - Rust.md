---
domain: rust
tags:
  - type/moc
  - domain/rust
---

# MOC - Rust

## Vue d'ensemble

> Domaine prioritaire de la veille. Rust est un langage système avec ownership, types stricts, et un écosystème async maturé. Objectif : maîtriser ownership, async/Tokio, traits avancés, puis l'écosystème (Axum, Serde, etc.).

## Concepts clés

### Fondations & philosophie
- [[Concept - Rust vise sécurité mémoire performance et concurrence simultanément]]

### Ownership & borrow checker
- [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]]

### Types & traits
- [[Concept - Les traits Rust offrent du polymorphisme à coût zéro grâce au dispatch statique]]

### Error handling & null safety
- [[Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result]]

### Outillage
- [[Concept - Cargo unifie build test doc et lint en un seul outil]]

## Sous-domaines à explorer

### Ownership & borrow checker
- *(à venir : règles de borrowing en détail, lifetimes explicites, `Box`/`Rc`/`Arc`)*

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
