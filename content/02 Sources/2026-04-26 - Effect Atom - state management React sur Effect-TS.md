---
title: Effect Atom — state management React sur Effect-TS
url: https://www.effective.software/courses/effect-atom/introduction
author: Hemanta Sundaray (cours) · Tim Smart (lib)
digested: 2026-04-26
format: course
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/course
  - level/intermediate
---

# Effect Atom — state management React sur Effect-TS

## Pourquoi cette source

> Cours pratique de **Hemanta Sundaray** sur effective.software, qui propose un guide hands-on (~25 chapitres) pour utiliser **Effect Atom** comme système de state management React, en particulier pour le server state. La page d'intro elle-même est légère — j'ai complété avec la doc officielle et le repo GitHub de la lib.

> Note méthodo : je présente ici la lib Effect Atom et le contenu du cours. La page d'intro consultée ne donne pas de code/détails ; le cours détaille tout cela dans les chapitres suivants (les premiers chapitres sont gratuits, les derniers sur SSR / optimistic updates / tests sont payants).

## Résumé en 5 lignes

1. **Effect Atom** est une lib de state management React (et Vue/Solid) construite sur Effect-TS, par **Tim Smart** (core contributor Effect). Encore en pré-1.0 (0.5.x), mais déjà utilisable.
2. L'API ressemble à **Jotai** (atoms réactifs, hooks `useAtomValue` / `useAtomSet` / `useAtom`), mais chaque atom peut **encapsuler un Effect** — donc tu hérites des erreurs typées, retries, annulation, services et Layers d'Effect-TS.
3. Innovation côté lifecycle : un atom **se libère automatiquement** dès que plus aucun composant ne le consomme (avec `Atom.keepAlive` pour opt-out). Ça remplace les complications de cache de TanStack Query.
4. Cas d'usage central : **server state** — fetch, cache, retry, mutations, invalidation, Suspense, infinite scroll, optimistic updates, SSR.
5. Mental model : tes atoms sont des **descriptions d'Effects** branchées dans le cycle de vie React. Si tu utilises déjà Effect-TS sur ton backend, Effect Atom = même langage côté front.

---

## 1. Le cours en bref

**Plateforme** : [effective.software](https://www.effective.software/) — plateforme de cours techniques par/pour la communauté Effect.

**Auteur** : **Hemanta Sundaray** (dev focalisé sur Effect-TS).

**Format** : 25 chapitres, projet pratique fil rouge, server state en React.

**Plan (extrait)** :
- Chapitres 1-19, 24-25 — gratuits
  - Concepts : state, Atom, registry
  - Async + cache + Suspense
  - Mutations, refresh, paramétrage URL, données obsolètes
- Chapitres 20-23 — payants
  - Optimistic updates, infinite scroll, SSR, tests

→ [Page d'intro du cours](https://www.effective.software/courses/effect-atom/introduction)

---

## 2. Effect Atom — c'est quoi et pourquoi

### Le problème

Sur une app React moderne, tu jongles avec :
- **Server state** : données distantes (API). TanStack Query (ex React Query) règne ici.
- **Client state global** : Zustand, Jotai, Redux Toolkit
- **DI / services** : pratiquement personne — on importe directement, ou on bricole avec Context
- **Async + retry + cancellation** : Promise + AbortController + lib retry, pas composable
- **Validation** : Zod / Yup à part

Cinq libs, cinq mental models, peu de cohérence.

### La proposition d'Effect Atom

**Une primitive** : `Atom`. Et à l'intérieur, n'importe quoi (valeur, Effect, Stream, Service). Le tout dans le même runtime Effect, donc :
- Erreurs typées (cf. [[Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature]])
- Annulation propagée
- Layers Effect-TS pour la DI (cf. [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]])
- Rétention/cleanup automatique
- Composition via `pipe`

→ [[Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect]]

---

## 3. API de base — exemples

### Atom de valeur simple

```typescript
import { Atom, useAtomValue, useAtomSet } from "@effect-atom/atom-react"

const countAtom = Atom.make(0).pipe(Atom.keepAlive) // garde la valeur entre démontages

function Counter() {
  const count = useAtomValue(countAtom)
  return <h1>{count}</h1>
}

function CounterButton() {
  const setCount = useAtomSet(countAtom)
  return <button onClick={() => setCount(c => c + 1)}>+</button>
}
```

API quasi-identique à Jotai — la familiarité est volontaire.

### Atom basé sur un Effect

```typescript
const countAtom = Atom.make(Effect.succeed(0))

const resultAtom = Atom.make(
  Effect.fnUntraced(function* (get: Atom.Context) {
    const count = yield* get.result(countAtom) // récupère la valeur d'un Atom dans un Effect
    return count + 1
  })
)
```

Tu compose des Effects à la place de gérer manuellement async/loading/error.

### Atom + Service (DI compile-time)

```typescript
class Users extends Effect.Service<Users>()("app/Users", {
  effect: Effect.gen(function* () {
    return {
      getAll: Effect.succeed([{ id: "1", name: "Alice" }])
    } as const
  })
})

const runtimeAtom = Atom.runtime(Users.Default)

const usersAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    const users = yield* Users
    return yield* users.getAll
  })
)
```

→ [[Concept - Atom.runtime branche les Layers Effect-TS dans le state management React]]

### Atom Family (pour collections)

```typescript
const userAtom = Atom.family((id: string) =>
  runtimeAtom.atom(
    Effect.gen(function* () {
      const users = yield* Users
      return yield* users.findById(id)
    })
  )
)
// utilisation : useAtomValue(userAtom("42"))
```

L'équivalent du `useQuery({ queryKey: ['user', id] })` de TanStack Query, mais typé et intégré.

### Atom.fn — pour les mutations

```typescript
const logAtom = Atom.fn(
  Effect.fnUntraced(function* (arg: number) {
    yield* Effect.log("got arg", arg)
  })
)

function LogComponent() {
  const logNumber = useAtomSet(logAtom)
  return <button onClick={() => logNumber(42)}>Log 42</button>
}
```

C'est l'équivalent de `useMutation` — un atom qui prend des args et retourne un Effect.

### Atoms intégrés (URL, localStorage, Stream)

```typescript
// query string
const numberParamAtom = Atom.searchParam("page", { schema: Schema.NumberFromString })

// localStorage
const flagAtom = Atom.kvs({
  runtime,
  key: "flag",
  schema: Schema.Boolean,
  defaultValue: () => false
})

// Stream
const tickAtom = Atom.make(Stream.fromSchedule(Schedule.spaced(1000)))
```

L'idée : tout effet de bord typique d'une app web a un atom dédié, branché sur Effect.

---

## 4. Le lifecycle qui change tout

Par défaut, **un atom est libéré dès qu'aucun composant ne le consomme**. Ses ressources Effect sont fermées (finalizers exécutés). C'est l'inverse de Redux/Zustand où le state vit pour toujours.

```typescript
// par défaut : libéré au démontage
const tempAtom = Atom.make(0)

// opt-out : maintenu en vie même sans consommateur
const persistentAtom = Atom.make(0).pipe(Atom.keepAlive)
```

→ [[Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out]]

---

## 5. Comparaison rapide

| | Effect Atom | Jotai | TanStack Query | Zustand |
|---|---|---|---|---|
| Atomic state | ✅ | ✅ | ❌ | ⚠️ (slices) |
| Server state | ✅ (via Effect) | ⚠️ (libs annexes) | ✅ | ❌ |
| DI typée | ✅ (Layers) | ❌ | ❌ | ❌ |
| Erreurs typées | ✅ | ❌ | ⚠️ (any) | ❌ |
| Annulation | ✅ (auto via Effect) | ❌ | ⚠️ (manuel) | ❌ |
| Cleanup auto | ✅ | ⚠️ | ⚠️ | ❌ |
| Maturité | 🟡 (0.5.x) | ✅ | ✅ | ✅ |
| Apprentissage | 🔴 (faut Effect) | 🟢 | 🟡 | 🟢 |

Verdict honnête : si tu n'utilises pas Effect-TS ailleurs, Effect Atom est un mauvais point d'entrée — la courbe d'apprentissage est sévère et tu rateras 80% de la valeur. Si tu **as déjà adopté Effect-TS**, Effect Atom est l'outil cohérent côté front.

---

## Citations brutes

> *"effect-atom is a reactive state management library for Effect."* — README GitHub.

> *"Atoms automatically clean up when no longer used."* — doc officielle.

---

## À explorer ensuite

- **Suspense + Effect Atom** : comment les atoms basés sur Effect plug nativement dans `<Suspense>` et `<ErrorBoundary>` (chapitres 6-7 du cours)
- **Reactivity keys** : invalidation déclarative d'atoms après mutation (équivalent du `queryClient.invalidateQueries` de TanStack)
- **`@effect/rpc` + Effect Atom** : pour des appels RPC type-safe end-to-end
- **Migration progressive** : intégrer Effect Atom dans un projet React Query existant (atom par atom)
- **Tests** : la doc/cours montrent comment override les Layers en test (cf. la même logique que Effect-TS classique)

## MOC associé

[[MOC - Frontend]]
