---
created: 2026-04-26T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive
  comme opt-out
slug: >-
  les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out
excerpt: >-
  C'est l'**inversion** par rapport à Redux/Zustand/Jotai (où le state vit pour
  toujours par défaut), et ça résout en passant la moitié des problèmes de cache
  de TanStack Query (où il faut configurer `staleTime`, `cacheTime`, `gcTime` à
  la main).
oneLiner: >-
  Quand plus aucun composant ne consomme un atom, **Effect Atom le libère
  automatiquement** : ses ressources Effect sont fermées, ses finalizers
  exécutés. Pour persister un atom au-delà des démontages, on opt-out
  explicitement avec `Atom.keepAlive`.
related:
  - >-
    effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect
  - l-ownership-de-rust-remplace-garbage-collector-et-malloc-free
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - 2026-04-26-effect-atom-state-management-react-sur-effect-ts
  - frontend
backlinks:
  - 2026-04-26-effect-atom-state-management-react-sur-effect-ts
  - >-
    effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect
  - frontend
topics:
  - effect-ts
  - frontend
  - typescript
---

# Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out

## Idée en une phrase

> Quand plus aucun composant ne consomme un atom, **Effect Atom le libère automatiquement** : ses ressources Effect sont fermées, ses finalizers exécutés. Pour persister un atom au-delà des démontages, on opt-out explicitement avec `Atom.keepAlive`.

## Contexte / pourquoi ça compte

C'est l'**inversion** par rapport à Redux/Zustand/Jotai (où le state vit pour toujours par défaut), et ça résout en passant la moitié des problèmes de cache de TanStack Query (où il faut configurer `staleTime`, `cacheTime`, `gcTime` à la main).

L'idée : **un atom est un cache opt-in, pas opt-out**. Si tu navigues hors d'une page, les données de cette page sont libérées (avec leur connexion HTTP, leur Stream, leur écouteur). Si tu veux les garder, tu le dis explicitement.

C'est cohérent avec la philosophie Effect-TS : les ressources sont **scoped** et libérées proprement quand le scope finit. Effect Atom étend ce scope au cycle de vie React.

## Détails / mécanisme

### Comportement par défaut

```typescript
const dataAtom = Atom.make(
  Effect.gen(function* () {
    yield* Effect.log("création")
    yield* Effect.addFinalizer(() => Effect.log("libération"))
    return yield* Effect.tryPromise(() => fetch("/api/data"))
  })
)

// Composant A monte → "création" + fetch
// Composant A démonte (et plus aucun consommateur) → "libération", fetch annulé si en cours
```

### Opt-out : `keepAlive`

```typescript
const persistentAtom = Atom.make(0).pipe(Atom.keepAlive)
// Vit pour toute la durée du runtime, comme un atom Jotai classique.
```

Cas typiques où on veut `keepAlive` :
- État global (user logué, theme, locale…)
- Données partagées entre routes (panier d'achat)
- Cache souhaité même quand l'utilisateur sort puis revient

### Cas avec écouteur d'événement (cleanup en pratique)

```typescript
const scrollYAtom = Atom.make((get) => {
  const onScroll = () => get.setSelf(window.scrollY)
  window.addEventListener("scroll", onScroll)
  get.addFinalizer(() => window.removeEventListener("scroll", onScroll))
  return window.scrollY
})
```

Quand plus personne ne lit `scrollYAtom`, le `removeEventListener` s'exécute automatiquement. Pas de fuite mémoire silencieuse, pas de `useEffect` qu'on oublie de cleanup.

### Cas avec Stream

```typescript
const tickAtom = Atom.make(Stream.fromSchedule(Schedule.spaced(1000)))
// Le stream s'arrête automatiquement quand plus aucun consommateur, et reprend si un nouveau monte.
```

## Exemple concret

**Sans Effect Atom (TanStack Query)** :
```typescript
useQuery({
  queryKey: ['user', id],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000,    // 5 min
  gcTime: 10 * 60 * 1000,       // 10 min
})
// Tu paramètres deux durées en ms à la main pour gérer le cache.
// Si tu te trompes, fuite mémoire ou requêtes inutiles.
```

**Avec Effect Atom** :
```typescript
const userAtom = Atom.family((id: string) =>
  runtimeAtom.atom(
    Effect.gen(function* () {
      const users = yield* Users
      return yield* users.findById(id)
    })
  )
)
// Par défaut : libéré dès qu'aucun composant ne lit.
// Si tu veux garder en cache : .pipe(Atom.keepAlive)
```

Le mental model est plus simple : "tant qu'on lit, ça vit ; sinon, ça meurt".

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect" data-wiki-title="Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect" data-wiki-preview="Effect Atom propose **une seule primitive** — l'`Atom` — pour modéliser à la fois le state local, le state serveur, la DI et les effets asynchrones, le tout en s'appuyant sur le runtime Effect-TS. Une lib remplace **Jotai + TanStack Query +…">Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect</a> *(le contexte global)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ownership-de-rust-remplace-garbage-collector-et-malloc-free" data-wiki-title="Concept - L'ownership de Rust remplace garbage collector et malloc-free" data-wiki-preview="Chaque valeur a un seul propriétaire, libérée automatiquement à la fin de son scope — la mémoire est gérée **à la compilation**, sans garbage collector et sans `free()` manuel.">Concept - L'ownership de Rust remplace garbage collector et malloc-free</a> *(même intuition : ressources libérées à la fin du scope, vérifié par le système — Rust à la compil, Effect à la runtime via scopes)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(les closures Atom capturent — Effect Atom gère leur libération via scopes)*

**Prérequis** :
- Notion de finalizer / cleanup dans Effect-TS

**S'oppose à / à comparer avec** :
- **Redux / Zustand** : state global immortel par défaut, on n'y touche pas
- **Jotai** : atoms vivent à la racine du Provider, libérés seulement si on supprime le Provider
- **TanStack Query** : cache piloté par `staleTime`/`gcTime` en ms, fragile à régler

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-effect-atom-state-management-react-sur-effect-ts" data-wiki-title="Effect Atom — state management React sur Effect-TS" data-wiki-preview="1. **Effect Atom** est une lib de state management React (et Vue/Solid) construite sur Effect-TS, par **Tim Smart** (core contributor Effect). Encore en pré-1.0 (0.5.x), mais déjà utilisable. 2. L'API ressemble à **Jotai** (atoms réactifs,…">Effect Atom — state management React sur Effect-TS</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

