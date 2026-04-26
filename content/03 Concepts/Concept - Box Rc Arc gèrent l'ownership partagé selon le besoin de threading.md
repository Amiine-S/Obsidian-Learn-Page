---
created: 2026-04-26
domain: rust
level: intermediate
tags:
  - type/concept
  - domain/rust
  - level/intermediate
---

# Concept - Box Rc Arc gèrent l'ownership partagé selon le besoin de threading

## Idée en une phrase

> `Box<T>`, `Rc<T>` et `Arc<T>` sont les **trois smart pointers** principaux de Rust pour allouer sur le tas et/ou partager l'ownership : `Box` = un seul propriétaire, `Rc` = N propriétaires mono-thread, `Arc` = N propriétaires multi-thread — chacun avec un coût et une zone d'usage précis.

## Contexte / pourquoi ça compte

L'ownership unique de Rust est la règle par défaut, et la meilleure dans 80% des cas. Mais beaucoup de structures réalistes ont besoin de **partager** une valeur entre plusieurs entités (graphe d'objets, cache, état partagé entre threads). Au lieu de cacher ça sous un GC, Rust te demande de **choisir explicitement** la stratégie de partage — et chaque choix a des contreparties claires.

C'est aussi un point où l'écosystème JS/TS ne demande aucune réflexion (tout est partagé via le GC), donc le contraste est instructif.

## Détails / mécanisme

### `Box<T>` — ownership unique sur le tas

```rust
let b = Box::new(5_i32);  // alloue sur le tas
println!("{}", *b);       // déréf
// b sort du scope → le i32 sur le tas est libéré
```

**Sémantique** : exactement comme `T`, mais la valeur vit sur le tas. Le `Box` lui-même est sur la pile, et il **possède** la valeur. Pas de partage.

**Cas d'usage** :
- **Type récursif** :
  ```rust
  enum List {
      Cons(i32, Box<List>),  // sans Box, taille indéterminée → ne compile pas
      Nil,
  }
  ```
- **Trait objects** :
  ```rust
  let animals: Vec<Box<dyn Animal>> = vec![Box::new(Dog), Box::new(Cat)];
  ```
- **Gros struct** que tu veux passer sans copier la valeur entière

**Coût** : 1 allocation tas, 1 déréférencement implicite à chaque accès.

### `Rc<T>` — Reference Counted (mono-thread)

```rust
use std::rc::Rc;

let a = Rc::new(String::from("hello"));
let b = Rc::clone(&a);  // ne copie PAS la string — incrémente le compteur
let c = Rc::clone(&a);

println!("count = {}", Rc::strong_count(&a)); // 3
// Quand a, b, c sortent tous du scope → la String est libérée
```

**Sémantique** : la valeur est partagée entre N propriétaires. Chaque `Rc::clone` incrémente le compteur. Le drop décrémente. Quand le compteur tombe à 0, la valeur est libérée.

**Important** : `Rc<T>` ne donne accès qu'à une **lecture immutable** de `T` (`&T`). Pour muter, il faut combiner avec `RefCell<T>` (vérifs de borrow déplacées au runtime) :

```rust
use std::rc::Rc;
use std::cell::RefCell;

let shared = Rc::new(RefCell::new(0));
let s1 = Rc::clone(&shared);
*s1.borrow_mut() += 1; // mutation autorisée via RefCell
```

**Coût** : 1 allocation tas, 1 incrément/décrément de compteur (non-atomique → rapide), pas de mutation directe.

⚠️ **`Rc` n'est PAS thread-safe**. Le type ne l'envoie pas entre threads (manque le trait `Send`). Si tu en as besoin entre threads, utilise `Arc`.

### `Arc<T>` — Atomic Reference Counted (multi-thread)

```rust
use std::sync::Arc;
use std::thread;

let data = Arc::new(vec![1, 2, 3]);
let mut handles = vec![];
for i in 0..4 {
    let d = Arc::clone(&data);
    handles.push(thread::spawn(move || {
        println!("thread {} : {:?}", i, d);
    }));
}
for h in handles { h.join().unwrap(); }
```

**Sémantique** : identique à `Rc`, mais le compteur est **atomique** (CPU instructions atomic). Donc thread-safe.

**Coût** : un peu plus lent que `Rc` à cause des atomic ops (~10-30% en cas de contention forte). Donc on n'utilise `Arc` que **quand on en a vraiment besoin**.

**Pour la mutation partagée multi-thread** : combiner avec `Mutex<T>` ou `RwLock<T>` :

```rust
use std::sync::{Arc, Mutex};

let counter = Arc::new(Mutex::new(0));
let c1 = Arc::clone(&counter);
let h = thread::spawn(move || {
    *c1.lock().unwrap() += 1;
});
h.join().unwrap();
println!("{}", *counter.lock().unwrap());
```

→ Voir [[Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race]] : c'est la même règle, déplacée au runtime via le verrou.

### Tableau de décision

| Tu veux... | Utilise |
|---|---|
| Un seul propriétaire, valeur sur le tas | `Box<T>` |
| Type récursif | `Box<T>` |
| Trait object | `Box<dyn Trait>` ou `Arc<dyn Trait>` |
| Plusieurs propriétaires, mono-thread | `Rc<T>` |
| Plusieurs propriétaires + mutation, mono-thread | `Rc<RefCell<T>>` |
| Plusieurs propriétaires, multi-thread | `Arc<T>` |
| Plusieurs propriétaires + mutation, multi-thread | `Arc<Mutex<T>>` (ou `Arc<RwLock<T>>` si beaucoup de lectures) |

## Exemple concret

Un cache partagé entre threads — l'archétype de `Arc<Mutex<...>>` :

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;

let cache: Arc<Mutex<HashMap<String, String>>> = Arc::new(Mutex::new(HashMap::new()));

let mut handles = vec![];
for i in 0..4 {
    let c = Arc::clone(&cache);
    handles.push(thread::spawn(move || {
        let mut map = c.lock().unwrap();
        map.insert(format!("key{}", i), format!("value{}", i));
    }));
}
for h in handles { h.join().unwrap(); }

println!("{:?}", cache.lock().unwrap());
```

À comparer avec un `Map` partagé en TS : tu n'écris pas de verrou, mais en Node ce n'est pas un problème (mono-thread), et en JS multi-thread (Web Workers) c'est carrément interdit (pas de mémoire partagée sans `SharedArrayBuffer`).

### Le piège classique : les cycles

`Rc` (et `Arc`) ne libèrent pas les cycles : `A → B → A` reste à compteur 1 chacun, fuite mémoire. Solution : `Weak<T>` (référence "faible" qui n'incrémente pas le compteur). C'est typiquement le cas dans une struct parent ↔ enfant.

## Connexions

**Concepts liés** :
- [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]]
- [[Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race]]
- [[Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership]]

**Prérequis** :
- Ownership et drop
- Les bases de l'API thread (`thread::spawn`)

**S'oppose à / à comparer avec** :
- **GC** (Java/JS/Go) : tout est partagé implicitement, le GC trace les cycles, coût en pauses
- **shared_ptr C++** : équivalent direct de `Arc`, mais sans la garantie d'absence de data race
- **Erlang processes** : autre approche — pas de mémoire partagée, communication par messages

## Sources

- [[2026-04-26 - Rust - borrowing références et lifetimes en pratique]]

## MOC

[[MOC - Rust]]
