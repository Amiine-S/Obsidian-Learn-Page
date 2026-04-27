---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - Le pattern Result encode l'erreur dans le type de retour pour forcer
  la gestion
slug: >-
  le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion
excerpt: >-
  C'est l'idée centrale de Rust (`Result<T, E>`), Haskell (`Either`), Effect-TS
  (`Effect<A, E, R>`), et de bibliothèques TS comme `neverthrow` ou
  `ts-results`. Elle adresse la faiblesse principale des exceptions JS/TS :
  **les erreurs ne sont pas dans la signature**.
oneLiner: >-
  Le pattern **Result** (ou **Either**, ou **Try**) consiste à modéliser une
  fonction "qui peut échouer" non pas via `throw`, mais via un **type de retour
  union** — `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` —
  ce qui force le caller à discriminer le cas d'erreur **à la compilation** au
  lieu de l'oublier silencieusement.
related:
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - en-rust-l-absence-et-l-erreur-sont-des-valeurs-typees-avec-option-et-result
  - 2026-04-26-exception-handling-patterns-en-typescript
  - backend-infra
backlinks:
  - 2026-04-26-exception-handling-patterns-en-typescript
  - try-catch-impose-un-narrow-manuel-et-ne-documente-rien-dans-la-signature
  - typescript-sacrifie-le-soundness-pour-la-praticite
topics:
  - backend
---
## Idée en une phrase

> Le pattern **Result** (ou **Either**, ou **Try**) consiste à modéliser une fonction "qui peut échouer" non pas via `throw`, mais via un **type de retour union** — `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` — ce qui force le caller à discriminer le cas d'erreur **à la compilation** au lieu de l'oublier silencieusement.

## Contexte / pourquoi ça compte

C'est l'idée centrale de Rust (`Result<T, E>`), Haskell (`Either`), Effect-TS (`Effect<A, E, R>`), et de bibliothèques TS comme `neverthrow` ou `ts-results`. Elle adresse la faiblesse principale des exceptions JS/TS : **les erreurs ne sont pas dans la signature**.

Avec Result, la signature `function getUser(id: string): Result<User, 'NotFound' | 'DbError'>` te dit explicitement :
- Cette fonction retourne **soit** un User, **soit** une de ces erreurs nommées
- Tu **ne peux pas** ignorer le cas d'erreur sans que TypeScript te le signale

## Détails / mécanisme

### Le type minimal

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
const err = <E>(error: E): Result<never, E> => ({ ok: false, error })
```

### Usage

```typescript
function divide(a: number, b: number): Result<number, 'DivByZero'> {
  if (b === 0) return err('DivByZero')
  return ok(a / b)
}

const r = divide(10, 0)
// r est typé Result<number, 'DivByZero'>

// TS te force à discriminer
if (r.ok) {
  console.log(r.value) // typé number
} else {
  console.log(r.error) // typé 'DivByZero'
}

// Si tu accèdes directement r.value sans check, TS refuse :
// r.value // ❌ Property 'value' does not exist on type 'Result<...>'
```

### Combinateurs (lib type `neverthrow`)

```typescript
import { ok, err, Result } from 'neverthrow'

const result: Result<User, 'NotFound'> = await getUser(id)

const enriched = result
  .map(user => ({ ...user, displayName: user.name.toUpperCase() })) // T → T'
  .andThen(user => verifyEmail(user)) // chain another Result-returning fn
  .mapErr(e => `User error: ${e}`) // E → E'

if (enriched.isOk()) {
  console.log(enriched.value)
}
```

### Pattern asynchrone

```typescript
async function getUser(id: string): Promise<Result<User, 'NotFound' | 'DbError'>> {
  try {
    const u = await db.findUser(id)
    if (!u) return err('NotFound')
    return ok(u)
  } catch {
    return err('DbError')
  }
}
```

Note : on garde un `try/catch` au point d'I/O (parce que la lib DB throw), mais on l'**encapsule** en Result. Le caller n'a plus à try/catch.

### Différence avec exceptions

```typescript
// Exceptions
function getUserOrThrow(id: string): User {
  /* peut throw, signature ne dit rien */
}
const u = getUserOrThrow('abc') // peut crasher silencieusement

// Result
function getUser(id: string): Result<User, 'NotFound'> {
  /* signature complète */
}
const r = getUser('abc')
// TS force la discrimination
```

L'erreur **fait partie du contrat**. Tu ne peux pas l'ignorer accidentellement.

### Variantes

| Lib / approche | Forme |
|---|---|
| Inline | `{ ok: true, value } \| { ok: false, error }` |
| **`neverthrow`** | `Ok<T, E> \| Err<T, E>` avec méthodes |
| **`ts-results-es`** | `Ok<T> \| Err<E>` |
| Tuple Go-style | `[T, null] \| [null, E]` |
| **Effect-TS** | `Effect<A, E, R>` (étend Result avec deps + cancellation) |

### Quand l'utiliser

✅ **Bon usage** :
- Bibliothèques pures (parsers, validators, calcul) — pas d'I/O
- Erreurs domain attendues : "user not found", "validation failed"
- Code que tu veux garder testable sans mocks d'exceptions

❌ **Mauvais usage** :
- Bugs / programming errors (null dereference inattendu) — laisse les exceptions crasher
- Frontière I/O directe (DB, HTTP) — tu auras besoin de try/catch quand même
- Code app entier en TS pur où les libs externes throw — tu vas exploser en boilerplate

C'est pour ça que les utilisateurs de Result en TS finissent par adopter **Effect-TS**, qui résout le problème de composition.

## Exemple concret

Validation typée Zod-style avec Result :

```typescript
type ValidationError = { field: string; message: string }

function parseAge(input: unknown): Result<number, ValidationError> {
  if (typeof input !== 'number') return err({ field: 'age', message: 'Not a number' })
  if (input < 0 || input > 150) return err({ field: 'age', message: 'Out of range' })
  return ok(input)
}

function parseEmail(input: unknown): Result<string, ValidationError> {
  if (typeof input !== 'string') return err({ field: 'email', message: 'Not a string' })
  if (!input.includes('@')) return err({ field: 'email', message: 'Invalid format' })
  return ok(input)
}

function parseUser(input: any): Result<User, ValidationError[]> {
  const age = parseAge(input.age)
  const email = parseEmail(input.email)
  
  if (!age.ok || !email.ok) {
    const errors: ValidationError[] = []
    if (!age.ok) errors.push(age.error)
    if (!email.ok) errors.push(email.error)
    return err(errors)
  }
  
  return ok({ age: age.value, email: email.value })
}

// caller
const r = parseUser(req.body)
if (!r.ok) return res.status(422).json({ errors: r.error })
const user = r.value // typé User
```

Pas un seul try/catch. Erreurs typées. Caller forcé à gérer.

## Connexions

**Concepts liés** :
- <span class="wikilink-broken" title="Référence non trouvée : Concept - try/catch impose un narrow manuel et ne documente rien dans la signature">Concept - try/catch impose un narrow manuel et ne documente rien dans la signature</span>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(la version Effect-TS du pattern, plus puissante)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/en-rust-l-absence-et-l-erreur-sont-des-valeurs-typees-avec-option-et-result" data-wiki-title="Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result" data-wiki-preview="Rust n'a **ni `null` ni exceptions** : l'absence d'une valeur s'exprime via `Option&lt;T&gt;`, l'erreur via `Result&lt;T, E&gt;`, et le compilateur **t'oblige** à gérer les deux cas.">Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result</a> *(l'équivalent natif de Rust)*

**Prérequis** :
- Discriminated unions en TS
- Notion de fonction pure

**S'oppose à / à comparer avec** :
- **Exceptions throw/catch** : sémantique opposée — implicite vs explicite
- **`?` operator Rust** : sucre pour propager Result, n'existe pas en TS (mais Effect.gen + yield* y ressemble)
- **Pattern matching ECMAScript Stage 1** : simplifierait drastiquement la discrimination

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-exception-handling-patterns-en-typescript" data-wiki-title="Exception Handling Patterns en TypeScript" data-wiki-preview="1. **try/catch** — la base. Bien, mais coûte cher en lisibilité quand on l'imbrique, et n'apporte rien dans le typage. 2. **Validate first** (early return / guard clauses) — vérifier les invariants au début de la fonction et retourner tôt.…">Exception Handling Patterns en TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

