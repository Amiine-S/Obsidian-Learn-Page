---
title: Rust — borrowing, références et lifetimes en pratique
url: 
author: Claude (synthèse)
published: 
digested: 2026-04-26
format: doc
domain: rust
level: beginner
tags:
  - type/source
  - status/done
  - domain/rust
  - format/doc
  - level/beginner
---

# Rust — borrowing, références et lifetimes en pratique

## Pourquoi cette source

> Suite logique de la note d'intro Rust. L'ownership a été présenté ; maintenant on rentre dans **les règles précises de borrowing**, **les lifetimes**, et **`Box` / `Rc` / `Arc`** — la zone qui fait dire "le borrow checker me déteste" pendant 2 semaines, puis "ah, je comprends pourquoi c'est comme ça."

## Résumé en 5 lignes

1. **Borrowing** = accéder à une valeur **sans** prendre l'ownership. Une référence est un pointeur sûr, vérifié à la compilation, distinct de l'ownership.
2. **Règle d'or** du borrow checker : à un instant T, tu peux avoir soit **une seule référence mutable**, soit **N références immutables** — jamais les deux. C'est ce qui élimine les data races par construction.
3. **Lifetimes** = annotations qui expriment la **durée de validité** d'une référence. Le compilateur infère la plupart du temps ; tu n'écris `<'a>` que quand l'inférence ne suffit pas (typiquement : retourner une référence depuis une fonction).
4. **`Box<T>` / `Rc<T>` / `Arc<T>`** = trois façons d'allouer sur le tas et/ou de partager l'ownership. `Box` = ownership unique, `Rc` = ownership partagé mono-thread, `Arc` = ownership partagé thread-safe. Chacun a un coût et une zone d'usage précis.
5. Le borrow checker n'est pas une "vérification chiante" — c'est une **discipline architecturale** qui transforme tes erreurs runtime (use-after-free, data races) en erreurs de compilation. Une fois acquis, on l'utilise dans les autres langages "mentalement."

---

## 1. Rappel express : ownership

> Détaillé ici : [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]]

```rust
fn main() {
    let s = String::from("hello"); // s OWNS the String
    takes_ownership(s);             // s passé par valeur → ownership transféré
    // println!("{}", s);           // ❌ ne compile pas : s ne possède plus rien
}
fn takes_ownership(v: String) {
    println!("{}", v);
} // v sort du scope → la mémoire est libérée
```

C'est un **move** : ce qui était implicite en TS (passer un objet à une fonction = passer la référence) est explicite et destructif en Rust.

---

## 2. Borrowing — accéder sans posséder

L'idée du borrowing est simple : tu veux **lire** ou **modifier** une valeur sans la consommer. Solution : passer une **référence**.

### Référence immutable (`&T`)

```rust
fn main() {
    let s = String::from("hello");
    print_str(&s);          // on PRÊTE s (borrow), on ne le déplace pas
    println!("{}", s);      // ✅ s est encore là
}
fn print_str(v: &String) {  // v est une référence — type différent de String
    println!("{}", v);
} // v sort du scope, mais on n'avait que prêté → rien à libérer
```

### Référence mutable (`&mut T`)

```rust
fn main() {
    let mut s = String::from("hello");
    add_world(&mut s);
    println!("{}", s); // "hello world"
}
fn add_world(v: &mut String) {
    v.push_str(" world");
}
```

Deux différences : `let mut s` (la valeur doit être déclarée mutable) **et** `&mut s` (on prête mutablement).

→ [[Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership]]

### LA règle qui fait pleurer

À un instant donné, sur une même valeur, tu peux avoir :
- **Plusieurs `&T`** (références immutables) — OK
- **Une seule `&mut T`** (référence mutable) — OK
- **Mais JAMAIS les deux en même temps**

```rust
let mut s = String::from("hello");
let r1 = &s;        // OK, immutable
let r2 = &s;        // OK, deux immutables coexistent
let r3 = &mut s;    // ❌ erreur : il y a déjà des & actifs
println!("{} {} {}", r1, r2, r3);
```

→ [[Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race]]

> **Pourquoi cette règle ?** Parce qu'elle élimine les data races **statiquement**. Si personne ne peut lire pendant qu'on écrit, et personne ne peut écrire pendant qu'on lit, tu n'as plus de race possible. C'est l'idée la plus puissante de Rust.

### Non-Lexical Lifetimes (NLL)

Le compilateur est plus malin qu'il en a l'air :

```rust
let mut s = String::from("hello");
let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2);  // dernière utilisation de r1 et r2

let r3 = &mut s; // ✅ OK ! r1/r2 ne sont plus utilisés après ici
println!("{}", r3);
```

La "vie" d'une référence va de sa création à sa **dernière utilisation**, pas jusqu'à la fin du scope.

---

## 3. Lifetimes — durée de validité

### Le problème qu'elles résolvent

```rust
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

Le compilateur dit : "Je ne sais pas si la `&str` que tu retournes vient de `x` ou `y`. Combien de temps reste-t-elle valide ?" Réponse : on doit **annoter** :

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

`'a` = un lifetime générique. On dit : "x, y et le retour ont **tous le même lifetime**, c'est-à-dire la plus courte de leurs deux durées de vie."

→ [[Concept - Les lifetimes Rust expriment la durée de validité d'une référence]]

### Le truc à savoir : la plupart du temps tu n'écris rien

Le compilateur applique des **règles d'élision** qui couvrent 90% des cas. Tu ne tapes `'a` que quand :
- Une fonction a **plusieurs `&` en entrée** ET retourne une référence dont la provenance est ambiguë
- Une struct **stocke une référence** (rare en pratique — préférer un `String` plutôt qu'un `&str` dans une struct)

```rust
struct Wrapper<'a> {
    inner: &'a str,
}

impl<'a> Wrapper<'a> {
    fn get(&self) -> &str { self.inner }
}
```

Pratiquement : 95% du Rust applicatif n'écrit pas un seul `'a`. Les structs avec lifetimes apparaissent dans les libs (parsers, par exemple).

### `'static` — le lifetime spécial

```rust
let s: &'static str = "hello"; // string literal — valide pour toute la durée du programme
```

`'static` veut dire "vit aussi longtemps que le programme." Les string literals sont `'static`. Beaucoup de débutants pensent qu'il faut tout passer en `'static` pour faire taire le compilateur — c'est presque toujours **un anti-pattern**.

---

## 4. Allouer sur le tas — `Box`, `Rc`, `Arc`

Par défaut, en Rust, **les valeurs vivent sur la pile** (stack). Pour les mettre sur le tas (heap), tu utilises un **smart pointer**.

### `Box<T>` — ownership unique sur le tas

```rust
let b = Box::new(5);    // 5 est alloué sur le tas
println!("{}", *b);     // déréf comme un pointeur classique
// b sort du scope → la mémoire est libérée
```

Cas d'usage typiques :
- **Type récursif** : `enum List { Cons(i32, Box<List>), Nil }` — sans Box, le compilo ne peut pas calculer la taille
- **Trait object** : `Box<dyn Trait>` — pour stocker n'importe quel type qui implémente Trait
- **Gros struct** dont on ne veut pas trimballer la valeur entière

### `Rc<T>` — Reference Counted (mono-thread)

```rust
use std::rc::Rc;

let a = Rc::new(String::from("hello"));
let b = Rc::clone(&a);  // n'allone pas — incrémente juste le compteur
let c = Rc::clone(&a);
println!("count = {}", Rc::strong_count(&a)); // 3
```

`Rc<T>` partage l'ownership entre plusieurs propriétaires. Quand le dernier est drop, la valeur est libérée.

⚠️ **`Rc` n'est PAS thread-safe**. Si tu essaies de l'envoyer entre threads, ça ne compile pas (manque le trait `Send`).

### `Arc<T>` — Atomic Reference Counted (multi-thread)

```rust
use std::sync::Arc;
use std::thread;

let data = Arc::new(vec![1, 2, 3]);
let handles: Vec<_> = (0..4).map(|_| {
    let d = Arc::clone(&data);
    thread::spawn(move || println!("{:?}", d))
}).collect();
for h in handles { h.join().unwrap(); }
```

Identique à `Rc`, mais le compteur est atomique → safe entre threads. Coût : un peu plus lent que `Rc` (atomic ops). Donc on n'utilise `Arc` que **quand on a vraiment besoin de partager entre threads**.

→ [[Concept - Box Rc Arc gèrent l'ownership partagé selon le besoin de threading]]

### La quasi-totalité du tableau

| Tu veux... | Utilise |
|---|---|
| Une valeur sur le tas, un seul propriétaire | `Box<T>` |
| Un type récursif | `Box<T>` (ou Rc/Arc) |
| Un trait object | `Box<dyn Trait>` ou `Arc<dyn Trait>` |
| Plusieurs propriétaires, mono-thread | `Rc<T>` |
| Plusieurs propriétaires, multi-thread | `Arc<T>` |
| Plusieurs propriétaires + mutation (mono) | `Rc<RefCell<T>>` |
| Plusieurs propriétaires + mutation (multi) | `Arc<Mutex<T>>` ou `Arc<RwLock<T>>` |

---

## 5. Patterns idiomatiques

### Préférer `&str` à `&String` en argument

```rust
fn print(s: &str) {} // ← prend les deux : String (via deref) et &str
// fn print(s: &String) {} // ← ne prend que String, pas les literals "..."
```

### Préférer `String` à `&'a str` dans une struct

```rust
// idiomatique
struct User { name: String }

// fragile — propage le lifetime à tous les utilisateurs
struct User<'a> { name: &'a str }
```

### Cloner sans culpabiliser au début

`s.clone()` te coûte une allocation, mais te débloque face au borrow checker. Pour apprendre, **cloner est OK** — l'optimisation viendra après. Beaucoup de devs Rust expérimentés clonent encore dans 80% des cas.

---

## Citations brutes

> *"The Rust compiler is your pair programmer. It refuses to ship code that would crash."* — adage communautaire.

> *"Fighting the borrow checker is just learning to write code that's already correct."* — Jon Gjengset.

---

## À explorer ensuite

- **`RefCell<T>`** : mutabilité intérieure (mut via `&` non-mut), checks au runtime
- **`Cow<T>`** : "clone on write" — éviter d'allouer si pas de modif
- **Pattern matching avancé** : `if let`, `while let`, déstructuration de structs et tuples
- **Iterators** : `iter()`, `into_iter()`, `iter_mut()`, et la chaîne `map().filter().collect()`
- **`?` operator** : propagation d'erreurs, et conversion via `From`
- **Async/await + Tokio** : passer aux topics réseau

## MOC associé

[[MOC - Rust]]
