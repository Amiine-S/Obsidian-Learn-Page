---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end
slug: httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
excerpt: >-
  C'est l'API "haut niveau" de `@effect/platform` HTTP, par opposition à
  `HttpRouter` (impératif, plus proche d'Express). Le passage de l'un à l'autre
  est le moment où une API Effect-TS arrête de ressembler à un Express en mieux
  et **devient quelque chose de qualitativement différe
oneLiner: >-
  `HttpApi` est une **description déclarative** de la surface d'une API : pour
  chaque endpoint, tu déclares la méthode, le path, les schémas (path, query,
  body, response, erreurs) — cette spec devient une **source unique de vérité**
  dont sont dérivés le serveur, le client typé, l'OpenAPI, et la validation.
related:
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - 2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform
  - backend-infra
backlinks:
  - 2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
  - programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi
  - backend-infra
topics:
  - backend
  - effect-ts
  - typescript
---

# Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end

## Idée en une phrase

> `HttpApi` est une **description déclarative** de la surface d'une API : pour chaque endpoint, tu déclares la méthode, le path, les schémas (path, query, body, response, erreurs) — cette spec devient une **source unique de vérité** dont sont dérivés le serveur, le client typé, l'OpenAPI, et la validation.

## Contexte / pourquoi ça compte

C'est l'API "haut niveau" de `@effect/platform` HTTP, par opposition à `HttpRouter` (impératif, plus proche d'Express). Le passage de l'un à l'autre est le moment où une API Effect-TS arrête de ressembler à un Express en mieux et **devient quelque chose de qualitativement différent** :

- Tu **ne peux pas** écrire un handler qui ne matche pas la spec : ça ne compile pas
- Tu génères un **client TypeScript typé** sans rien écrire à la main
- Tu génères une **OpenAPI** sans annotations
- Tu valides **automatiquement** les inputs/outputs

C'est l'équivalent de tRPC, mais avec la puissance d'Effect derrière (erreurs typées, Layers, annulation, etc.).

## Détails / mécanisme

### Hiérarchie

```
HttpApi
└── HttpApiGroup (groupe d'endpoints, ex: "users", "products")
    └── HttpApiEndpoint (un endpoint, ex: GET /users/:id)
        ├── method (GET/POST/...)
        ├── path
        ├── setPath(Schema)        — params dans l'URL
        ├── setUrlParams(Schema)   — query string
        ├── setPayload(Schema)     — body
        ├── addSuccess(Schema)     — type de réponse 2xx
        └── addError(Schema)       — types d'erreurs typées
```

### Déclaration

```typescript
import { HttpApi, HttpApiGroup, HttpApiEndpoint } from "@effect/platform"
import { Schema } from "effect"

const User = Schema.Struct({ id: Schema.String, email: Schema.String })

const UserNotFound = Schema.TaggedStruct("UserNotFound", { id: Schema.String })

const usersGroup = HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("getUser", "/users/:id")
      .setPath(Schema.Struct({ id: Schema.String }))
      .addSuccess(User)
      .addError(UserNotFound, { status: 404 })
  )
  .add(
    HttpApiEndpoint.post("createUser", "/users")
      .setPayload(Schema.Struct({ email: Schema.String }))
      .addSuccess(User)
  )

const Api = HttpApi.make("MyApi").add(usersGroup)
```

À ce stade, **rien ne tourne**. C'est juste une **description**.

### Ce que tu peux en dériver

| Dérivable | Comment | Pourquoi c'est précieux |
|---|---|---|
| Serveur typé | `HttpApiBuilder.group(...)` | Le compilo refuse les implémentations qui ne matchent pas |
| Client typé TS | `HttpApiClient.make(Api)` | Du code front qui appelle l'API avec types complets |
| OpenAPI / Swagger | `HttpApiSwagger.layer({ openapi: { ... } })` | Doc auto-générée, toujours sync avec le code |
| Validation des inputs | automatique côté serveur | Pas besoin de Zod en parallèle |
| Sérialisation cohérente | via `Schema` | Date, BigInt, opaque types — tout est géré |

### Le contraste avec REST classique

**Express** :
```typescript
app.get("/users/:id", async (req, res) => {
  // req.params.id est string, mais TS ne le sait pas vraiment
  // pas de validation
  // pas de garantie que la réponse matche un schéma
  res.json({ id: req.params.id, email: "..." })
})
// L'OpenAPI est un fichier YAML séparé qu'il faut maintenir à la main
// Le client front fait un fetch + cast, sans garantie
```

**Effect HttpApi** :
```typescript
HttpApiEndpoint.get("getUser", "/users/:id")
  .setPath(Schema.Struct({ id: Schema.String }))
  .addSuccess(User)
  .addError(UserNotFound, { status: 404 })
// → tout vit dans le type, depuis le path jusqu'à l'erreur 404
```

## Exemple concret

Le client front associé, **gratuit** :

```typescript
import { HttpApiClient } from "@effect/platform"
import { Effect, Layer } from "effect"

const client = yield* HttpApiClient.make(Api, {
  baseUrl: "http://localhost:3000"
})

// Tout est typé end-to-end
const user = yield* client.users.getUser({ path: { id: "42" } })
// user est typé { id: string; email: string }

// Erreur typée, branchable via match
const result = yield* client.users.getUser({ path: { id: "missing" } }).pipe(
  Effect.catchTag("UserNotFound", (e) => 
    Effect.succeed({ id: "fallback", email: "" })
  )
)
```

Pas de OpenAPI generator. Pas de zodios. Pas de tRPC schema. Le `Api` est **la** source.

### Bonus — ce que ça change en pratique

- **Refactor d'endpoint** : tu changes le `Schema` dans la spec, et **tout** le code (handler, client, tests) s'allume en rouge. Tu peux pas oublier un endroit.
- **Doc** : la Swagger est dérivée. Elle est toujours juste.
- **Tests d'intégration** : tu peux générer des inputs aléatoires depuis le `Schema` (fast-check + Schema integration).

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare" data-wiki-title="Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré" data-wiki-preview="`HttpApiBuilder` est le pont entre la **spec** (`HttpApi`) et l'**implémentation** : pour chaque endpoint déclaré dans le schéma, tu fournis un **handler Effect typé** dont le compilateur vérifie que l'input et l'output matchent la spec — i…">Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http" data-wiki-title="Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP" data-wiki-preview="Quand un serveur Effect-TS démarre via `NodeHttpServer.layer` + `NodeRuntime.runMain`, le runtime construit **un graphe de Layers** (DB, logger, services, HttpServer) puis **rend chaque service disponible aux handlers** : tu n'écris jamais…">Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a>

**Prérequis** :
- Comprendre Effect (le type, les générateurs, les Layers)
- Notion de schéma (`@effect/schema` ≈ Zod)

**S'oppose à / à comparer avec** :
- **Express + Zod manuel** : équivalent fonctionnel, sans la cohérence ni la dérivation
- **NestJS + class-validator + Swagger module** : approche par décorateurs, équivalent en intention, plus verbeux et moins composable
- **tRPC** : philosophie identique mais centré React/Next, sans la profondeur d'Effect
- **GraphQL** : autre approche complète, basée schéma — Effect HttpApi reste REST mais tire 80% des bénéfices d'un schema-first

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform" data-wiki-title="Effect-TS — premier serveur HTTP avec @effect/platform" data-wiki-preview="1. **`@effect/platform`** est l'interface abstraite (HTTP, FS, runtime). **`@effect/platform-node`** (ou `-bun`, `-deno`) est l'implémentation concrète. Tu écris contre `platform`, tu lances avec `platform-node`. 2. Deux APIs cohabitent : *…">Effect-TS — premier serveur HTTP avec @effect/platform</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

