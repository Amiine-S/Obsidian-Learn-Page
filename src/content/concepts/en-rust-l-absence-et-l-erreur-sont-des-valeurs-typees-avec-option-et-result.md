---
created: 2026-04-25T00:00:00.000Z
domain: rust
level: beginner
tags:
  - type/concept
  - domain/rust
  - level/beginner
title: >-
  Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et
  Result
slug: en-rust-l-absence-et-l-erreur-sont-des-valeurs-typees-avec-option-et-result
excerpt: 'Deux des plus grosses sources de bugs dans le code TS/JS :'
oneLiner: >-
  Rust n'a **ni `null` ni exceptions** : l'absence d'une valeur s'exprime via
  `Option<T>`, l'erreur via `Result<T, E>`, et le compilateur **t'oblige** à
  gérer les deux cas.
related:
  - rust-vise-securite-memoire-performance-et-concurrence-simultanement
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - rust
backlinks:
  - 2026-04-25-introduction-a-rust-pour-un-dev-typescript
  - >-
    le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - rust
topics:
  - rust
---
## Idée en une phrase

> Rust n'a **ni `null` ni exceptions** : l'absence d'une valeur s'exprime via `Option<T>`, l'erreur via `Result<T, E>`, et le compilateur **t'oblige** à gérer les deux cas.

## Contexte / pourquoi ça compte

Deux des plus grosses sources de bugs dans le code TS/JS :

1. **`null` / `undefined`** : la "billion dollar mistake" de Tony Hoare. `strictNullChecks` aide mais ne couvre pas tout (cast, JSON parsé, libs externes…).
2. **Les exceptions invisibles** : en TS, une fonction peut throw n'importe quoi sans que ça apparaisse dans sa signature. Tu apprends qu'une lib throw quand ça pète en prod.

Rust règle les deux problèmes en faisant de l'absence et de l'erreur des **valeurs ordinaires**, exprimées dans le type de retour.

## Détails / mécanisme

**`Option<T>`** = "soit une valeur de type `T`, soit rien" :
```rust
enum Option<T> {
    Some(T),
    None,
}
```

**`Result<T, E>`** = "soit un succès `T`, soit une erreur `E`" :
```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Le compilateur **refuse** que tu utilises directement la valeur sans gérer les deux cas. Trois façons de la gérer :

1. **`match` exhaustif** — le compilateur vérifie que tous les cas sont couverts :
```rust
match find_user(id) {
    Some(user) => println!("Trouvé : {}", user.name),
    None => println!("Pas trouvé"),
}
```

2. **L'opérateur `?`** — propage l'erreur ou l'absence à l'appelant (équivalent grosso modo à `await` mais pour les `Result`/`Option`) :
```rust
fn read_config() -> Result<Config, io::Error> {
    let content = std::fs::read_to_string("config.toml")?;  // si Err, retourne Err
    let config = parse(&content)?;
    Ok(config)
}
```

3. **Méthodes utilitaires** : `.unwrap()` (panic si `None`/`Err`, à éviter en prod), `.unwrap_or(default)`, `.map(...)`, `.and_then(...)` (équivalent du flatMap monadique).

## Exemple concret

**TypeScript** :
```typescript
function findUser(id: string): User | null {
  // ... peut aussi throw si la DB plante
}

const user = findUser("42");
console.log(user.name);  // 💥 si user est null
```

**Rust** :
```rust
fn find_user(id: &str) -> Result<Option<User>, DbError> {
    // ...
}

let user = find_user("42")?;  // Err → propage à l'appelant
match user {
    Some(u) => println!("{}", u.name),
    None => println!("user not found"),
}
// Impossible d'oublier un cas : ça ne compile pas.
```

La signature `Result<Option<User>, DbError>` te dit **tout** : ça peut planter (DB), ça peut ne rien trouver, ou ça peut renvoyer un user. Trois cas, trois branches forcées.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/rust-vise-securite-memoire-performance-et-concurrence-simultanement" data-wiki-title="Concept - Rust vise sécurité mémoire performance et concurrence simultanément" data-wiki-preview="Rust est conçu pour offrir **les trois en même temps** — sécurité mémoire, performance native, concurrence sans data races — là où les langages précédents en abandonnaient toujours au moins un.">Concept - Rust vise sécurité mémoire performance et concurrence simultanément</a> *(la sécurité passe aussi par éliminer les NPE et exceptions silencieuses)*
- *(à venir : pattern matching, l'opérateur `?`, `thiserror`/`anyhow`)*

**Prérequis** :
- *(aucun)*

**S'oppose à / à comparer avec** :
- **`null` + exceptions** (Java, JS, Python, C#) : implicite, non typé dans la signature
- **TypeScript `strictNullChecks`** : même intention, mais limité par le système de types optionnel et les exceptions JS qui restent non typées
- **Either/Maybe en FP** (Haskell, fp-ts) : exactement le même concept, Rust l'a rendu mainstream

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-introduction-a-rust-pour-un-dev-typescript" data-wiki-title="Introduction à Rust pour un dev TypeScript" data-wiki-preview="1. Rust est un **langage système** créé chez Mozilla (2010, 1.0 en 2015), maintenant porté par la Rust Foundation. 2. Son objectif : offrir **les performances de C/C++ + la sécurité mémoire + la concurrence sans data races**, simultanément.…">Introduction à Rust pour un dev TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/rust" data-wiki-title="MOC - Rust" data-wiki-preview="- Concept - Rust vise sécurité mémoire performance et concurrence simultanément">MOC - Rust</a>

