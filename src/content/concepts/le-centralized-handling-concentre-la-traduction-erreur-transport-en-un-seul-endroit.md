---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - Le centralized handling concentre la traduction erreur → transport
  en un seul endroit
slug: >-
  le-centralized-handling-concentre-la-traduction-erreur-transport-en-un-seul-endroit
excerpt: >-
  Sans centralized handling, chaque controller doit traduire l'erreur en réponse
  : ```typescript app.get('/users/:id', async (req, res) => { try { const user =
  await getUser(req.params.id) res.json(user) } catch (e) { if (e instanceof
  UserNotFoundError) return res.status(404).json(
oneLiner: >-
  Plutôt que d'avoir des `try/catch` partout dans les controllers et services,
  **un seul endroit** (middleware Express, error boundary React,
  `process.on('uncaughtException')` Node) catch toutes les erreurs et les
  **traduit** vers le transport (HTTP status, UI fallback, log) — le code métier
  reste pur, ne sait rien du format de réponse.
related:
  - >-
    custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - 2026-04-26-exception-handling-patterns-en-typescript
  - backend-infra
topics:
  - backend
---
## Idée en une phrase

> Plutôt que d'avoir des `try/catch` partout dans les controllers et services, **un seul endroit** (middleware Express, error boundary React, `process.on('uncaughtException')` Node) catch toutes les erreurs et les **traduit** vers le transport (HTTP status, UI fallback, log) — le code métier reste pur, ne sait rien du format de réponse.

## Contexte / pourquoi ça compte

Sans centralized handling, chaque controller doit traduire l'erreur en réponse :
```typescript
app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id)
    res.json(user)
  } catch (e) {
    if (e instanceof UserNotFoundError) return res.status(404).json({ error: e.message })
    if (e instanceof ForbiddenError) return res.status(403).json({ error: e.message })
    if (e instanceof ZodError) return res.status(422).json({ errors: e.flatten() })
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})
```

Multiplie ça par 50 controllers : DRY violé, divergences possibles, tests dupliqués. Avec un middleware central, le controller se réduit à :
```typescript
app.get('/users/:id', async (req, res) => {
  const user = await getUser(req.params.id)
  res.json(user)
})
// Si getUser throws : le middleware d'erreur s'en occupe.
```

## Détails / mécanisme

### Express — middleware d'erreur

```typescript
// Doit être déclaré APRÈS toutes les routes
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Discriminer par instanceof ou tag
  if (err instanceof ClientError) {
    return res.status(err.status).json({
      error: err.message,
      tag: err.tag,
      ...(err instanceof ValidationError && { fields: err.fields }),
    })
  }

  // Inconnue : log + 500 sans détail (ne pas leak l'interne)
  logger.error({ err, path: req.path }, 'Unhandled error')
  res.status(500).json({ error: 'Internal Server Error', requestId: req.id })
})
```

Les controllers **n'utilisent plus de try/catch** — Express attrape automatiquement les rejected promises (depuis Express 5) et les passe au middleware. Sur Express 4, il faut wrapper avec `express-async-handler` ou `express-async-errors`.

### Fastify — error handler global

```typescript
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof ClientError) {
    reply.status(error.status).send({ error: error.message, tag: error.tag })
    return
  }
  request.log.error(error)
  reply.status(500).send({ error: 'Internal Server Error' })
})
```

### Effect-TS — handler par Layer

```typescript
const ErrorHandler = HttpApp.toHandler(...).pipe(
  Effect.catchTags({
    UserNotFound: (e) => HttpServerResponse.json({ error: e.message }, { status: 404 }),
    Forbidden: () => HttpServerResponse.json({ error: 'Forbidden' }, { status: 403 }),
  })
)
```

`catchTags` est l'équivalent du switch sur tag, mais **typé compile-time** : si tu ajoutes une erreur dans la chaîne sans la catcher, TS refuse de compiler.

### React — Error Boundary

```tsx
class ErrorBoundary extends React.Component<{ children: ReactNode; fallback: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: info })
  }

  render() {
    if (this.state.error) return this.props.fallback
    return this.props.children
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

Limite côté React : les Error Boundaries n'attrapent **PAS** les erreurs dans :
- Les event handlers (`onClick`, etc.) — il faut try/catch local
- Les effects async (`useEffect` avec await)
- Le code SSR

Pour ça, combiner avec un `unhandledrejection` listener.

### Node — handlers globaux

```typescript
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception, exiting')
  // Crash propre — laisse le superviseur (PM2 / Kubernetes) restart
  process.exit(1)
})
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'Unhandled rejection, exiting')
  process.exit(1)
})
```

**Principe** : ne pas essayer de continuer après une exception non gérée. Le state du process est inconnu — restart est plus safe que tenter de récupérer.

## Exemple concret

Architecture standard d'une API backend en TS :

```
┌──────────────────────────────────────────────┐
│ Routes / Controllers                         │
│   - PAS de try/catch                         │
│   - throw ClientError sous-classes           │
│   - laisse remonter les erreurs inconnues    │
└──────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│ Middleware d'erreur centralisé               │
│   - mapping ClientError.status → res.status  │
│   - log les erreurs inconnues                │
│   - réponse JSON uniforme                    │
└──────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│ process.on('uncaughtException')              │
│   - log fatal                                │
│   - exit propre                              │
│   - PM2 / k8s restart                        │
└──────────────────────────────────────────────┘
```

Le code métier reste pure logique, sans pollution de gestion d'erreur transport-spécifique.

### Le piège à éviter

**Ne jamais avaler les erreurs inconnues** :

```typescript
// ❌ ANTI-PATTERN
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message }) // leak de détails internes !
})

// ✓ Bonne pratique
app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.id }, 'Unhandled')
  res.status(500).json({ error: 'Internal Server Error', requestId: req.id })
})
```

L'utilisateur reçoit un message générique + un requestId pour qu'on retrouve le détail dans les logs. Pas de leak de stack trace.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee" data-wiki-title="Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée" data-wiki-preview="Sous-classer `Error` en classes nommées (`UserNotFoundError`, `ForbiddenError`, `RateLimitError`) avec un **tag discriminant** permet de **catcher de façon typée** au point de gestion (via `instanceof` ou switch sur tag) et de mapper propre…">Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée</a>
- <span class="wikilink-broken" title="Référence non trouvée : Concept - try/catch impose un narrow manuel et ne documente rien dans la signature">Concept - try/catch impose un narrow manuel et ne documente rien dans la signature</span>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare" data-wiki-title="Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré" data-wiki-preview="`HttpApiBuilder` est le pont entre la **spec** (`HttpApi`) et l'**implémentation** : pour chaque endpoint déclaré dans le schéma, tu fournis un **handler Effect typé** dont le compilateur vérifie que l'input et l'output matchent la spec — i…">Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré</a> *(version Effect du pattern)*

**Prérequis** :
- Notion de middleware (Express/Fastify) ou Error Boundary (React)

**S'oppose à / à comparer avec** :
- **try/catch dans chaque route** : duplication, violation DRY
- **Erreurs avalées silencieusement** : crash mais pas de log → debug impossible

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-exception-handling-patterns-en-typescript" data-wiki-title="Exception Handling Patterns en TypeScript" data-wiki-preview="1. **try/catch** — la base. Bien, mais coûte cher en lisibilité quand on l'imbrique, et n'apporte rien dans le typage. 2. **Validate first** (early return / guard clauses) — vérifier les invariants au début de la fonction et retourner tôt.…">Exception Handling Patterns en TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

