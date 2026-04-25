---
title: Introduction à Rust pour un dev TypeScript
url: 
author: Claude (synthèse)
published: 
digested: 2026-04-25
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

# Introduction à Rust pour un dev TypeScript

## Pourquoi cette source

> Première prise de contact avec Rust. Objectif : comprendre **pourquoi Rust existe**, **ce qu'il vise**, et **ce qui le rend différent de TypeScript** — avant d'écrire la moindre ligne.

## Résumé en 5 lignes

1. Rust est un **langage système** créé chez Mozilla (2010, 1.0 en 2015), maintenant porté par la Rust Foundation.
2. Son objectif : offrir **les performances de C/C++ + la sécurité mémoire + la concurrence sans data races**, simultanément.
3. Sa grande idée : un **système d'ownership** vérifié à la compilation qui supprime le besoin d'un garbage collector ET du malloc/free manuel.
4. Il pousse une philosophie "**zero-cost abstractions**" : le code haut-niveau (génériques, traits, async) compile vers du code aussi efficace que si tu l'avais écrit en C.
5. Pour un dev TS, le choc principal n'est pas la syntaxe — c'est la **gestion mémoire explicite** et le **type system bien plus strict** (pas de `null`, pas d'exceptions, pattern matching exhaustif).

---

## 1. Présentation : c'est quoi Rust ?

**Rust est un langage compilé, statiquement typé, à performance native** — comme C, C++, Go ou Zig. Mais il se distingue par sa façon d'éviter les bugs.

| | TypeScript | Rust |
|---|---|---|
| Exécution | Transpile en JS, tourne sur V8/Node (interprété + JIT) | Compile en **binaire natif** (machine code) |
| Gestion mémoire | Garbage collector V8 (automatique, runtime) | **Ownership** (vérifié à la compilation, pas de GC) |
| Typage | Optionnel, vérifié à la compil mais effacé à l'exécution | Obligatoire, fort, présent à l'exécution (mais sans coût) |
| Runtime | Node.js / navigateur | Aucun runtime managé — un binaire autonome |
| Cas d'usage typique | Web app, API, scripts | OS, CLI, moteurs de jeu, embedded, WASM, **et de plus en plus du backend perf-sensitive** |

**Ce qu'on fait avec Rust en pratique** :
- CLIs ultra-rapides (`ripgrep`, `fd`, `bat`, `eza`)
- Outils dev (compilateurs, bundlers — **Turbopack, Rolldown, Biome, esbuild's successor `oxc`** sont en Rust)
- Backends haute perf (Discord, Cloudflare, Figma côté serveur)
- Embarqué / OS / drivers (Linux kernel accepte Rust depuis 2022)
- WebAssembly (compilation cible idéale)
- Moteurs de bases de données (TiKV, Materialize)

> Note pour toi : **les outils JS modernes sont massivement réécrits en Rust** parce que Node + TS atteignent leurs limites de perf sur les pipelines de build. C'est probablement le premier endroit où tu croiseras Rust en production.

---

## 2. Objectifs : le trilemme que Rust prétend résoudre

Pendant 50 ans, les langages ont fait des compromis sur trois axes : **sécurité mémoire**, **performance native**, **concurrence sans data races**. Aucun ne réussissait les trois.

→ Voir le concept détaillé : [[Concept - Rust vise sécurité mémoire performance et concurrence simultanément]]

**Résumé** : C/C++ ont la perf mais pas la sécurité. Java/Go/C# ont la sécurité grâce au GC mais paient en pause/latence. JS/Python sont sûrs mais lents et mal armés pour la concurrence. Rust prétend offrir les trois en déplaçant les vérifications du runtime vers le compilateur.

---

## 3. Particularités : 4 ruptures par rapport à TypeScript

### 3.1 — Ownership : pas de GC, pas de `malloc`/`free`

→ [[Concept - L'ownership de Rust remplace garbage collector et malloc-free]]

En TS tu n'y penses jamais : V8 alloue, V8 libère. En Rust, **chaque valeur a un seul propriétaire**, et la mémoire est libérée automatiquement quand le propriétaire sort du scope. Le tout vérifié **à la compilation** — si tu te trompes, ça ne compile pas. C'est ce qu'on appelle le "**borrow checker**", et c'est l'idée la plus originale de Rust.

### 3.2 — Pas de `null`, pas d'exceptions : tout est typé

→ [[Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result]]

En TS, `User | null` est partout, et les exceptions JS ne sont **pas dans la signature de fonction**. En Rust :
- L'absence d'une valeur s'exprime via `Option<T>` (`Some(T)` ou `None`)
- L'erreur s'exprime via `Result<T, E>` (`Ok(T)` ou `Err(E)`)
- Le compilateur **t'oblige** à gérer les deux cas via `match` ou l'opérateur `?`

C'est l'équivalent strict de ce que `strictNullChecks` aimerait être en TS, en plus puissant.

### 3.3 — Traits + génériques : polymorphisme à coût zéro

→ [[Concept - Les traits Rust offrent du polymorphisme à coût zéro grâce au dispatch statique]]

Les `trait` Rust ressemblent aux `interface` TS, mais avec deux différences clés :
- Tu peux **implémenter un trait pour un type que tu n'as pas écrit** (ex : ajouter une méthode à `String`)
- Le dispatch est **statique par défaut** (monomorphisation à la compil) — un appel de méthode sur un générique compile en code aussi rapide qu'un appel direct. Pas de vtable, pas d'overhead.

C'est ce qu'on appelle "**zero-cost abstractions**" : les abstractions ne te coûtent rien à l'exécution.

### 3.4 — Cargo : un seul outil pour tout

→ [[Concept - Cargo unifie build test doc et lint en un seul outil]]

Côté JS tu as `npm` + `tsc` + `vite`/`webpack` + `vitest`/`jest` + `eslint` + `prettier` + `typedoc`. Côté Rust : **`cargo`**, qui fait tout, intégré et cohérent. C'est l'un des plus gros points de bonheur quand on vient de l'écosystème JS.

---

## Citations brutes

> "Rust empowers everyone to build reliable and efficient software." — slogan officiel de [rust-lang.org](https://www.rust-lang.org/)

> "A language empowering everyone to build reliable and efficient software." — tagline historique, met l'accent sur "reliable" (fiable) avant "efficient" (performant). L'ordre est important : la sécurité passe avant la perf dans la philosophie Rust.

---

## À explorer ensuite

- **Hello World concret** : installer la toolchain (`rustup`), `cargo new hello`, comprendre `Cargo.toml` vs `package.json`
- **Variables et mutabilité** : `let` vs `let mut`, immutable par défaut (philosophie opposée à JS)
- **Le borrow checker en action** : premier conflit avec les règles d'ownership (le moment "AHA" ou "AARGH" classique)
- **Types primitifs et collections** : `String` vs `&str`, `Vec<T>`, `HashMap<K, V>`
- **Pattern matching** : `match` exhaustif, l'équivalent puissant de `switch`/discriminated unions TS

## MOC associé

[[MOC - Rust]]
