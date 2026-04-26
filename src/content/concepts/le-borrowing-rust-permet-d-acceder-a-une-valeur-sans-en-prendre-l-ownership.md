---
created: 2026-04-26T00:00:00.000Z
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
title: >-
  Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre
  l'ownership
slug: le-borrowing-rust-permet-d-acceder-a-une-valeur-sans-en-prendre-l-ownership
excerpt: >-
  Sans borrowing, Rust serait inutilisable : chaque appel de fonction
  transférerait l'ownership et tu devrais soit cloner partout, soit retourner la
  valeur à chaque fois ("fn that takes a String and returns it back"). Le
  borrowing résout ce problème **sans introduire de risque mémo
oneLiner: >-
  Le **borrowing** consiste à passer une **référence** (`&T` ou `&mut T`) à une
  fonction au lieu de transférer l'ownership : la fonction peut **lire** (et
  éventuellement modifier) la valeur, mais **la valeur reste possédée par
  l'appelant** — c'est le mécanisme principal pour partager des données sans les
  déplacer.
related:
  - l-ownership-de-rust-remplace-garbage-collector-et-malloc-free
  - une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race
  - les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference
  - 2026-04-26-rust-borrowing-references-et-lifetimes-en-pratique
  - rust
backlinks:
  - 2026-04-26-rust-borrowing-references-et-lifetimes-en-pratique
  - box-rc-arc-gerent-l-ownership-partage-selon-le-besoin-de-threading
  - les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference
  - une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race
  - rust
topics:
  - rust
  - typescript
---

# Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership

## Idée en une phrase

> Le **borrowing** consiste à passer une **référence** (`&T` ou `&mut T`) à une fonction au lieu de transférer l'ownership : la fonction peut **lire** (et éventuellement modifier) la valeur, mais **la valeur reste possédée par l'appelant** — c'est le mécanisme principal pour partager des données sans les déplacer.

## Contexte / pourquoi ça compte

Sans borrowing, Rust serait inutilisable : chaque appel de fonction transférerait l'ownership et tu devrais soit cloner partout, soit retourner la valeur à chaque fois ("fn that takes a String and returns it back"). Le borrowing résout ce problème **sans introduire de risque mémoire**, contrairement aux pointeurs C où "passer une référence" peut signifier "use-after-free demain matin."

C'est aussi le concept qui distingue Rust de la plupart des autres langages : la frontière entre **propriétaire** et **emprunteur** est dans le système de types.

## Détails / mécanisme

### Deux types de références

| Référence | Capacité | Combien à la fois ? |
|---|---|---|
| `&T` | Lecture seule | **N**, autant qu'on veut |
| `&mut T` | Lecture + écriture | **Une seule** (et 0 `&T` en parallèle) |

### Conséquence : un type "ref" est différent du type sous-jacent

```rust
fn longueur(s: &String) -> usize { s.len() }

let s = String::from("hello");
let n = longueur(&s);     // on emprunte
println!("{}, {}", s, n); // s est encore là, parfaitement utilisable
```

`&String` est un **type différent** de `String` — on ne peut pas les confondre, et le compilateur sait à tout moment "j'ai une vraie String" vs "j'ai juste une référence vers une String que quelqu'un d'autre possède."

### Auto-déréférencement

```rust
let s = String::from("hello");
let r = &s;
println!("{}", r.len());    // équivalent à (*r).len()
```

Rust déréférence automatiquement quand tu appelles une méthode. Donc dans la pratique, tu vois rarement de `*` explicites.

### Borrowing mutable

```rust
fn ajouter_world(s: &mut String) {
    s.push_str(" world");
}

let mut s = String::from("hello"); // ← obligatoirement `mut`
ajouter_world(&mut s);              // ← obligatoirement `&mut`
println!("{}", s); // "hello world"
```

Trois "mut" : la déclaration de `s`, le passage `&mut s`, et le type de paramètre `&mut String`. Cela rend la mutation **localement visible et opt-in**, contrairement à TS où on ne sait jamais.

### Les conventions pour les méthodes

```rust
struct Counter { value: i32 }

impl Counter {
    fn get(&self) -> i32 { self.value }              // lecture
    fn increment(&mut self) { self.value += 1 }      // mutation
    fn into_value(self) -> i32 { self.value }        // consume self
}
```

`&self` / `&mut self` / `self` reproduisent les trois variants au niveau méthode.

## Exemple concret

Comparaison avec TypeScript pour cadrer :

```typescript
// TypeScript — tout est par référence implicite, pas de garantie
function appendWorld(s: { value: string }) {
  s.value += " world"
}
const obj = { value: "hello" }
appendWorld(obj)
console.log(obj.value) // "hello world"
// Mais rien ne m'a dit, à l'appel, que `appendWorld` allait muter `obj`
```

```rust
// Rust — explicit, vérifié, opt-in
fn ajouter_world(s: &mut String) {
    s.push_str(" world");
}
let mut s = String::from("hello");
ajouter_world(&mut s);  // ← le `&mut` à l'appel SIGNALE la mutation
```

Rust te force à écrire `&mut s` à l'appel — donc en relisant le code, tu sais immédiatement quelles lignes peuvent muter quoi. C'est une **propriété locale** du raisonnement, pas une lecture obligée du contrat.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ownership-de-rust-remplace-garbage-collector-et-malloc-free" data-wiki-title="Concept - L'ownership de Rust remplace garbage collector et malloc-free" data-wiki-preview="Chaque valeur a un seul propriétaire, libérée automatiquement à la fin de son scope — la mémoire est gérée **à la compilation**, sans garbage collector et sans `free()` manuel.">Concept - L'ownership de Rust remplace garbage collector et malloc-free</a> *(le borrowing est le mécanisme qui rend l'ownership praticable)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-seule-reference-mutable-ou-plusieurs-immutables-regle-anti-data-race" data-wiki-title="Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race" data-wiki-preview="À tout instant, sur une même valeur, le borrow checker n'autorise **qu'une seule référence mutable** (`&amp;mut T`) **OU** **plusieurs références immutables** (`&amp;T`) — jamais les deux à la fois — règle qui élimine les data races par constructio…">Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-lifetimes-rust-expriment-la-duree-de-validite-d-une-reference" data-wiki-title="Concept - Les lifetimes Rust expriment la durée de validité d'une référence" data-wiki-preview="Un **lifetime** est une **annotation de durée de validité** attachée à une référence — `&amp;'a T` signifie &quot;une référence valide pendant le lifetime nommé `'a`&quot; — et le compilateur s'en sert pour garantir qu'**aucune référence ne survit à la v…">Concept - Les lifetimes Rust expriment la durée de validité d'une référence</a>

**Prérequis** :
- Comprendre l'ownership (move, drop)

**S'oppose à / à comparer avec** :
- **Pointeurs C** (`*T`, `*const T`) : aucune garantie, peuvent dangling
- **Références C++** (`T&`) : pas de check de validité, mauvaise utilisation = UB
- **Références Java/JS** : objet référencé via le GC, pas de notion de mut/non-mut au niveau du langage

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-rust-borrowing-references-et-lifetimes-en-pratique" data-wiki-title="Rust — borrowing, références et lifetimes en pratique" data-wiki-preview="1. **Borrowing** = accéder à une valeur **sans** prendre l'ownership. Une référence est un pointeur sûr, vérifié à la compilation, distinct de l'ownership. 2. **Règle d'or** du borrow checker : à un instant T, tu peux avoir soit **une seule…">Rust — borrowing, références et lifetimes en pratique</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/rust" data-wiki-title="MOC - Rust" data-wiki-preview="- Concept - Rust vise sécurité mémoire performance et concurrence simultanément">MOC - Rust</a>

