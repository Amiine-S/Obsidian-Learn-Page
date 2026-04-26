---
title: Exception Handling Patterns en TypeScript
author: Claude (synthèse)
digested: 2026-04-26T00:00:00.000Z
format: doc
domain: backend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/backend
  - format/doc
  - level/intermediate
slug: 2026-04-26-exception-handling-patterns-en-typescript
excerpt: >-
  1. **try/catch** — la base. Bien, mais coûte cher en lisibilité quand on
  l'imbrique, et n'apporte rien dans le typage. 2. **Validate first** (early
  return / guard clauses) — vérifier les invariants au début de la fonction et
  retourner tôt. Évite la moitié des try/catch. 3. **Cust
related:
  - >-
    validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
  - >-
    custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
  - >-
    le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion
  - 2026-04-25-effect-ts-pourquoi-et-pour-qui
  - backend-infra
backlinks:
  - >-
    custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
  - >-
    le-centralized-handling-concentre-la-traduction-erreur-transport-en-un-seul-endroit
  - >-
    le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion
  - try-catch-impose-un-narrow-manuel-et-ne-documente-rien-dans-la-signature
  - >-
    validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
topics:
  - backend
  - typescript
---
## Pourquoi cette source

> En TypeScript, **les exceptions ne font pas partie de la signature de fonction** — quand tu vois `getUser(id: string): Promise<User>`, rien ne te dit que ça peut throw. C'est la principale différence avec Rust ou Effect-TS, et la source des bugs "*j'avais oublié de catch ce cas*". Cinq patterns canoniques cohabitent en pratique. Savoir lequel utiliser dans quel contexte évite bien des nuits blanches.

## Résumé en 5 lignes

1. **try/catch** — la base. Bien, mais coûte cher en lisibilité quand on l'imbrique, et n'apporte rien dans le typage.
2. **Validate first** (early return / guard clauses) — vérifier les invariants au début de la fonction et retourner tôt. Évite la moitié des try/catch.
3. **Custom Exception classes** — sous-classer `Error` pour des erreurs métier spécifiques avec discrimination via `instanceof`.
4. **Centralized handling** — un seul endroit qui catch (middleware Express/Fastify, error boundary React, `process.on('uncaughtException')`). Garde le code métier propre.
5. **Result object** (`Result<T, E>` ou `Either<L, R>`) — modéliser l'erreur **dans le type de retour**. La fonction ne throw plus : elle retourne `{ ok: true, value } | { ok: false, error }`. Force le caller à gérer le cas d'erreur.

---

## 1. try/catch — l'approche par défaut

### Ce que c'est

Le mécanisme natif JS/TS pour intercepter une exception levée dans un bloc.

```typescript
async function getUser(id: string): Promise<User> {
  try {
    const res = await fetch(`/api/users/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('getUser failed:', err)
    throw err // ré-throw ou retour valeur par défaut
  }
}
```

### Quand l'utiliser

- Aux **frontières I/O** (HTTP, FS, DB) où les erreurs sont structurellement attendues.
- Quand tu dois **transformer** une erreur en une autre (ex: `DbError` → `UserNotFound`).

### Limites

- L'erreur catchée est typée `unknown` (depuis TS 4.4 avec `useUnknownInCatchVariables`). Tu dois narrow manuellement.
- Le code devient illisible si tu nestes 3 try/catch dans la même fonction.
- **Les erreurs ne sont pas dans la signature** — un caller ne sait pas qu'il faut catch.

→ <span class="wikilink-broken" title="Référence non trouvée : Concept - try/catch impose un narrow manuel et ne documente rien dans la signature">Concept - try/catch impose un narrow manuel et ne documente rien dans la signature</span>

---

## 2. Validate first (early return / guard clauses)

### Ce que c'est

Vérifier les invariants AU DÉBUT de la fonction et retourner / throw immédiatement si quelque chose ne va pas. Le reste du corps suppose que tout est valide.

```typescript
function transferMoney(from: Account, to: Account, amount: number) {
  // VALIDATIONS D'ABORD — fail fast
  if (amount <= 0) throw new Error('Amount must be positive')
  if (from.id === to.id) throw new Error('Cannot transfer to self')
  if (from.balance < amount) throw new Error('Insufficient funds')

  // Code "happy path" — pas de else imbriqué
  from.balance -= amount
  to.balance += amount
  return { from, to }
}
```

### Quand l'utiliser

- **Toujours** sur les fonctions métier. C'est la règle d'hygiène #1 ("**fail fast**").
- Avec un parser comme **Zod / Effect Schema** qui fait le validate first à grande échelle :
  ```typescript
  const Body = z.object({ email: z.string().email(), age: z.number().min(18) })
  function createUser(input: unknown) {
    const data = Body.parse(input) // throws si invalide → un seul point de sortie
    // À partir d'ici, data est typé garanti
    return db.users.insert(data)
  }
  ```

### Limites

- Ça reste du throw — donc même problème que try/catch côté caller (pas dans la signature).
- Plus tu as de validations, plus le début de fonction grossit. Extraire dans un parser/validator dédié si > 5 conditions.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat" data-wiki-title="Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat" data-wiki-preview="Le pattern **validate first** (ou **early return**, ou **guard clauses**) consiste à grouper toutes les vérifications d'invariants au **début** d'une fonction et à retourner / throw immédiatement en cas d'échec, pour que le reste du corps s…">Concept - Validate first place toutes les vérifications en début de fonction pour un code happy-path plat</a>

---

## 3. Custom Exception classes

### Ce que c'est

Sous-classer `Error` pour des erreurs métier nommées, avec discrimination via `instanceof` ou un tag.

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
  constructor(public readonly resource: string) {
    super(`Forbidden access to ${resource}`)
    this.name = 'ForbiddenError'
  }
}

function getUser(id: string): User {
  const u = db.findUser(id)
  if (!u) throw new UserNotFoundError(id)
  return u
}

// Côté caller
try {
  const u = getUser(req.params.id)
} catch (e) {
  if (e instanceof UserNotFoundError) return res.status(404).json({ id: e.userId })
  if (e instanceof ForbiddenError) return res.status(403).json({ resource: e.resource })
  throw e // erreur inconnue → laisse le handler global
}
```

### Quand l'utiliser

- Dès que tu as **plusieurs types d'erreurs métier** distincts (404, 403, 422, conflict, rate limit…).
- En combinaison avec un **handler centralisé** (point 4) qui mappe chaque type → status HTTP.

### Limites

- `instanceof` ne marche pas correctement à travers des `realms` (microservices avec serialization). Préférer un **tag** discriminant (`tag: 'UserNotFound' as const`).
- Garder une discipline : **TOUJOURS** exporter les classes d'erreurs depuis le module métier, jamais les redéfinir ailleurs.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee" data-wiki-title="Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée" data-wiki-preview="Sous-classer `Error` en classes nommées (`UserNotFoundError`, `ForbiddenError`, `RateLimitError`) avec un **tag discriminant** permet de **catcher de façon typée** au point de gestion (via `instanceof` ou switch sur tag) et de mapper propre…">Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée</a>

---

## 4. Centralized handling

### Ce que c'est

Un **seul endroit** dans l'application catch toutes les exceptions et les traduit en réponse adaptée. Le code métier ne fait que `throw` — il ne sait rien du transport (HTTP, log, retry).

### Côté Express / Fastify

```typescript
// middleware d'erreur (Express)
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof UserNotFoundError) return res.status(404).json({ error: err.message, userId: err.userId })
  if (err instanceof ForbiddenError) return res.status(403).json({ error: err.message })
  if (err instanceof ZodError) return res.status(422).json({ errors: err.flatten() })
  
  // erreur inconnue : log + 500 sans détail
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

// dans tes routes : pas un seul try/catch
app.get('/users/:id', async (req, res) => {
  const user = await getUser(req.params.id) // throws → middleware catch
  res.json(user)
})
```

### Côté React (Error Boundary)

```tsx
class ErrorBoundary extends React.Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { logToSentry(error, info) }
  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} />
    return this.props.children
  }
}
```

### Côté Node global (uncaught)

```typescript
process.on('uncaughtException', (err) => {
  logger.fatal(err)
  process.exit(1) // crash safe — laisse le superviseur (PM2/k8s) restart
})
process.on('unhandledRejection', (err) => {
  logger.fatal(err)
  process.exit(1)
})
```

### Quand l'utiliser

- **Toujours** — c'est l'hygiène 101 d'un backend ou d'une SPA. Ne pas avoir de centralized handling = leak des stack traces en réponse + crash silencieux.

→ <span class="wikilink-broken" title="Référence non trouvée : Concept - Le centralized handling concentre la traduction erreur → transport en un seul endroit">Concept - Le centralized handling concentre la traduction erreur → transport en un seul endroit</span>

---

## 5. Result object (Result / Either / Try)

### Ce que c'est

Modéliser **l'erreur dans le type de retour**, comme Rust avec `Result<T, E>` ou Haskell avec `Either<L, R>`. La fonction **ne throw pas** — elle retourne une union :

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

async function getUser(id: string): Promise<Result<User, 'NotFound' | 'DbError'>> {
  try {
    const u = await db.findUser(id)
    if (!u) return err('NotFound')
    return ok(u)
  } catch (e) {
    return err('DbError')
  }
}

// caller — TS force la gestion
const r = await getUser('abc')
if (!r.ok) {
  if (r.error === 'NotFound') return res.status(404).json({})
  return res.status(500).json({})
}
const user = r.value // typé User, garanti ok
```

### Variantes

| Approche | Lib / nom | Avantages |
|---|---|---|
| Inline manuel | `{ ok, value, error }` | Zéro dep, immédiat |
| Tuple Go-style | `[T \| null, Error \| null]` | Familier aux devs Go |
| `neverthrow` | `Result<T, E>` avec `.map`, `.andThen` | API riche, chaînage |
| **Effect-TS** | `Effect<A, E, R>` | Erreurs + dépendances + annulation, full power |

### Quand l'utiliser

- Pour des **erreurs domain attendues** (validation, business rules) — pas pour les bugs (programming errors).
- Quand tu veux **forcer le caller à gérer** explicitement les cas d'erreur (équivalent du `?` Rust).
- Si tu déjà adopté **Effect-TS** : utilise `Effect` partout, c'est l'extension naturelle de Result.

### Limites

- Verbose si tu as 50 fonctions toutes en Result — d'où l'intérêt d'Effect-TS qui composent ces Result.
- N'élimine pas le besoin de try/catch aux frontières I/O — il les **encapsule**.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion" data-wiki-title="Concept - Le pattern Result encode l'erreur dans le type de retour pour forcer la gestion" data-wiki-preview="Le pattern **Result** (ou **Either**, ou **Try**) consiste à modéliser une fonction &quot;qui peut échouer&quot; non pas via `throw`, mais via un **type de retour union** — `Result&lt;T, E&gt; = { ok: true; value: T } | { ok: false; error: E }` — ce qui fo…">Concept - Le pattern Result encode l'erreur dans le type de retour pour forcer la gestion</a>

---

## 6. Quel pattern dans quel contexte ?

| Situation | Pattern recommandé |
|---|---|
| Validation d'inputs API | **Validate first** + Zod / Schema |
| Erreurs métier nommées (404, 403, …) | **Custom Exception** |
| Routes Express / handlers Fastify | **Centralized** middleware |
| Bibliothèque pure (sans I/O) | **Result** ou Effect |
| Wrappers I/O bas-niveau (DB, HTTP) | **try/catch** + remap en Custom Exception |
| Code asynchrone composable | **Effect-TS** (qui couvre les 5 patterns) |
| React frontend | **Error Boundary** + Custom Exception métier |

Une appli backend bien faite combine **les 4 premiers** : `Validate first` à l'entrée, `try/catch` aux frontières I/O qui jettent des `Custom Exception`, le tout catché par le middleware **centralized**. Les `Result` arrivent quand on adopte un style fonctionnel ou Effect-TS.

---

## Citations brutes

> *"The best error message is the one that never gets shown."* — Thomas Fuchs (mais à la fois faux et vrai : on veut surtout que les erreurs soient explicitement modélisées, pas masquées).

---

## À explorer ensuite

- **`Effect-TS`** : déjà digéré (<a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-effect-ts-pourquoi-et-pour-qui" data-wiki-title="Effect-TS — pourquoi et pour qui" data-wiki-preview="1. **Effect-TS** est une lib TypeScript inspirée de **ZIO (Scala)** qui modélise tout ce qui peut &quot;se passer&quot; dans un programme via un seul type : `Effect&lt;A, E, R&gt;` = &quot;calcule un `A`, peut échouer avec `E`, requiert `R` du contexte&quot;. 2. Ell…">Effect-TS — pourquoi et pour qui</a>), c'est l'extension naturelle du pattern Result avec annulation et DI.
- **Pattern matching ECMAScript** (Stage 1) : `match (result) { when { ok: true } -> …, when { ok: false } -> … }` simplifierait les Result drastiquement.
- **`neverthrow`** : la lib Result minimaliste si tu veux pas Effect.
- **`@effect/schema`** vs **Zod** : les deux font validate-first, perfs et API différentes.
- **Sentry / OpenTelemetry** : où brancher le centralized handling pour observability.

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

