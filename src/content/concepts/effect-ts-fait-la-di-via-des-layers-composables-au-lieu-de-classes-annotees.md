---
created: 2026-04-25T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Effect-TS fait la DI via des Layers composables au lieu de classes
  annotées
slug: effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
excerpt: >-
  C'est probablement le **moment AHA** pour un dev NestJS qui découvre
  Effect-TS. La DI NestJS est familière mais a deux pièges connus : - Le graphe
  d'injection est validé **au démarrage de l'app**, pas par le compilateur → tu
  peux livrer en prod un graphe cassé. - Les modules circ
oneLiner: >-
  Là où NestJS résout les dépendances **au runtime** via des décorateurs
  (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via
  des `Layer<RIn, E, ROut>` qui décrivent comment construire un service à partir
  d'autres services.
related:
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - 2026-04-25-effect-ts-pourquoi-et-pour-qui
  - frontend
backlinks:
  - 2026-04-25-effect-ts-pourquoi-et-pour-qui
  - 2026-04-26-effect-atom-state-management-react-sur-effect-ts
  - atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react
  - clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
  - >-
    effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
  - backend-infra
  - frontend
topics:
  - effect-ts
  - frontend
  - typescript
---
## Idée en une phrase

> Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer<RIn, E, ROut>` qui décrivent comment construire un service à partir d'autres services.

## Contexte / pourquoi ça compte

C'est probablement le **moment AHA** pour un dev NestJS qui découvre Effect-TS. La DI NestJS est familière mais a deux pièges connus :
- Le graphe d'injection est validé **au démarrage de l'app**, pas par le compilateur → tu peux livrer en prod un graphe cassé.
- Les modules circulaires ou mal câblés se manifestent par des erreurs runtime obscures.

Effect-TS dit : la DI doit vivre dans le **système de types**. Si ton code compile, ton graphe DI est garanti correct.

## Détails / mécanisme

### Un Layer

```typescript
Layer<RIn, E, ROut>
//     │   │   │
//     │   │   └── ce que ce Layer FOURNIT (output)
//     │   └────── erreur possible à la construction
//     └────────── ce que ce Layer REQUIERT pour se construire (input)
```

Lecture : "un Layer qui fournit `ROut`, en consommant `RIn`, peut échouer avec `E` à la construction".

### Définir un service

```typescript
// 1. Le service est défini comme un "tag" (identifiant typé)
class HttpClient extends Context.Tag("HttpClient")<
  HttpClient,
  { fetch: (url: string) => Effect<Response, NetworkError, never> }
>() {}

// 2. Une implémentation est un Layer
const HttpClientLive = Layer.succeed(HttpClient, {
  fetch: (url) => Effect.tryPromise(() => fetch(url)),
});

// 3. Une autre impl pour les tests
const HttpClientTest = Layer.succeed(HttpClient, {
  fetch: (url) => Effect.succeed(mockResponse),
});
```

### Composer un graphe

```typescript
const AppLayer = Layer.merge(
  HttpClientLive,
  Layer.merge(DbLive, ConfigLive)
);

// AppLayer : Layer<never, never, HttpClient | Db | Config>
```

### Fournir au programme

```typescript
const program: Effect<Order[], …, HttpClient | Db | Config> = …;

const runnable = Effect.provide(program, AppLayer);
// runnable : Effect<Order[], …, never>  ← R = never, plus aucune dep manquante
```

### Comparaison NestJS

```typescript
// NestJS — runtime DI
@Module({
  imports: [HttpModule, DbModule],
  providers: [UserService],
})
class AppModule {}

// Si HttpModule oublié, crash au boot avec :
// "Nest can't resolve dependencies of UserService (?, DbService)"
```

```typescript
// Effect-TS — compile-time DI
const userServiceProgram: Effect<…, …, HttpClient | Db> = …;

// Si on oublie HttpClient dans le Layer fourni :
// → erreur de compilation TypeScript explicite
const main = Effect.provide(userServiceProgram, DbLive);
// Type error : Property 'HttpClient' is missing
```

## Exemple concret

Setup typique d'une petite app Effect-TS :

```typescript
// services
class Config extends Context.Tag("Config")<Config, { dbUrl: string }>() {}
class Db extends Context.Tag("Db")<Db, { query: (sql: string) => Effect<…> }>() {}

// layers
const ConfigLive = Layer.succeed(Config, { dbUrl: process.env.DATABASE_URL! });
const DbLive = Layer.effect(
  Db,
  Effect.gen(function* () {
    const config = yield* Config;
    const conn = yield* Effect.tryPromise(() => connect(config.dbUrl));
    return { query: (sql) => Effect.tryPromise(() => conn.query(sql)) };
  })
); // DbLive : Layer<Config, ConnectionError, Db>

// graphe complet
const AppLayer = Layer.provide(DbLive, ConfigLive);
// AppLayer : Layer<never, ConnectionError, Db>

// pour les tests, on swap juste la couche bas niveau
const AppLayerTest = Layer.provide(DbLive, ConfigTest);
```

L'**inversion** est élégante : `DbLive` n'a pas besoin de connaître la Config concrète, juste le tag. La Config est injectée au moment de composer le graphe — exactement comme l'injection de dépendances classique, mais **typée de bout en bout**.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(le `R` du Effect est ce que le Layer doit fournir)*

**Prérequis** :
- Comprendre `Effect<A, E, R>` (ses 3 paramètres)
- Familiarité avec un système de DI classique (NestJS, InversifyJS, …)

**S'oppose à / à comparer avec** :
- **NestJS DI** (décorateurs + reflect-metadata + runtime) : familier, mature, mais runtime
- **Manual DI** : passer les deps en argument à chaque fonction. Simple mais explose en taille
- **InversifyJS** : DI runtime générique, plus fragile encore que NestJS

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-effect-ts-pourquoi-et-pour-qui" data-wiki-title="Effect-TS — pourquoi et pour qui" data-wiki-preview="1. **Effect-TS** est une lib TypeScript inspirée de **ZIO (Scala)** qui modélise tout ce qui peut &quot;se passer&quot; dans un programme via un seul type : `Effect&lt;A, E, R&gt;` = &quot;calcule un `A`, peut échouer avec `E`, requiert `R` du contexte&quot;. 2. Ell…">Effect-TS — pourquoi et pour qui</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

