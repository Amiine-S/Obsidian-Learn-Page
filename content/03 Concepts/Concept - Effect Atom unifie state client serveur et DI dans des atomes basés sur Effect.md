---
created: 2026-04-26
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect

## Idée en une phrase

> Effect Atom propose **une seule primitive** — l'`Atom` — pour modéliser à la fois le state local, le state serveur, la DI et les effets asynchrones, le tout en s'appuyant sur le runtime Effect-TS. Une lib remplace **Jotai + TanStack Query + Zustand + Context** dans un projet qui a déjà adopté Effect.

## Contexte / pourquoi ça compte

Sur une app React 2025+, on jongle typiquement avec :
- **TanStack Query** pour le server state (fetch, cache, retry)
- **Jotai/Zustand** pour le state global
- **Context API** pour la DI
- **Promise + AbortController** pour la gestion async
- **Zod** pour la validation

Cinq libs, cinq mental models, peu de cohérence — et aucune ne propage les erreurs typées ou ne gère la concurrence structurée. Effect Atom dit : si on a déjà Effect-TS sur le backend, étendons le même runtime au front, et faisons-en la primitive de state.

## Détails / mécanisme

### Une primitive, plusieurs formes

Un `Atom` est un conteneur réactif qui peut contenir :

- **Une valeur** : `Atom.make(0)` — équivalent d'un atom Jotai
- **Un Effect** : `Atom.make(Effect.succeed(...))` — état asynchrone avec erreurs typées
- **Un Stream** : `Atom.make(Stream.from...)` — état qui évolue sur un flux
- **Un dérivé** : `Atom.make((get) => get(otherAtom) * 2)` — état calculé
- **Une fonction** : `Atom.fn(effect)` — équivalent d'un `useMutation`
- **Une famille** : `Atom.family((key) => ...)` — atoms paramétrés par clé (cache de queries)

### Hooks React (3, c'est tout)

```typescript
useAtomValue(atom)   // lecture — re-render à chaque update
useAtomSet(atom)     // setter / déclencheur (mutations, fonctions)
useAtom(atom)        // [valeur, setter] — comme useState
```

### Bénéfices hérités d'Effect-TS

Comme **chaque atom basé sur un Effect** hérite du runtime Effect, tu obtiens **automatiquement** :
- **Erreurs typées** dans la signature (cf. [[Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature]])
- **DI** via Layers (cf. [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]])
- **Annulation** propagée — démonter un composant annule la requête en cours
- **Retry / timeout / race** built-in
- **Composition** via `pipe`

## Exemple concret

Un cas typique : afficher des users avec gestion d'erreur, retry, et cleanup auto.

**Avec TanStack Query + Zustand + Zod (3 libs)** :
```typescript
// définir le service quelque part avec axios + Zod
// définir un store Zustand pour le state global
// définir un useQuery pour la fetch
// gérer manuellement les erreurs typées (pas réussi : c'est `unknown`)
```

**Avec Effect Atom** :
```typescript
class Users extends Effect.Service<Users>()("app/Users", {
  effect: Effect.gen(function* () {
    return { getAll: Effect.succeed([...]) } as const
  })
})

const runtimeAtom = Atom.runtime(Users.Default)
const usersAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    const users = yield* Users
    return yield* users.getAll
  })
)

function UsersList() {
  const users = useAtomValue(usersAtom) // erreurs typées + Suspense ready
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

**Une seule lib**, et la signature te dit ce qui peut casser, ce dont ça dépend, et ça s'auto-cancel quand tu démontes le composant.

## Connexions

**Concepts liés** :
- [[Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature]] *(le moteur sous-jacent)*
- [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]] *(la DI qu'Effect Atom expose à React)*
- [[Concept - Atom.runtime branche les Layers Effect-TS dans le state management React]] *(comment on connecte le runtime au front)*
- [[Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out]] *(le lifecycle qui change la donne)*
- [[Concept - Un thunk est une fonction qui retarde l'évaluation]] *(un Atom basé sur Effect est un thunk typé branché dans React)*

**Prérequis** :
- Connaître Effect-TS au moins au niveau "à quoi ça sert" — sans ça, Effect Atom est cryptique
- Familiarité avec un atom-based state manager (Jotai/Recoil) aide

**S'oppose à / à comparer avec** :
- **Jotai** : même API atomique, mais sans Effect — tu retombes vite sur React Query pour le serveur
- **TanStack Query** : excellent pour le serveur seul, ne couvre pas le state client ni la DI
- **Zustand** : très simple mais ne gère pas l'async first-class

## Sources

- [[2026-04-26 - Effect Atom - state management React sur Effect-TS]]

## MOC

[[MOC - Frontend]]
