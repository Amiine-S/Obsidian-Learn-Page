---
created: 2026-04-26
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - Atom.runtime branche les Layers Effect-TS dans le state management React

## Idée en une phrase

> `Atom.runtime(layer)` est le pont qui prend un **`Layer<…>` Effect-TS** et le transforme en **runtime accessible depuis React** — chaque atom créé via ce runtime obtient automatiquement les services du Layer en injection.

## Contexte / pourquoi ça compte

C'est la mécanique qui fait passer la DI typée d'Effect-TS du backend au frontend. Sans `Atom.runtime`, tu aurais des atoms qui peuvent contenir des Effects, mais pas de moyen propre d'injecter des dépendances. Avec, tu as un **graphe DI compile-time** depuis ton composant React jusqu'à ton service.

C'est probablement le concept le plus subtil d'Effect Atom — et la raison pour laquelle l'ancrage avec Effect-TS est nécessaire : sans comprendre Layer, ce mot ne veut rien dire.

## Détails / mécanisme

### La signature

```typescript
Atom.runtime<R, E>(layer: Layer<R, E, never>): RuntimeAtom<R>
```

Un `RuntimeAtom<R>` est un objet qui sait construire des atoms ayant accès aux services `R` fournis par le Layer.

### L'usage

```typescript
// 1. Définir un Layer Effect-TS classique
class HttpClient extends Effect.Service<HttpClient>()("app/HttpClient", {
  effect: Effect.gen(function* () {
    return {
      fetch: (url: string) => Effect.tryPromise(() => fetch(url))
    } as const
  })
})

// 2. Brancher le Layer sur un runtime atom
const runtimeAtom = Atom.runtime(HttpClient.Default)

// 3. Créer des atoms qui PEUVENT utiliser le service
const productsAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    const http = yield* HttpClient   // ← injection compile-time
    const res = yield* http.fetch("/api/products")
    return yield* Effect.tryPromise(() => res.json())
  })
)
```

### Composer plusieurs Layers

Comme tout Layer Effect-TS, on les compose :

```typescript
const AppLayer = Layer.merge(
  HttpClient.Default,
  Layer.merge(Db.Default, Config.Default)
)

const runtimeAtom = Atom.runtime(AppLayer)
// Tous les atoms créés via runtimeAtom.atom(…) ont accès à HttpClient | Db | Config
```

### Test : swap des Layers

Pour les tests, c'est pareil que la DI Effect-TS classique :

```typescript
const TestLayer = Layer.merge(
  HttpClientMock,  // version mockée
  Layer.merge(Db.Default, Config.Default)
)
const runtimeAtom = Atom.runtime(TestLayer)
// même atoms, dépendances substituées
```

Pas de `jest.mock(...)`, pas de monkey-patching. Le graphe est typé.

## Exemple concret

Mise en parallèle avec une approche NestJS+React Query classique pour bien voir la différence :

**Approche classique** :
```typescript
// 1. Le service est instancié globalement (ou via React Context)
const apiService = new ApiService(process.env.API_URL!)

// 2. Une fonction de fetch qui ferme sur le service
const fetchProducts = () => apiService.getProducts()

// 3. React Query
const useProducts = () => useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
})

// 4. Mocker en test = mocker apiService globalement (cassant)
```

**Avec Atom.runtime** :
```typescript
// La dep ApiService est dans le TYPE de l'atom
const productsAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    const api = yield* ApiService
    return yield* api.getProducts()
  })
)
// productsAtom : Atom<Result<Product[], FetchError>, never, never>  ← R = never après runtime
// Pour tester : on swap le Layer dans le runtimeAtom, c'est tout
```

L'inversion de dépendance est **dans le système de types**, pas dans le câblage runtime.

## Connexions

**Concepts liés** :
- [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]] *(c'est le mécanisme Layer côté Effect que Atom.runtime expose)*
- [[Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect]] *(le big picture)*

**Prérequis** :
- Comprendre les Layers Effect-TS (sinon `Atom.runtime` est de la magie)

**S'oppose à / à comparer avec** :
- **React Context + custom hooks** : DI runtime classique en React, pas typée, rebranchements manuels
- **Singleton import** (`import { apiService } from './services'`) : le plus simple, mais zéro testabilité
- **NestJS DI** : équivalent côté backend, runtime, décorateurs

## Sources

- [[2026-04-26 - Effect Atom - state management React sur Effect-TS]]

## MOC

[[MOC - Frontend]]
