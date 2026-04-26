---
created: 2026-04-26
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
---

# Concept - Une seule référence mutable ou plusieurs immutables règle anti-data-race

## Idée en une phrase

> À tout instant, sur une même valeur, le borrow checker n'autorise **qu'une seule référence mutable** (`&mut T`) **OU** **plusieurs références immutables** (`&T`) — jamais les deux à la fois — règle qui élimine les data races par construction, à la compilation.

## Contexte / pourquoi ça compte

C'est le théorème central du borrow checker, parfois appelé **"aliasing XOR mutability"**. Il sous-tend la promesse principale de Rust : **safe concurrency without garbage collection**. Sans cette règle, tu n'aurais ni "pas de use-after-free" (parce qu'un alias survivrait au propriétaire), ni "pas de data race" (parce qu'un thread écrirait pendant qu'un autre lit).

Comprendre cette règle, c'est comprendre **pourquoi** le borrow checker rejette tant de programmes qui "marchent" en C/Java/TS : parce que ces programmes contiennent des bugs latents que Rust refuse d'accepter.

## Détails / mécanisme

### La règle, formellement

À un point donné de l'exécution, sur une valeur `v` :
- Soit **0 ou plusieurs `&v`** (immutables) **ET 0 `&mut v`**
- Soit **1 `&mut v`** **ET 0 `&v`**

Jamais le mix.

### Exemples concrets

```rust
let mut s = String::from("hello");

// CAS 1 — multiples lectures : OK
let r1 = &s;
let r2 = &s;
let r3 = &s;
println!("{} {} {}", r1, r2, r3); // ✅

// CAS 2 — une seule mut : OK
let m = &mut s;
m.push_str("!"); // ✅

// CAS 3 — mut pendant des immutables : ❌
let r1 = &s;
let m = &mut s;     // ❌ erreur : `s` already borrowed as immutable
println!("{}", r1);

// CAS 4 — deux mut : ❌
let m1 = &mut s;
let m2 = &mut s;     // ❌ erreur : second mutable borrow
m1.push_str("a");
```

### Pourquoi exactement cette règle ?

**Garantie 1 — pas de data race** : si deux threads voulaient écrire en même temps, il faudrait deux `&mut`. Impossible.

**Garantie 2 — pas d'invalidation cachée** :

```rust
let mut v = vec![1, 2, 3];
let first = &v[0];   // emprunt immutable
v.push(4);           // ❌ : nécessite un &mut, conflit
println!("{}", first);
```

Le `push(4)` peut **réallouer** le vecteur (si la capacité est dépassée). Du coup `&v[0]` pointerait vers une mémoire désallouée. Le borrow checker bloque cette catégorie entière de bugs.

**Garantie 3 — raisonnement local** : si tu vois une fonction `fn f(x: &T) { ... }`, tu sais que **personne** ne peut muter `x` pendant son exécution. Tu peux raisonner sur `f` sans regarder le reste du programme.

### Non-Lexical Lifetimes (NLL)

Le compilateur Rust est plus subtil qu'il en a l'air :

```rust
let mut s = String::from("hello");
let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2); // ← dernière utilisation de r1, r2

let m = &mut s;            // ✅ OK, plus de & actifs
m.push_str("!");
```

La "durée de vie" d'une référence va de sa création à sa **dernière utilisation effective** — pas jusqu'à la fin du scope textuel.

### L'échappatoire : `RefCell<T>` et `Mutex<T>`

Quand cette règle est trop restrictive (graphes, observers, structures partagées), Rust fournit des **vérifications déplacées au runtime** :

- **`RefCell<T>`** : checks de borrow rules au runtime, mono-thread
- **`Mutex<T>` / `RwLock<T>`** : verrouillage explicit, multi-thread

Mais c'est un opt-in. La règle de base reste vérifiée à la compilation.

## Exemple concret

Le bug classique en Java/C# que Rust refuse :

```java
// Java — modification pendant l'itération
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
for (Integer x : list) {
    if (x == 2) list.remove(x); // ConcurrentModificationException au runtime
}
```

```rust
// Rust — refusé à la compilation
let mut v = vec![1, 2, 3];
for x in &v {              // emprunt immutable de v
    if *x == 2 {
        v.remove(0);       // ❌ tentative d'emprunt mutable pendant un immutable
    }
}
```

Java te le dit au runtime, en prod, sous forme d'exception. Rust te le dit dès la compilation. **Le bug ne pourra jamais shipper.**

## Connexions

**Concepts liés** :
- [[Concept - Le borrowing Rust permet d'accéder à une valeur sans en prendre l'ownership]]
- [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]]
- [[Concept - Rust vise sécurité mémoire performance et concurrence simultanément]]

**Prérequis** :
- Le mécanisme de borrowing (`&` vs `&mut`)

**S'oppose à / à comparer avec** :
- **`synchronized` Java** : verrou runtime, opt-in et oubliable
- **Mutex C/C++** : pareil, oubli = data race silencieuse
- **GC + immutable data structures (Erlang, Clojure)** : autre solution au même problème — interdire la mutation, plutôt que la contraindre

## Sources

- [[2026-04-26 - Rust - borrowing références et lifetimes en pratique]]

## MOC

[[MOC - Rust]]
