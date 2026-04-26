---
created: 2026-04-25T00:00:00.000Z
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
title: >-
  Concept - Les traits Rust offrent du polymorphisme à coût zéro grâce au
  dispatch statique
slug: >-
  les-traits-rust-offrent-du-polymorphisme-a-cout-zero-grace-au-dispatch-statique
excerpt: >-
  Les traits sont **le mécanisme de polymorphisme** de Rust. Tout ce que tu fais
  via classes/héritage/interfaces en TS, tu le fais via traits en Rust.
  Comprendre les traits, c'est comprendre comment on structure du code Rust
  idiomatique.
oneLiner: >-
  Un `trait` Rust ressemble à une `interface` TS, mais l'appel d'une méthode sur
  un générique compile en **code spécialisé** (monomorphisation) — donc aussi
  rapide qu'un appel direct, sans vtable.
related:
  - rust-vise-securite-memoire-performance-et-concurrence-simultanement
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - rust
backlinks:
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - rust-vise-securite-memoire-performance-et-concurrence-simultanement
  - rust
topics:
  - frontend
  - mobile
  - rust
  - typescript
---

# Concept - Les traits Rust offrent du polymorphisme à coût zéro grâce au dispatch statique

## Idée en une phrase

> Un `trait` Rust ressemble à une `interface` TS, mais l'appel d'une méthode sur un générique compile en **code spécialisé** (monomorphisation) — donc aussi rapide qu'un appel direct, sans vtable.

## Contexte / pourquoi ça compte

Les traits sont **le mécanisme de polymorphisme** de Rust. Tout ce que tu fais via classes/héritage/interfaces en TS, tu le fais via traits en Rust. Comprendre les traits, c'est comprendre comment on structure du code Rust idiomatique.

Le truc important pour un dev TS : **Rust n'a pas d'héritage de classes**. Il n'y a que les structs (data) et les traits (behavior). C'est plus proche de Go que de Java/C#.

Le slogan "**zero-cost abstraction**" vient principalement de là : un générique avec contrainte de trait compile en code spécialisé pour chaque type concret utilisé. Pas de vtable lookup à l'exécution.

## Détails / mécanisme

**Un `trait` = un contrat de comportement** :
```rust
trait Greeter {
    fn greet(&self) -> String;
}

struct French;
struct English;

impl Greeter for French {
    fn greet(&self) -> String { "Salut !".to_string() }
}

impl Greeter for English {
    fn greet(&self) -> String { "Hello!".to_string() }
}
```

Trois différences clés vs `interface` TS :

### 1. Implémentation séparée du type
En TS, tu déclares qu'une classe implémente une interface dans la déclaration de classe. En Rust, **`impl Trait for Type` peut être ailleurs** — tu peux ajouter des méthodes à un type que tu n'as pas écrit (sous certaines règles, dites "orphan rule").

C'est l'équivalent des **méthodes d'extension** en C#/Kotlin, ou des prototypes en JS — mais propre et typé.

### 2. Dispatch statique par défaut (monomorphisation)
```rust
fn say_hello<G: Greeter>(g: &G) {
    println!("{}", g.greet());
}

say_hello(&French);   // compile une version spécialisée pour French
say_hello(&English);  // compile une version spécialisée pour English
```
Le compilateur génère **deux fonctions distinctes** à la compilation. À l'exécution, c'est un appel direct, **aussi rapide qu'un appel non polymorphe**. C'est le "zero cost".

Coût : binaire un peu plus gros (une copie par type concret).

### 3. Dispatch dynamique opt-in (`dyn Trait`)
Quand tu veux le comportement TS (un seul appel pour plusieurs types) :
```rust
fn say_hello(g: &dyn Greeter) {  // dispatch dynamique via vtable
    println!("{}", g.greet());
}

let greeters: Vec<Box<dyn Greeter>> = vec![Box::new(French), Box::new(English)];
```
Là tu as une vtable, comme en TS — mais c'est **explicite** dans la signature.

## Exemple concret

**TypeScript** :
```typescript
interface Greeter {
  greet(): string;
}

class French implements Greeter {
  greet() { return "Salut !"; }
}

function sayHello(g: Greeter) {  // toujours dispatch dynamique
  console.log(g.greet());
}
```

**Rust idiomatique (générique, dispatch statique)** :
```rust
fn say_hello<G: Greeter>(g: &G) {
    println!("{}", g.greet());
}
```

Pour un dev TS habitué à `class Foo implements Bar`, le mental shift c'est :
- Les **données** vivent dans des `struct`.
- Le **comportement** vit dans des `trait` + `impl`.
- Pas d'héritage : on **compose** des traits.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/rust-vise-securite-memoire-performance-et-concurrence-simultanement" data-wiki-title="Concept - Rust vise sécurité mémoire performance et concurrence simultanément" data-wiki-preview="Rust est conçu pour offrir **les trois en même temps** — sécurité mémoire, performance native, concurrence sans data races — là où les langages précédents en abandonnaient toujours au moins un.">Concept - Rust vise sécurité mémoire performance et concurrence simultanément</a> *(les zero-cost abstractions servent l'objectif perf)*
- *(à venir : génériques, lifetimes, `dyn Trait`, blanket impls, derive macros)*

**Prérequis** :
- Notions de base de struct et de méthodes en Rust

**S'oppose à / à comparer avec** :
- **`interface` TypeScript** : toujours dispatch dynamique, pas d'extension externe (sauf hack via prototype)
- **Classes Java/C#** : héritage + interfaces, dispatch dynamique par défaut
- **Type classes Haskell** : Rust en est une descendance directe

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-introduction-a-rust-pour-un-dev-typescript" data-wiki-title="Introduction à Rust pour un dev TypeScript" data-wiki-preview="1. Rust est un **langage système** créé chez Mozilla (2010, 1.0 en 2015), maintenant porté par la Rust Foundation. 2. Son objectif : offrir **les performances de C/C++ + la sécurité mémoire + la concurrence sans data races**, simultanément.…">Introduction à Rust pour un dev TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/rust" data-wiki-title="MOC - Rust" data-wiki-preview="- Concept - Rust vise sécurité mémoire performance et concurrence simultanément">MOC - Rust</a>

