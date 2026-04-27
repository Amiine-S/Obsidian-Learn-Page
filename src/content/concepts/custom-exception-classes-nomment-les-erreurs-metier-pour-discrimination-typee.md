---
created: '2026-04-26T21:55:23.403Z'
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - Custom Exception classes nomment les erreurs métier pour
  discrimination typée
slug: custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
excerpt: >-
  C'est le pattern qui transforme un `try { ... } catch (e) { /* mystère */ }`
  en un dispatch propre. Sans Custom Exception, tu finis avec :
oneLiner: >-
  Sous-classer `Error` en classes nommées (`UserNotFoundError`,
  `ForbiddenError`, `RateLimitError`) avec un **tag discriminant** permet de
  **catcher de façon typée** au point de gestion (via `instanceof` ou switch sur
  tag) et de mapper proprement chaque erreur vers son comportement (status HTTP,
  retry, log…).
related:
  - >-
    validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
  - 2026-04-26-exception-handling-patterns-en-typescript
  - backend-infra
backlinks:
  - 2026-04-26-exception-handling-patterns-en-typescript
  - >-
    le-centralized-handling-concentre-la-traduction-erreur-transport-en-un-seul-endroit
  - try-catch-impose-un-narrow-manuel-et-ne-documente-rien-dans-la-signature
  - >-
    validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
topics:
  - backend
---
## Idée en une phrase

> Sous-classer `Error` en classes nommées (`UserNotFoundError`, `ForbiddenError`, `RateLimitError`) avec un **tag discriminant** permet de **catcher de façon typée** au point de gestion (via `instanceof` ou switch sur tag) et de mapper proprement chaque erreur vers son comportement (status HTTP, retry, log…).

## Contexte / pourquoi ça compte

C'est le pattern qui transforme un `try { ... } catch (e) { /* mystère */ }` en un dispatch propre. Sans Custom Exception, tu finis avec :

```typescript
catch (e) {
  if (e.message.includes('not found')) // ❌ matching sur strings, fragile
}
```

Avec Custom Exception :
```typescript
catch (e) {
  if (e instanceof UserNotFoundError) // ✓ structurel, typé
}
```

C'est aussi la condition pour qu'un **handler centralisé** (point 4 du pattern Exception Handling) fonctionne : il a besoin de classes différentes pour différencier les comportements.

## Détails / mécanisme

### Pattern de base

```typescript
class UserNotFoundError extends Error {
  readonly tag = 'UserNotFound' as const
  constructor(public readonly userId: string) {
    super(`User ${userId} not found`)
    this.name = 'UserNotFoundError'
  }
}

class ForbiddenError extends Error {
  readonly tag = 'Forbidden' as const
  constructor(public readonly resource: string, public readonly userId: string) {
    super(`User ${userId} forbidden from ${resource}`)
    this.name = 'ForbiddenError'
  }
}
```

Trois choses essentielles :
1. **`extends Error`** : reste compatible avec tous les outils qui attendent un Error (Sentry, log, etc.)
2. **`name`** explicite : utile au log / debugger
3. **`tag` discriminant** : `as const` pour que TS le narrowe correctement, échappe au piège du `instanceof` à travers les realms

### Discrimination typée — `instanceof`

```typescript
try {
  const user = await getUser(id)
} catch (e) {
  if (e instanceof UserNotFoundError) {
    // e: UserNotFoundError → e.userId est typé string
    return res.status(404).json({ id: e.userId })
  }
  if (e instanceof ForbiddenError) {
    return res.status(403).json({ resource: e.resource })
  }
  throw e // unknown → relance vers handler global
}
```

### Discrimination typée — par `tag` (recommandé)

`instanceof` peut **échouer** dans certains cas (plusieurs realms en serialization, multi-instances de la même classe à cause d'imports multiples). Le tag est plus robuste :

```typescript
type AppError = UserNotFoundError | ForbiddenError | RateLimitError

function handleError(e: unknown) {
  if (!(e instanceof Error) || !('tag' in e)) {
    // pas une de nos erreurs métier
    throw e
  }
  const error = e as AppError
  switch (error.tag) {
    case 'UserNotFound': return notFound(error.userId)
    case 'Forbidden':    return forbidden(error.resource)
    case 'RateLimit':    return tooManyRequests(error.retryAfter)
    // exhaustivité TypeScript : si tu ajoutes un nouveau tag, le switch ne compile plus sans le case
  }
}
```

Avec un type union explicite, TS te force l'exhaustivité.

### Hiérarchie d'erreurs

Pour des familles d'erreurs (ex: toutes les `4xx`), une classe parente est utile :

```typescript
abstract class ClientError extends Error {
  abstract readonly status: number
}
class UserNotFoundError extends ClientError {
  readonly status = 404
  constructor(public readonly userId: string) { super(`User ${userId} not found`) }
}
class ForbiddenError extends ClientError {
  readonly status = 403
  constructor() { super('Forbidden') }
}

// Handler générique
catch (e) {
  if (e instanceof ClientError) return res.status(e.status).json({ error: e.message })
  throw e
}
```

### Bonus : discriminer pour propagation

```typescript
class NetworkError extends Error {
  readonly tag = 'Network' as const
  readonly retryable = true
}
class ValidationError extends Error {
  readonly tag = 'Validation' as const
  readonly retryable = false
}

// Logique de retry
async function withRetry<T>(fn: () => Promise<T>, max = 3): Promise<T> {
  for (let i = 0; i < max; i++) {
    try { return await fn() }
    catch (e) {
      if (e instanceof Error && 'retryable' in e && !e.retryable) throw e
      if (i === max - 1) throw e
    }
  }
  throw new Error('unreachable')
}
```

## Exemple concret

Une appli e-commerce typique aura ce module :

```typescript
// src/errors/index.ts
export class NotFoundError extends Error {
  readonly tag = 'NotFound' as const
  readonly status = 404
  constructor(public readonly entity: string, public readonly id: string) {
    super(`${entity} ${id} not found`)
  }
}

export class ConflictError extends Error {
  readonly tag = 'Conflict' as const
  readonly status = 409
}

export class ValidationError extends Error {
  readonly tag = 'Validation' as const
  readonly status = 422
  constructor(message: string, public readonly fields: Record<string, string[]>) { super(message) }
}

export class UnauthorizedError extends Error {
  readonly tag = 'Unauthorized' as const
  readonly status = 401
}

export class ForbiddenError extends Error {
  readonly tag = 'Forbidden' as const
  readonly status = 403
}

export class RateLimitError extends Error {
  readonly tag = 'RateLimit' as const
  readonly status = 429
  constructor(public readonly retryAfter: number) { super('Rate limit exceeded') }
}

export type AppError = NotFoundError | ConflictError | ValidationError | UnauthorizedError | ForbiddenError | RateLimitError
```

Le middleware Express ne fait qu'un switch sur `tag` ou un `instanceof Error && 'status' in error`.

## Connexions

**Concepts liés** :
- <span class="wikilink-broken" title="Référence non trouvée : Concept - try/catch impose un narrow manuel et ne documente rien dans la signature">Concept - try/catch impose un narrow manuel et ne documente rien dans la signature</span>
- <span class="wikilink-broken" title="Référence non trouvée : Concept - Le centralized handling concentre la traduction erreur → transport en un seul endroit">Concept - Le centralized handling concentre la traduction erreur → transport en un seul endroit</span>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat" data-wiki-title="Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat" data-wiki-preview="Le pattern **validate first** (ou **early return**, ou **guard clauses**) consiste à grouper toutes les vérifications d'invariants au **début** d'une fonction et à retourner / throw immédiatement en cas d'échec, pour que le reste du corps s…">Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat</a>

**Prérequis** :
- Classes ES6
- `extends Error`

**S'oppose à / à comparer avec** :
- **String matching** dans catch (`e.message.includes('not found')`) : fragile
- **Numéro de code d'erreur** (`if (e.code === 1234)`) : pas TS-friendly
- **Result / Either** : alternative complète, encode dans le type plutôt que dans une classe

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-exception-handling-patterns-en-typescript" data-wiki-title="Exception Handling Patterns en TypeScript" data-wiki-preview="1. **try/catch** — la base. Bien, mais coûte cher en lisibilité quand on l'imbrique, et n'apporte rien dans le typage. 2. **Validate first** (early return / guard clauses) — vérifier les invariants au début de la fonction et retourner tôt.…">Exception Handling Patterns en TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

