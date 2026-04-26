---
created: 2026-04-26
domain: rust
level: intermediate
tags:
  - type/concept
  - domain/rust
  - level/intermediate
---

# Concept - Les lifetimes Rust expriment la durée de validité d'une référence

## Idée en une phrase

> Un **lifetime** est une **annotation de durée de validité** attachée à une référence — `&'a T` signifie "une référence valide pendant le lifetime nommé `'a`" — et le compilateur s'en sert pour garantir qu'**aucune référence ne survit à la valeur qu'elle pointe** (pas de dangling reference).

## Contexte / pourquoi ça compte

Sans lifetimes, Rust ne pourrait pas vérifier la sûreté du borrowing pour les fonctions et structs **génériques**. C'est l'extension naturelle des règles d'ownership à des cas où le compilateur a besoin d'aide pour comprendre **quelle entrée alimente quelle sortie**.

Bonne nouvelle pour le débutant : **dans 95% du code applicatif, tu n'écris aucun lifetime explicite**. Les règles d'élision les inférent automatiquement. Tu n'es forcé d'écrire `<'a>` que dans des situations spécifiques (et qui te font plus mal si tu ne comprends pas le concept).

## Détails / mécanisme

### Le problème qu'elles résolvent

```rust
// Sans annotation — refusé
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
//                              ^^^^ erreur : "missing lifetime specifier"
```

Le compilo dit : "Je ne sais pas si la `&str` retournée vient de `x` ou `y`. Je ne peux donc pas garantir qu'elle reste valide après l'appel." → il faut lui dire :

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

`'a` se lit "tick a." On dit : "x, y et le retour ont **un lifetime commun `'a`**" — concrètement, le compilo prend la **plus courte** des durées de vie de x et y comme `'a`.

### Anatomie

```rust
fn f<'a, 'b>(x: &'a String, y: &'b String) -> &'a String {
    x  // OK : on retourne x, qui a 'a
}
```

- `'a, 'b` : déclaration des lifetimes génériques (comme `<T>`)
- `&'a String` : "une référence à String, valide pendant `'a`"
- Type de retour `&'a String` : "valide pendant `'a` (donc pas plus longtemps que x)"

### Les règles d'élision (les 95% que tu ne tapes pas)

Le compilo applique automatiquement :
1. Chaque paramètre `&` reçoit son propre lifetime distinct
2. S'il y a **un seul** paramètre `&` en entrée, son lifetime est attribué à toutes les sorties
3. S'il y a **`&self`** ou **`&mut self`**, son lifetime est attribué aux sorties

```rust
// Tu écris ça :
fn first_word(s: &str) -> &str { /* ... */ }

// Le compilo voit ça :
fn first_word<'a>(s: &'a str) -> &'a str { /* ... */ }
```

### Les structs avec lifetime

```rust
struct Excerpt<'a> {
    text: &'a str,  // contient une référence
}

let novel = String::from("Call me Ishmael. ...");
let first = novel.split('.').next().unwrap();
let e = Excerpt { text: first }; // e ne peut pas vivre plus longtemps que novel
```

Conséquence : **partout où tu utilises `Excerpt`, tu dois propager le lifetime**. C'est viral. C'est pourquoi le pattern idiomatique en Rust applicatif est de **stocker des `String` (owned) plutôt que des `&str` (borrowed)** dans les structs.

```rust
// Idiomatique en applicatif
struct User { name: String }

// Plus rare — typique d'un parser/lib bas niveau
struct Token<'a> { text: &'a str }
```

### Le lifetime spécial `'static`

```rust
let s: &'static str = "hello"; // string literal — valide pour toute la durée du programme
```

`'static` veut dire "vit aussi longtemps que le programme tourne." Les literals sont `'static`. Beaucoup de débutants pensent qu'ajouter `'static` partout fait taire le compilo — c'est presque toujours **une mauvaise idée** : tu vas devoir leak ta mémoire ou n'utiliser que des constantes.

## Exemple concret

Cas concret dans une lib de parsing :

```rust
struct Parser<'src> {
    source: &'src str,
    position: usize,
}

impl<'src> Parser<'src> {
    fn new(source: &'src str) -> Self {
        Parser { source, position: 0 }
    }
    
    // Retourne une slice du source — son lifetime est lié au source
    fn peek_word(&self) -> &'src str {
        let rest = &self.source[self.position..];
        rest.split_whitespace().next().unwrap_or("")
    }
}

let input = String::from("hello world");
let p = Parser::new(&input);
let word = p.peek_word(); // word vit aussi longtemps que `input`, pas que `p`
```

C'est typiquement le cas où l'on **gagne** à ne pas allouer de String : on travaille en place sur le buffer source.

### Les lifetimes que tu ne croiseras presque jamais

- **HRTB (Higher-Ranked Trait Bounds)** : `for<'a> ...` — apparaît avec les closures comme arguments
- **GATs (Generic Associated Types)** : pour les itérateurs lending
- **Variance** : covariance/contravariance des lifetimes

Tout ça apparaît dans les libs (tokio, serde, futures). En applicatif, tu n'y touches pas.

## Connexions

**Concepts liés** :
- [[Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership]]
- [[Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race]]
- [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]]

**Prérequis** :
- Borrowing (`&T`, `&mut T`)
- Génériques basiques (`<T>`)

**S'oppose à / à comparer avec** :
- **GC** : pas besoin de lifetimes, le runtime track tout — coût en perf et latence (pause)
- **C/C++** : le concept existe (la durée de vie d'un objet) mais n'est **pas vérifié**, source de UB

## Sources

- [[2026-04-26 - Rust - borrowing références et lifetimes en pratique]]

## MOC

[[MOC - Rust]]
