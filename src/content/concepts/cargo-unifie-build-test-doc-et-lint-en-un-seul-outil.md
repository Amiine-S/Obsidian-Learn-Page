---
created: 2026-04-25T00:00:00.000Z
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
title: Concept - Cargo unifie build test doc et lint en un seul outil
slug: cargo-unifie-build-test-doc-et-lint-en-un-seul-outil
excerpt: >-
  Quand tu démarres un projet Node, tu choisis : npm ou pnpm ou yarn ? jest ou
  vitest ? webpack, vite, esbuild, ou turbopack ? eslint config airbnb ou
  standard ? prettier ? lint-staged ? husky ? Décisions **avant d'écrire une
  ligne**.
oneLiner: >-
  Là où l'écosystème JS empile `npm` + `tsc` + `vite` + `vitest` + `eslint` +
  `prettier` + `typedoc`, Rust met **tout** dans `cargo` — un seul outil
  officiel, intégré, cohérent.
related:
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - rust
backlinks:
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - rust
topics:
  - rust
---

# Concept - Cargo unifie build test doc et lint en un seul outil

## Idée en une phrase

> Là où l'écosystème JS empile `npm` + `tsc` + `vite` + `vitest` + `eslint` + `prettier` + `typedoc`, Rust met **tout** dans `cargo` — un seul outil officiel, intégré, cohérent.

## Contexte / pourquoi ça compte

Quand tu démarres un projet Node, tu choisis : npm ou pnpm ou yarn ? jest ou vitest ? webpack, vite, esbuild, ou turbopack ? eslint config airbnb ou standard ? prettier ? lint-staged ? husky ? Décisions **avant d'écrire une ligne**.

En Rust, tu fais `cargo new mon-projet` et tu as **immédiatement** : un build system, un gestionnaire de dépendances, un lanceur de tests, un générateur de doc, un publisher. Tout cohérent, tout standard, tout maintenu par l'équipe core.

C'est l'un des plus gros points de bonheur quand on vient de l'écosystème JS.

## Détails / mécanisme

**`Cargo.toml` = `package.json`**, mais en mieux structuré (TOML > JSON pour la config humaine) :

```toml
[package]
name = "mon-projet"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
criterion = "0.5"
```

**Les commandes essentielles** :

| Commande | Équivalent JS |
|---|---|
| `cargo new <nom>` | `npm init` + scaffolding |
| `cargo build` | `tsc` + bundler |
| `cargo run` | `tsx index.ts` ou `node dist/index.js` |
| `cargo test` | `vitest` ou `jest` (mais **intégré au compilateur**) |
| `cargo check` | `tsc --noEmit` (vérif sans build) |
| `cargo doc --open` | `typedoc` + ouvre dans le navigateur |
| `cargo fmt` | `prettier --write .` |
| `cargo clippy` | `eslint .` mais 10× plus malin |
| `cargo publish` | `npm publish` |
| `cargo add <crate>` | `npm install <pkg>` |

**Particularités appréciables** :
- **Pas de `node_modules`** : les dépendances sont dans `~/.cargo/registry/`, partagées entre projets, mises en cache. Pas de duplication.
- **`Cargo.lock` est canonique** : équivalent de `package-lock.json`, mais sans débat (toujours commit pour les apps).
- **Tests dans le même fichier** que le code (module `#[cfg(test)] mod tests`), pas de fichier `.test.ts` séparé sauf pour les tests d'intégration.
- **Doc à partir des commentaires `///`**, exécutables (les exemples dans la doc sont testés par `cargo test`).

## Exemple concret

**Workflow JS typique pour démarrer une lib** :
```bash
mkdir ma-lib && cd ma-lib
npm init -y
npm install -D typescript vitest eslint prettier @types/node
# créer tsconfig.json
# créer .eslintrc.js
# créer .prettierrc
# configurer scripts dans package.json
# choisir un bundler (tsup ? vite ?)
```

**Workflow Rust** :
```bash
cargo new ma-lib --lib
cd ma-lib
# fini.
```

Tu peux taper `cargo test`, `cargo doc`, `cargo clippy` immédiatement — tout marche.

## Connexions

**Concepts liés** :
- *(à venir : crates.io, workspaces Cargo, features flags, build scripts)*

**Prérequis** :
- *(aucun, c'est outillage)*

**S'oppose à / à comparer avec** :
- **Écosystème npm** : flexibilité maximale, fragmentation maximale
- **Go modules** : intégration similaire (`go build`, `go test`, `go doc`), un peu plus minimaliste
- **Maven/Gradle** (Java) : intégré aussi, mais bien plus verbeux

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-introduction-a-rust-pour-un-dev-typescript" data-wiki-title="Introduction à Rust pour un dev TypeScript" data-wiki-preview="1. Rust est un **langage système** créé chez Mozilla (2010, 1.0 en 2015), maintenant porté par la Rust Foundation. 2. Son objectif : offrir **les performances de C/C++ + la sécurité mémoire + la concurrence sans data races**, simultanément.…">Introduction à Rust pour un dev TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/rust" data-wiki-title="MOC - Rust" data-wiki-preview="- Concept - Rust vise sécurité mémoire performance et concurrence simultanément">MOC - Rust</a>

