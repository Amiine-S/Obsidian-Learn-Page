---
created: 2026-04-26T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Effect Atom unifie state client serveur et DI dans des atomes basés
  sur Effect
slug: effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect
excerpt: >-
  Sur une app React 2025+, on jongle typiquement avec : - **TanStack Query**
  pour le server state (fetch, cache, retry) - **Jotai/Zustand** pour le state
  global - **Context API** pour la DI - **Promise + AbortController** pour la
  gestion async - **Zod** pour la validation
oneLiner: >-
  Effect Atom propose **une seule primitive** — l'`Atom` — pour modéliser à la
  fois le state local, le state serveur, la DI et les effets asynchrones, le
  tout en s'appuyant sur le runtime Effect-TS. Une lib remplace **Jotai +
  TanStack Query + Zustand + Context** dans un projet qui a déjà adopté Effect.
related:
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react
  - >-
    les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - 2026-04-26-effect-atom-state-management-react-sur-effect-ts
  - frontend
backlinks:
  - 2026-04-26-effect-atom-state-management-react-sur-effect-ts
  - atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react
  - >-
    les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out
  - frontend
topics:
  - backend
  - devops
  - effect-ts
  - frontend
  - typescript
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
- **Erreurs typées** dans la signature (cf. <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a>)
- **DI** via Layers (cf. <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a>)
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
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(le moteur sous-jacent)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a> *(la DI qu'Effect Atom expose à React)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react" data-wiki-title="Concept - Atom.runtime branche les Layers Effect-TS dans le state management React" data-wiki-preview="`Atom.runtime(layer)` est le pont qui prend un **`Layer&lt;…&gt;` Effect-TS** et le transforme en **runtime accessible depuis React** — chaque atom créé via ce runtime obtient automatiquement les services du Layer en injection.">Concept - Atom.runtime branche les Layers Effect-TS dans le state management React</a> *(comment on connecte le runtime au front)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out" data-wiki-title="Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out" data-wiki-preview="Quand plus aucun composant ne consomme un atom, **Effect Atom le libère automatiquement** : ses ressources Effect sont fermées, ses finalizers exécutés. Pour persister un atom au-delà des démontages, on opt-out explicitement avec `Atom.keep…">Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out</a> *(le lifecycle qui change la donne)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a> *(un Atom basé sur Effect est un thunk typé branché dans React)*

**Prérequis** :
- Connaître Effect-TS au moins au niveau "à quoi ça sert" — sans ça, Effect Atom est cryptique
- Familiarité avec un atom-based state manager (Jotai/Recoil) aide

**S'oppose à / à comparer avec** :
- **Jotai** : même API atomique, mais sans Effect — tu retombes vite sur React Query pour le serveur
- **TanStack Query** : excellent pour le serveur seul, ne couvre pas le state client ni la DI
- **Zustand** : très simple mais ne gère pas l'async first-class

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-effect-atom-state-management-react-sur-effect-ts" data-wiki-title="Effect Atom — state management React sur Effect-TS" data-wiki-preview="1. **Effect Atom** est une lib de state management React (et Vue/Solid) construite sur Effect-TS, par **Tim Smart** (core contributor Effect). Encore en pré-1.0 (0.5.x), mais déjà utilisable. 2. L'API ressemble à **Jotai** (atoms réactifs,…">Effect Atom — state management React sur Effect-TS</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

