---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur
  HTTP
slug: le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
excerpt: >-
  C'est le mécanisme qui transpose la **DI Effect-TS** au monde du serveur HTTP.
  Sans lui, tu aurais soit : - Des singletons globaux (impossibles à tester
  proprement) - Du React Context-style (fragile) - Une DI à base de classes
  décorées style NestJS (verbose)
oneLiner: >-
  Quand un serveur Effect-TS démarre via `NodeHttpServer.layer` +
  `NodeRuntime.runMain`, le runtime construit **un graphe de Layers** (DB,
  logger, services, HttpServer) puis **rend chaque service disponible aux
  handlers** : tu n'écris jamais `new ServiceX(...)`, tu déclares `yield*
  ServiceX` dans ton Effect, et le runtime injecte la bonne instance.
related:
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react
  - 2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform
  - backend-infra
backlinks:
  - 2026-04-26-clean-architecture-hybride-sans-over-engineering
  - 2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - backend-infra
topics:
  - backend
  - effect-ts
  - typescript
---

# Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP

## Idée en une phrase

> Quand un serveur Effect-TS démarre via `NodeHttpServer.layer` + `NodeRuntime.runMain`, le runtime construit **un graphe de Layers** (DB, logger, services, HttpServer) puis **rend chaque service disponible aux handlers** : tu n'écris jamais `new ServiceX(...)`, tu déclares `yield* ServiceX` dans ton Effect, et le runtime injecte la bonne instance.

## Contexte / pourquoi ça compte

C'est le mécanisme qui transpose la **DI Effect-TS** au monde du serveur HTTP. Sans lui, tu aurais soit :
- Des singletons globaux (impossibles à tester proprement)
- Du React Context-style (fragile)
- Une DI à base de classes décorées style NestJS (verbose)

Avec, tu obtiens un système **typé compile-time** où :
- Les dépendances de ton handler sont **dans son type d'Effect**
- Les Layers que tu fournis **doivent couvrir** ces dépendances, sinon le programme ne compile pas
- Pour tester, tu **swap un Layer** sans toucher à un handler

## Détails / mécanisme

### Le flux

```
1. Layer.merge(...) — composition des services (DB, Logger, UserSvc, ...)
                ↓
2. Layer.provide(serverLayer, AppLayer) — branchement sur le serveur HTTP
                ↓
3. NodeRuntime.runMain(Layer.launch(...)) — instanciation effective :
   - construction des Layers (ordre topologique)
   - démarrage du HttpServer
   - chaque request fait tourner les handlers dans un runtime ayant accès aux services
                ↓
4. handler : Effect.gen(function* () { const x = yield* SomeService })
   — le runtime fournit l'instance de SomeService à l'Effect
                ↓
5. Shutdown : Layer.scoped + finalizers — release des ressources (DB pool, etc.)
```

### Ordre des opérations dans le code

```typescript
import { HttpServer } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { createServer } from "node:http"

// 1. Décrire les services
class Db extends Effect.Service<Db>()("app/Db", {
  scoped: Effect.gen(function* () {
    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => createPool()),
      (p) => Effect.sync(() => p.close())  // finalizer
    )
    return { query: (sql: string) => /* ... */ }
  })
}) {}

class Logger extends Effect.Service<Logger>()("app/Logger", {
  effect: Effect.succeed({ info: (msg: string) => Effect.sync(() => console.log(msg)) })
}) {}

// 2. Déclarer un router qui les utilise
const usersHandler = Effect.gen(function* () {
  const db = yield* Db
  const log = yield* Logger
  yield* log.info("listing users")
  const users = yield* db.query("SELECT * FROM users")
  return yield* HttpServerResponse.json(users)
})

const router = HttpRouter.empty.pipe(HttpRouter.get("/users", usersHandler))

// 3. Composer les Layers
const AppLayer = Layer.merge(Db.Default, Logger.Default)

// 4. Brancher sur le HTTP server
const ServerLive = HttpServer.serve(router).pipe(
  Layer.provide(AppLayer),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)

// 5. Lancer
NodeRuntime.runMain(Layer.launch(ServerLive))
```

### Garantie principale

Le type d'`usersHandler` est :
```
Effect<HttpServerResponse, never, Db | Logger | HttpServerRequest>
```

`Db | Logger` sont des **dépendances**. Si le `Layer` final ne les fournit pas, **le programme ne compile pas**. C'est ce qui rend impossible le bug "j'ai oublié de provider mon service en prod."

### Test : swap d'un Layer

```typescript
// En test
const TestLayer = Layer.merge(
  DbInMemory,        // version mock du service Db, même interface
  Logger.Default
)

const TestServer = HttpServer.serve(router).pipe(
  Layer.provide(TestLayer),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 0 }))
)
```

**Aucun handler n'est modifié.** Tu changes le Layer fourni, c'est tout. C'est le bénéfice central de l'inversion de dépendance.

### Concurrence et scoping par-requête

Effect garantit que chaque requête a son propre **scope** (cf. `Effect.scoped`). Si une requête est annulée (client disconnect), tous les Effects en cours sont **interrompus** et leurs finalizers exécutés. C'est gratuit — pas de `AbortSignal` à câbler manuellement.

## Exemple concret

Imagine un endpoint qui fait :
1. Query DB
2. Appel HTTP externe
3. Log

```typescript
const handler = Effect.gen(function* () {
  const db = yield* Db
  const http = yield* HttpClient
  const log = yield* Logger
  
  const user = yield* db.query("SELECT * FROM users WHERE id = $1", [id])
  const enrich = yield* http.get(`https://enrich.com/${user.email}`)
  yield* log.info("enriched user")
  
  return { user, enrich }
})
```

Trois services injectés. Aucun import direct. Annulation propagée si le client coupe (Effect interrompt l'appel HTTP en cours, libère la connexion DB). Test : remplace `Db.Default` par `Db.Mock` et `HttpClient.Default` par un mock. **Zéro changement** dans `handler`.

C'est l'équivalent de NestJS + class-validator + AbortController + retry library, **unifié dans une seule abstraction** (l'Effect avec son contexte typé).

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end" data-wiki-title="Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end" data-wiki-preview="`HttpApi` est une **description déclarative** de la surface d'une API : pour chaque endpoint, tu déclares la méthode, le path, les schémas (path, query, body, response, erreurs) — cette spec devient une **source unique de vérité** dont sont…">Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare" data-wiki-title="Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré" data-wiki-preview="`HttpApiBuilder` est le pont entre la **spec** (`HttpApi`) et l'**implémentation** : pour chaque endpoint déclaré dans le schéma, tu fournis un **handler Effect typé** dont le compilateur vérifie que l'input et l'output matchent la spec — i…">Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react" data-wiki-title="Concept - Atom.runtime branche les Layers Effect-TS dans le state management React" data-wiki-preview="`Atom.runtime(layer)` est le pont qui prend un **`Layer&lt;…&gt;` Effect-TS** et le transforme en **runtime accessible depuis React** — chaque atom créé via ce runtime obtient automatiquement les services du Layer en injection.">Concept - Atom.runtime branche les Layers Effect-TS dans le state management React</a> *(le pendant côté front)*

**Prérequis** :
- Layers Effect-TS
- Notion de runtime / scope dans Effect

**S'oppose à / à comparer avec** :
- **NestJS DI runtime** : décorateurs + reflect-metadata, équivalent en intention, moins typé
- **React Context** : équivalent côté front, runtime, sans typage des deps
- **Singletons globaux** : zero typing, zero testabilité

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform" data-wiki-title="Effect-TS — premier serveur HTTP avec @effect/platform" data-wiki-preview="1. **`@effect/platform`** est l'interface abstraite (HTTP, FS, runtime). **`@effect/platform-node`** (ou `-bun`, `-deno`) est l'implémentation concrète. Tu écris contre `platform`, tu lances avec `platform-node`. 2. Deux APIs cohabitent : *…">Effect-TS — premier serveur HTTP avec @effect/platform</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

