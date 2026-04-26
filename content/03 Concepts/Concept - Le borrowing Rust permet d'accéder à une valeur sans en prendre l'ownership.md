---
created: 2026-04-26
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
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
- [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]] *(le borrowing est le mécanisme qui rend l'ownership praticable)*
- [[Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race]]
- [[Concept - Les lifetimes Rust expriment la durée de validité d'une référence]]

**Prérequis** :
- Comprendre l'ownership (move, drop)

**S'oppose à / à comparer avec** :
- **Pointeurs C** (`*T`, `*const T`) : aucune garantie, peuvent dangling
- **Références C++** (`T&`) : pas de check de validité, mauvaise utilisation = UB
- **Références Java/JS** : objet référencé via le GC, pas de notion de mut/non-mut au niveau du langage

## Sources

- [[2026-04-26 - Rust - borrowing références et lifetimes en pratique]]

## MOC

[[MOC - Rust]]
