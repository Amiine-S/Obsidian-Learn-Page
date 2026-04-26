---
created: 2026-04-26
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
---

# Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré

## Idée en une phrase

> `HttpApiBuilder` est le pont entre la **spec** (`HttpApi`) et l'**implémentation** : pour chaque endpoint déclaré dans le schéma, tu fournis un **handler Effect typé** dont le compilateur vérifie que l'input et l'output matchent la spec — impossible d'oublier un endpoint, impossible de retourner le mauvais type.

## Contexte / pourquoi ça compte

C'est ici que le contrat entre "déclaration" et "code qui tourne" est rendu **vérifiable par le compilateur**. Sans ce pont, la spec serait juste de la documentation que rien ne force à respecter (cf. les annotations Swagger qui mentent à moitié dans la plupart des projets).

C'est aussi le mécanisme qui rend l'**iteration sécurisée** : tu changes la spec, **tous les handlers concernés deviennent invalides** au sens TS — tu sais exactement où compléter.

## Détails / mécanisme

### Anatomie

```typescript
HttpApiBuilder.group(Api, "users", (handlers) =>
  handlers
    .handle("getUser", ({ path, urlParams, payload, request }) => /* Effect */)
    .handle("createUser", ({ payload }) => /* Effect */)
)
```

- `Api` : ta `HttpApi`
- `"users"` : le nom du groupe à implémenter
- `handlers` : un builder où chaque `.handle(...)` doit correspondre à un endpoint nommé du groupe

### Le typing au cœur du système

Les **clés possibles** de `.handle(...)` sont **dérivées de la spec** :

```typescript
HttpApiBuilder.group(Api, "users", (h) =>
  h
    .handle("getUser", ...)
    .handle("createUser", ...)
    .handle("typoEndpoint", ...) // ❌ erreur TS : "typoEndpoint" n'existe pas dans le groupe
)
```

Et le **handler reçoit l'input typé exact** :

```typescript
.handle("getUser", ({ path }) => {
  // path est typé { id: string } — dérivé du Schema.Struct({ id: Schema.String }) de la spec
  return Effect.succeed({ id: path.id, email: "..." })
  //                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //  doit matcher Schema User déclaré en `addSuccess`
})
```

Si tu retournes un truc qui ne matche pas `User`, **TS l'attrape** au build. Si tu oublies `email`, **TS l'attrape**. Si tu inventes une propriété, **TS l'attrape**.

### Exhaustivité

```typescript
// Spec déclare getUser ET createUser
HttpApiBuilder.group(Api, "users", (h) =>
  h.handle("getUser", ...) // pas de createUser → ❌ compile-time error
)
```

Tu ne peux pas oublier un endpoint. C'est la promesse forte.

### Erreurs typées

```typescript
.handle("getUser", ({ path }) =>
  Effect.gen(function* () {
    const svc = yield* UserService
    const user = yield* svc.findById(path.id)
    return user
  }).pipe(
    Effect.catchTag("DbError", () => 
      // Si on déclare aucune erreur DB dans la spec, ça ne compile pas
      // Si on a déclaré UserNotFound mais pas DbError, on doit catch ici
      Effect.fail(new UserNotFound({ id: path.id }))
    )
  )
)
```

Le **type d'erreur** du handler doit être un sous-ensemble des erreurs déclarées via `addError(...)`. Sinon, la compile échoue.

### Composition côté Layers

```typescript
// chaque groupe est un Layer
const usersGroupLive = HttpApiBuilder.group(Api, "users", ...).pipe(
  Layer.provide(UserService.Default)
)

const productsGroupLive = HttpApiBuilder.group(Api, "products", ...).pipe(
  Layer.provide(ProductService.Default)
)

// le builder global compose tous les groupes en un Layer du HttpApi
const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(usersGroupLive),
  Layer.provide(productsGroupLive)
)
```

À nouveau : si un groupe n'est pas branché, ça ne compile pas. Tu n'as pas de "endpoint déclaré mais 404 silencieux."

## Exemple concret

Mise en parallèle avec NestJS pour cadrer :

```typescript
// NestJS — typing partiel
@Controller("users")
class UsersController {
  @Get(":id")
  async getUser(@Param("id") id: string) {
    return await this.svc.findById(id) 
    // Aucune garantie que le retour matche une OpenAPI déclarée
    // Si l'OpenAPI dit User et le retour est User & { secret: string }, ça leak
  }
}
```

```typescript
// Effect HttpApiBuilder — typing total
HttpApiBuilder.group(Api, "users", (h) =>
  h.handle("getUser", ({ path }) =>
    Effect.gen(function* () {
      const svc = yield* UserService
      const u = yield* svc.findById(path.id)
      return u
      // Si u contient un champ non déclaré dans User → erreur TS
      // Si u manque un champ déclaré → erreur TS
    })
  )
)
```

C'est l'analogue de l'**implémentation d'une interface** en programmation classique, mais appliqué à une API REST.

## Connexions

**Concepts liés** :
- [[Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end]]
- [[Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP]]
- [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]]

**Prérequis** :
- Comprendre `HttpApi` (la déclaration)
- Effect.gen + yield* pour les services

**S'oppose à / à comparer avec** :
- **Express + middleware** : pas de check de cohérence — la spec et le code peuvent diverger sans alarme
- **tRPC procedure** : équivalent conceptuel, focalisé front-back même process
- **NestJS + class-validator** : runtime + décorateurs, moins de garanties compile-time

## Sources

- [[2026-04-26 - Effect-TS - premier serveur HTTP avec @effect-platform]]

## MOC

[[MOC - Backend & Infra]]
