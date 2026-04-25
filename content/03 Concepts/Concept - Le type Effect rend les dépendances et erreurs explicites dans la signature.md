---
created: 2026-04-25
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature

## Idée en une phrase

> `Effect<A, E, R>` — "calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte" — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'elle peut casser, et ce dont elle a besoin.

## Contexte / pourquoi ça compte

C'est l'**innovation fondamentale** d'Effect-TS — toutes les autres features (Layers, Fibers, Schema) gravitent autour. Si tu comprends `Effect<A, E, R>`, tu comprends pourquoi Effect-TS existe.

En TS standard, une fonction `async (id: string) => Promise<User>` te dit ce qu'elle renvoie. Elle ne dit **rien** de ce qu'elle peut throw, ni de ce dont elle a besoin pour fonctionner. C'est cette opacité qu'Effect-TS attaque.

## Détails / mécanisme

### Les 3 paramètres de type

```typescript
Effect<A, E, R>
//      │  │  │
//      │  │  └── Requirements : services nécessaires (DI)
//      │  └───── Error : tous les types d'erreur possibles
//      └──────── Success : ce que ça renvoie en cas de succès
```

### Lecture d'une signature Effect

```typescript
const fetchUser: (id: string) => Effect<User, NetworkError | NotFoundError, HttpClient>
```

Tu lis : "fonction qui prend un `id` string. Quand tu lances l'Effect résultant, soit tu obtiens un `User`, soit tu récupères une erreur `NetworkError` ou `NotFoundError`. Ce code a besoin qu'un `HttpClient` soit fourni dans le contexte."

### Composition

Quand tu combines deux Effects, leurs `E` et `R` **fusionnent** :

```typescript
const a: Effect<X, ErrA, DepA>;
const b: (x: X) => Effect<Y, ErrB, DepB>;

const ab: Effect<Y, ErrA | ErrB, DepA | DepB> = pipe(a, Effect.flatMap(b));
```

Le compilateur calcule automatiquement l'union des erreurs et des dépendances. Tu **ne peux pas** "oublier" qu'une fonction quelque part dans la chaîne peut throw `ErrB` — c'est dans la signature finale.

### Élimination des erreurs / dépendances

- **Gérer une erreur** : `Effect.catchTag` ou `Effect.match` → l'erreur disparaît du `E`
- **Fournir une dépendance** : `Effect.provide(layer)` → la dep disparaît du `R`
- À la fin de ta chaîne, tu obtiens `Effect<A, never, never>` → seulement alors tu peux le `runPromise()`

C'est analogue au `?` de Rust pour les `Result<T, E>` (cf. [[Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result]]) : les erreurs vivent dans le type, et tu dois les éliminer explicitement.

## Exemple concret

**Avant Effect (TS classique)** :
```typescript
async function getUserOrders(id: string): Promise<Order[]> {
  const user = await db.findUser(id); // peut throw DbError
  if (!user) throw new NotFoundError();
  return await api.fetchOrders(user.id); // peut throw NetworkError, AuthError
}

// Quels errors peut-il throw ? Mystère. Au runtime tu découvres.
```

**Avec Effect** :
```typescript
const getUserOrders = (id: string): Effect<
  Order[],
  DbError | NotFoundError | NetworkError | AuthError,
  Db | HttpApi
> =>
  Effect.gen(function* () {
    const user = yield* db.findUser(id);
    if (!user) yield* Effect.fail(new NotFoundError());
    return yield* api.fetchOrders(user.id);
  });

// La signature te dit TOUT. L'IDE/compilateur t'oblige à gérer les 4 cas.
```

## Connexions

**Concepts liés** :
- [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]] *(le `R` se résout via Layers)*
- [[Concept - Un thunk est une fonction qui retarde l'évaluation]] *(un Effect est un thunk typé qui ne s'exécute qu'à `runPromise`)*
- [[Concept - En Rust l'absence et l'erreur sont des valeurs typées avec Option et Result]] *(même philosophie : erreurs dans le type, pas en throw)*

**Prérequis** :
- TS génériques de base
- Notion de Promise + try/catch — pour comprendre ce qu'Effect remplace

**S'oppose à / à comparer avec** :
- **`Promise<T>`** : ne dit rien des erreurs ni des deps
- **`Result<T, E>` (neverthrow, fp-ts)** : type les erreurs mais pas les deps, pas de concurrence/annulation
- **NestJS DI** : résolution runtime, peut crasher au démarrage

## Sources

- [[2026-04-25 - Effect-TS - pourquoi et pour qui]]

## MOC

[[MOC - Frontend]]
