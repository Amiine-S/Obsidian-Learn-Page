---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - try/catch impose un narrow manuel et ne documente rien dans la
  signature
slug: try-catch-impose-un-narrow-manuel-et-ne-documente-rien-dans-la-signature
excerpt: >-
  C'est la double faiblesse de `try/catch` en TS, héritée de JavaScript : pas de
  checked exceptions (comme Java), pas d'erreurs dans la signature (comme Rust
  ou Effect-TS). Tu peux écrire un code qui compile parfaitement et qui crashera
  en prod sur un cas d'erreur que rien n'a docu
oneLiner: >-
  En TypeScript, `catch (err)` reçoit l'erreur typée `unknown` (avec
  `useUnknownInCatchVariables`) — il faut **narrower manuellement** avant de
  l'utiliser, et la signature de la fonction qui throw **ne mentionne rien** :
  le caller ne sait pas qu'il doit catch.
related:
  - >-
    custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
  - >-
    le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - 2026-04-26-exception-handling-patterns-en-typescript
  - backend-infra
backlinks:
  - typescript-sacrifie-le-soundness-pour-la-praticite
topics:
  - backend
---
## Idée en une phrase

> En TypeScript, `catch (err)` reçoit l'erreur typée `unknown` (avec `useUnknownInCatchVariables`) — il faut **narrower manuellement** avant de l'utiliser, et la signature de la fonction qui throw **ne mentionne rien** : le caller ne sait pas qu'il doit catch.

## Contexte / pourquoi ça compte

C'est la double faiblesse de `try/catch` en TS, héritée de JavaScript : pas de checked exceptions (comme Java), pas d'erreurs dans la signature (comme Rust ou Effect-TS). Tu peux écrire un code qui compile parfaitement et qui crashera en prod sur un cas d'erreur que rien n'a documenté.

Comprendre cette limite te pousse à :
- Soit utiliser des **Custom Exceptions** + middleware centralized (pour avoir au moins une discrimination claire)
- Soit migrer vers **Result / Effect** (pour avoir l'erreur dans le type)

## Détails / mécanisme

### Le narrow manuel

```typescript
try {
  await fetch('/api/x')
} catch (err) {
  // err: unknown — pas Error !
  console.log(err.message) // ❌ TS: 'err' is of type 'unknown'

  if (err instanceof Error) {
    console.log(err.message) // ✓ narrow OK
  } else if (typeof err === 'string') {
    console.log(err) // JS peut throw n'importe quoi : un string, un objet
  }
}
```

C'est **volontaire** : avant `useUnknownInCatchVariables` (TS 4.4, 2021), `err` était typé `any` et tout passait. Maintenant tu dois prouver à TS que c'est une `Error` avant d'accéder à `.message` ou `.stack`.

Pattern usuel :

```typescript
function asError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e))
}

try { /* ... */ } catch (e) {
  logger.error(asError(e).message)
}
```

### L'absence de documentation

```typescript
function getUser(id: string): User {
  const u = db.findUser(id)
  if (!u) throw new Error('not found')
  return u
}

// Caller
const u = getUser('abc') // RIEN ne dit que ça peut throw
```

Comparons avec Rust :
```rust
fn get_user(id: &str) -> Result<User, UserError> { /* ... */ }
// le caller DOIT gérer le Result, le compilateur le force
```

Ou Effect-TS :
```typescript
const getUser = (id: string): Effect.Effect<User, UserNotFound | DbError> => /* ... */
//                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ erreurs dans le type
```

En TS pur, **rien** ne te force à savoir que `getUser` peut throw. C'est documentation par convention (JSDoc `@throws`), pas par compilation.

### Conséquence pratique

Sur un projet de taille moyenne (>50 fichiers), tu ne peux pas raisonner localement. Pour savoir ce qu'une fonction peut faire échouer, tu dois lire son corps **et** le corps de toutes ses dépendances. À l'arrivée :
- Soit tu mets `try/catch` partout par sécurité (verbose, ralentit, masque les vrais bugs)
- Soit tu n'en mets pas et les erreurs remontent jusqu'à un middleware global (crash propre mais perte de contexte)

C'est pourquoi le pattern **Custom Exception + Centralized handler** est pragmatique : on ne tente pas de tout typer, mais on a au moins une discrimination claire au point de catch.

## Exemple concret

Bug réel observé :

```typescript
async function syncUser(id: string) {
  const u = await getUser(id) // can throw UserNotFound
  await saveToCache(u)         // can throw CacheError
  await notifySlack(u)         // can throw NetworkError
}

// caller
try {
  await syncUser('abc')
} catch (e) {
  console.error('sync failed', e) // perd le contexte : laquelle des 3 a échoué ?
}
```

Avec Result / Effect, tu sais exactement quelle étape a échoué via le tag de l'erreur :

```typescript
const result = await syncUser('abc') // Effect<void, UserNotFound | CacheError | NetworkError>
// au point d'erreur, TS connaît les 3 cas et te force à les gérer
```

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee" data-wiki-title="Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée" data-wiki-preview="Sous-classer `Error` en classes nommées (`UserNotFoundError`, `ForbiddenError`, `RateLimitError`) avec un **tag discriminant** permet de **catcher de façon typée** au point de gestion (via `instanceof` ou switch sur tag) et de mapper propre…">Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée</a>
- <span class="wikilink-broken" title="Référence non trouvée : Concept - Le centralized handling concentre la traduction erreur → transport en un seul endroit">Concept - Le centralized handling concentre la traduction erreur → transport en un seul endroit</span>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion" data-wiki-title="Concept - Le pattern Result encode l'erreur dans le type de retour pour forcer la gestion" data-wiki-preview="Le pattern **Result** (ou **Either**, ou **Try**) consiste à modéliser une fonction &quot;qui peut échouer&quot; non pas via `throw`, mais via un **type de retour union** — `Result&lt;T, E&gt; = { ok: true; value: T } | { ok: false; error: E }` — ce qui fo…">Concept - Le pattern Result encode l'erreur dans le type de retour pour forcer la gestion</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a>

**Prérequis** :
- Bases de try/catch JS

**S'oppose à / à comparer avec** :
- **Checked exceptions Java** : forcent la signature mais haïes pour leur viralité
- **Result Rust** : encode dans le type, opérateur `?` pour propager
- **Go pattern `if err != nil`** : retour multiple, mais boilerplate

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-exception-handling-patterns-en-typescript" data-wiki-title="Exception Handling Patterns en TypeScript" data-wiki-preview="1. **try/catch** — la base. Bien, mais coûte cher en lisibilité quand on l'imbrique, et n'apporte rien dans le typage. 2. **Validate first** (early return / guard clauses) — vérifier les invariants au début de la fonction et retourner tôt.…">Exception Handling Patterns en TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

