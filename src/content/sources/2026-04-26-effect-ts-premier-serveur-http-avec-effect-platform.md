---
title: Effect-TS — premier serveur HTTP avec @effect/platform
url: 'https://effect.website/docs/platform/http-server'
author: Effect-TS team · synthèse Claude
digested: '2026-04-26T15:41:33.366Z'
format: doc
domain: backend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/backend
  - format/doc
  - level/intermediate
slug: 2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform
excerpt: >-
  1. **`@effect/platform`** est l'interface abstraite (HTTP, FS, runtime).
  **`@effect/platform-node`** (ou `-bun`, `-deno`) est l'implémentation
  concrète. Tu écris contre `platform`, tu lances avec `platform-node`. 2. Deux
  APIs cohabitent : **`HttpRouter`** (impérative, ressemble à
related:
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - backend-infra
backlinks:
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
topics:
  - backend
  - effect-ts
  - typescript
---
## Pourquoi cette source

> Tu veux **commencer un backend en Effect-TS** : comprendre comment passer d'un script Effect à un **serveur HTTP qui tourne**, avec routing typé, validation d'inputs, gestion d'erreurs, DI via Layers, et déploiement Node. Cette note pose **les premiers pas concrets** — du `pnpm install` au premier endpoint qui répond `200 OK`.

## Résumé en 5 lignes

1. **`@effect/platform`** est l'interface abstraite (HTTP, FS, runtime). **`@effect/platform-node`** (ou `-bun`, `-deno`) est l'implémentation concrète. Tu écris contre `platform`, tu lances avec `platform-node`.
2. Deux APIs cohabitent : **`HttpRouter`** (impérative, ressemble à Express) et **`HttpApi`** (déclarative, schéma typé end-to-end). On commence par `HttpRouter`, on évolue vers `HttpApi` quand la surface d'API grandit.
3. **Tout endpoint est un `Effect`** : tu hérites des erreurs typées, retries, annulation, services Layers. Pas besoin d'un middleware system séparé — c'est `pipe(handler, addAuth, addLog)`.
4. **`HttpApiBuilder`** lie un schéma `HttpApi` (la déclaration) à des handlers Effect (l'implémentation). Le compilateur garantit que **tous les endpoints déclarés sont implémentés** avec les bons types.
5. **Validation gratuite** via `@effect/schema` : tu décris la shape attendue (params, query, body), Effect parse + valide + retourne une erreur typée si invalide. Plus besoin de Zod en parallèle.

---

## 1. Setup

```bash
pnpm add effect @effect/platform @effect/platform-node @effect/schema
```

Optionnel mais utile : `@effect/cli`, `@effect/rpc-server` (pour RPC type-safe).

Structure conseillée :
```
src/
├── main.ts              # entry point — composition runtime
├── server.ts            # construction du serveur HTTP
├── api/
│   └── users.ts         # un module = un sous-domaine
├── services/
│   └── UserService.ts   # service Effect (DB, logique)
└── layers/
    └── AppLayer.ts      # composition des Layers
```

---

## 2. Hello World — `HttpRouter` style

Le plus simple pour commencer :

```typescript
// main.ts
import { HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { createServer } from "node:http"

const router = HttpRouter.empty.pipe(
  HttpRouter.get("/", HttpServerResponse.text("Hello Effect!")),
  HttpRouter.get("/health", HttpServerResponse.json({ ok: true }))
)

const ServerLive = HttpServer.serve(router).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)

NodeRuntime.runMain(Layer.launch(ServerLive))
```

Ce qui se passe :
- `router` : un `HttpRouter` immutable (donc `pipe(...)` pour ajouter des routes)
- `HttpServer.serve(router)` : enrobe le router en un service HTTP
- `NodeHttpServer.layer(...)` : implémentation Node + port
- `NodeRuntime.runMain` : lance avec un runtime Node prêt (signaux, logger, etc.)

Lance avec `pnpm tsx main.ts`, va sur `http://localhost:3000` → "Hello Effect!"

---

## 3. Endpoint avec input — `HttpServerRequest` + Schema

```typescript
import { HttpServerRequest, HttpServerResponse, HttpRouter } from "@effect/platform"
import { Effect, Schema } from "effect"

const CreateUser = Schema.Struct({
  email: Schema.String,
  age: Schema.Number,
})

const createUser = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest
  const body = yield* HttpServerRequest.schemaBodyJson(CreateUser)(req)
  // body est typé { email: string; age: number }
  return yield* HttpServerResponse.json({ ok: true, body })
})

const router = HttpRouter.empty.pipe(
  HttpRouter.post("/users", createUser)
)
```

Si le body ne matche pas (`{ email: 42 }` par exemple), Effect renvoie une réponse 400 typée. **Pas de Zod, pas de Joi à câbler.**

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end" data-wiki-title="Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end" data-wiki-preview="`HttpApi` est une **description déclarative** de la surface d'une API : pour chaque endpoint, tu déclares la méthode, le path, les schémas (path, query, body, response, erreurs) — cette spec devient une **source unique de vérité** dont sont…">Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end</a>

---

## 4. Brancher un service via Layers

L'endpoint a besoin d'une DB, d'un logger, etc. Tu **décris** ces dépendances comme des services Effect, et tu les **fournis** via des Layers.

```typescript
// services/UserService.ts
import { Effect } from "effect"

export class UserService extends Effect.Service<UserService>()("app/UserService", {
  effect: Effect.gen(function* () {
    return {
      create: (email: string, age: number) =>
        Effect.succeed({ id: "abc", email, age })
    }
  })
}) {}
```

```typescript
// api/users.ts
import { HttpRouter, HttpServerResponse } from "@effect/platform"
import { Effect } from "effect"
import { UserService } from "../services/UserService"

const handler = Effect.gen(function* () {
  const svc = yield* UserService
  const u = yield* svc.create("alice@x.com", 30)
  return yield* HttpServerResponse.json(u)
})

export const usersRouter = HttpRouter.empty.pipe(
  HttpRouter.post("/users", handler)
)
```

```typescript
// main.ts
import { Layer } from "effect"

const AppLayer = Layer.merge(
  NodeHttpServer.layer(createServer, { port: 3000 }),
  UserService.Default
)

const ServerLive = HttpServer.serve(usersRouter).pipe(Layer.provide(AppLayer))
NodeRuntime.runMain(Layer.launch(ServerLive))
```

C'est exactement le même pattern que dans une app NestJS, mais **typé compile-time** : si `usersRouter` utilise un service que tu n'as pas fourni, **ça ne compile pas**.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http" data-wiki-title="Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP" data-wiki-preview="Quand un serveur Effect-TS démarre via `NodeHttpServer.layer` + `NodeRuntime.runMain`, le runtime construit **un graphe de Layers** (DB, logger, services, HttpServer) puis **rend chaque service disponible aux handlers** : tu n'écris jamais…">Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP</a>

---

## 5. Le saut qualitatif — `HttpApi` (déclaratif)

Quand l'API grandit, on passe à `HttpApi` : tu **déclares la spec** (endpoints + types I/O), puis tu **implémentes** chaque handler. Le compilateur vérifie l'exhaustivité.

```typescript
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiBuilder } from "@effect/platform"
import { Schema } from "effect"

// 1) Déclaration
const User = Schema.Struct({ id: Schema.String, email: Schema.String })

const usersGroup = HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("getUser", "/users/:id")
      .addSuccess(User)
      .setPath(Schema.Struct({ id: Schema.String }))
  )
  .add(
    HttpApiEndpoint.post("createUser", "/users")
      .addSuccess(User)
      .setPayload(Schema.Struct({ email: Schema.String }))
  )

const Api = HttpApi.make("MyApi").add(usersGroup)

// 2) Implémentation — TYPÉE par la décla
const usersGroupLive = HttpApiBuilder.group(Api, "users", (handlers) =>
  handlers
    .handle("getUser", ({ path }) =>
      // path.id est typé string, le retour doit matcher User
      Effect.succeed({ id: path.id, email: "alice@x.com" })
    )
    .handle("createUser", ({ payload }) =>
      Effect.succeed({ id: "new", email: payload.email })
    )
)

// 3) Composition
const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(usersGroupLive))

// 4) Démarrage
const ServerLive = HttpApiBuilder.serve(ApiLive).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)
NodeRuntime.runMain(Layer.launch(ServerLive))
```

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare" data-wiki-title="Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré" data-wiki-preview="`HttpApiBuilder` est le pont entre la **spec** (`HttpApi`) et l'**implémentation** : pour chaque endpoint déclaré dans le schéma, tu fournis un **handler Effect typé** dont le compilateur vérifie que l'input et l'output matchent la spec — i…">Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré</a>

**Pourquoi c'est puissant** :
- **Spec = source de vérité** : tu peux générer une OpenAPI à partir de `Api` (`HttpApiSwagger`)
- **Client typé gratuit** : `HttpApiClient.make(Api)` te donne un client TS typé end-to-end
- **Les erreurs typées** sont propagées : `Schema.tag("UserNotFound")` en spec → caught côté client

---

## 6. Logger, erreurs, et retry — gratuits

Parce que tout est `Effect`, tu hérites de :

```typescript
const handler = pipe(
  Effect.gen(function* () {
    const svc = yield* UserService
    return yield* svc.create("...", 30)
  }),
  Effect.tapError(err => Effect.logError("create failed", err)),
  Effect.retry({ times: 3, schedule: Schedule.exponential("100 millis") }),
  Effect.timeout("5 seconds")
)
```

Avec Express/Fastify, tu câblerais 4 middlewares différents. Avec Effect, c'est **du `pipe` sur un Effect**.

---

## 7. Tableau : Express vs Fastify vs Effect-TS

| | Express | Fastify | Effect-TS HTTP |
|---|---|---|---|
| Routing | impératif | impératif + schéma JSON | **impératif (Router) ou déclaratif (Api)** |
| Validation | manuelle ou Joi/Zod ad-hoc | JSON Schema intégré | **Schema natif, parse + valide** |
| Erreurs typées | ❌ | ⚠️ (côté types via plugin) | ✅ (dans la signature Effect) |
| DI | manuelle | manuelle (decorate) | **Layers Effect-TS** |
| Annulation | manuelle (signal) | manuelle | **automatique (interruption Effect)** |
| Retry / timeout / circuit breaker | libs ad-hoc | libs ad-hoc | **opérateurs Effect (`retry`, `timeout`)** |
| OpenAPI | plugin | plugin (auto) | **dérivée du `HttpApi`** |
| Maturité prod | ✅✅✅ | ✅✅ | ✅ (suffisant, encore jeune) |
| Apprentissage | 🟢 | 🟢 | 🔴 (sans Effect c'est mort) |

**Verdict** : Effect HTTP n'est pas encore le défaut, mais c'est **l'option cohérente** pour un projet déjà en Effect-TS. Sinon Fastify reste une excellente recommandation.

---

## Citations brutes

> *"`HttpApi` provides a declarative way to define HTTP APIs with end-to-end type safety."* — doc Effect platform.

---

## À explorer ensuite

- **`HttpApiClient`** : générer un client TS typé à partir de la spec `HttpApi`
- **`@effect/sql`** : DB layer en Effect (Postgres, SQLite, MySQL)
- **`HttpApiSwagger`** : générer un Swagger UI depuis la spec
- **Auth middleware** : `HttpApiSecurity` + handlers de auth
- **Tests** : remplacer un Layer pour mocker la DB en test
- **Déploiement Node** : pm2/Docker, signaux SIGTERM gérés par `NodeRuntime.runMain`
- **Bun / Deno** : utiliser `@effect/platform-bun` à la place de `-node`

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

