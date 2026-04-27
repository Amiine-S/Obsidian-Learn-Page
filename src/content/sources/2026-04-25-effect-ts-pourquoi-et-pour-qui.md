---
title: Effect-TS — pourquoi et pour qui
url: 'https://effect.website/'
author: Claude (synthèse) + Effect-TS team
digested: '2026-04-25T21:51:27.340Z'
format: doc
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/intermediate
slug: 2026-04-25-effect-ts-pourquoi-et-pour-qui
excerpt: >-
  1. **Effect-TS** est une lib TypeScript inspirée de **ZIO (Scala)** qui
  modélise tout ce qui peut "se passer" dans un programme via un seul type :
  `Effect<A, E, R>` = "calcule un `A`, peut échouer avec `E`, requiert `R` du
  contexte". 2. Elle remplace : exceptions silencieuses → *
related:
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - frontend
backlinks:
  - 2026-04-26-exception-handling-patterns-en-typescript
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
topics:
  - effect-ts
  - frontend
  - typescript
---
## Pourquoi cette source

> **Effect-TS** est probablement la plus grosse rupture conceptuelle dans l'écosystème TS depuis Promises. Elle prétend remplacer **try/catch + Promise + DI framework + RxJS + Zod + retry/timeout libs** par UNE seule abstraction. Vaut le coup d'au moins comprendre le pitch, surtout quand on vient de NestJS.

## Résumé en 5 lignes

1. **Effect-TS** est une lib TypeScript inspirée de **ZIO (Scala)** qui modélise tout ce qui peut "se passer" dans un programme via un seul type : `Effect<A, E, R>` = "calcule un `A`, peut échouer avec `E`, requiert `R` du contexte".
2. Elle remplace : exceptions silencieuses → **erreurs typées** ; Promises non-annulables → **fibers structurées** ; DI via décorateurs Nest → **Layers composables** ; validation Zod + parse → **Schema unifié** ; logique business + observabilité dispersées → **abstraction unifiée**.
3. La promesse : ton programme entier est une description (un thunk géant typé), pas une exécution. Tu choisis quand et comment le lancer (`runPromise`, `runFork`, `runSync`).
4. Le coût : **courbe d'apprentissage abrupte** (faut comprendre les types, le pipe operator, les Effects vs valeurs), et un écosystème naissant (peu de libs Effect-native pour l'instant).
5. Pour qui : surtout ceux qui ont mal aux **erreurs invisibles**, à la **DI fragile** (NestJS qui crash en runtime parce qu'un module n'est pas importé), aux **abandons de tâches asynchrones**. Si Promise + try/catch te suffit largement, Effect-TS est probablement *overkill*.

---

## 1. Le constat de départ — ce que TS ne sait PAS faire bien

TypeScript a un système de types puissant pour les **valeurs**, mais quasi rien pour les **effets** (= ce qui se passe quand on exécute du code).

### a. Les exceptions ne sont pas typées

```typescript
async function fetchUser(id: string): Promise<User> {
  // peut throw NetworkError, AuthError, NotFoundError…
  // … rien dans la signature ne le dit
}

const user = await fetchUser('42'); // 💥 si throw, runtime error
```

`strictNullChecks` t'oblige à gérer les `null`. Mais **rien ne t'oblige à gérer les exceptions**. C'est l'équivalent en TS du `catch (e: any)` de Java — sauf qu'en TS, c'est encore pire parce qu'il n'y a même pas de "checked exceptions".

### b. Les Promises ne sont pas annulables

```typescript
const slow = fetch('/slow-endpoint');
// Comment l'annuler si l'utilisateur change de page ?
// AbortController, oui, mais c'est manuel, pas typé, pas composable.
```

### c. La DI NestJS est fragile

```typescript
@Injectable()
class UserService {
  constructor(private db: DbService) {}  // si DbService n'est pas importé,
}                                         // ça crash en runtime, pas à la compil
```

NestJS vérifie le graphe d'injection **au démarrage**, pas dans le compilateur. Tu peux livrer en prod un graphe cassé.

### d. Pas de retry/timeout/concurrence first-class

`Promise.all`, `Promise.race`, `Promise.allSettled` — c'est tout. Pour faire un vrai pattern circuit-breaker / retry exponentiel / structured concurrency, tu installes 5 libs (p-retry, p-queue, async-retry…) qui ne se composent pas entre elles.

---

## 2. La proposition d'Effect-TS

**Une abstraction unique** : `Effect<A, E, R>`.

```typescript
import { Effect } from 'effect';

const fetchUser = (id: string): Effect.Effect<User, NetworkError | NotFoundError, HttpClient> => {
  // ...
};
```

À lire : "ce calcul produit un `User`, peut échouer avec `NetworkError` OU `NotFoundError`, et a besoin d'un `HttpClient` dans son contexte".

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a>

### Ce que tu gagnes immédiatement

- **Erreurs typées** : la signature dit ce qui peut casser. Tu DOIS gérer chaque branche, ou propager.
- **DI typée** : la signature dit ce dont le code a besoin. Le compilateur vérifie le graphe.
- **Composabilité** : tu combines les Effects via `pipe()`. Ça donne une lecture "pipeline" très lisible.
- **Annulation propre** : si tu lances un Effect avec `runFork`, tu peux l'annuler — l'annulation se propage dans toute la chaîne (cleanup, finalizers).
- **Concurrence structurée** : `Effect.all([a, b, c], { concurrency: 'unbounded' })`, retries built-in, races qui annulent les perdants…

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a>

### Le mental shift

Tu **n'écris plus** du code qui s'exécute. Tu **décris** un programme via des Effects, et tu le lances explicitement à la fin :

```typescript
const program = Effect.gen(function* () {
  const user = yield* fetchUser('42');
  const orders = yield* fetchOrders(user.id);
  return { user, orders };
});

// Rien ne s'est encore exécuté.
const result = await Effect.runPromise(program);
// Là, oui.
```

C'est exactement le pattern **thunk poussé à l'extrême**. Tu construis une description de programme, puis tu décides quand/comment l'évaluer. Cf. → <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a>.

---

## 3. Comparaison NestJS ↔ Effect-TS

| Aspect | NestJS | Effect-TS |
|---|---|---|
| **DI** | Décorateurs (`@Injectable`), résolution runtime | `Layer<R, E, ROut>`, résolution compile-time |
| **Erreurs** | `throw` + filters globaux | `Effect<A, E, R>`, erreurs dans le type |
| **Async** | Promise, `async/await` | Effect, fibers, annulables |
| **Validation** | class-validator + DTOs | Schema (équivalent Zod intégré) |
| **Tests** | `Test.createTestingModule()`, mocks | Layer overrides, plus simple |
| **Modules** | `@Module()`, imports explicites | Composition de Layers via `pipe` |
| **Maturité** | Énorme écosystème, prod-ready depuis 2017 | En forte progression, prod 3.x depuis 2024 |

**Verdict honnête** : NestJS gagne sur la maturité, l'écosystème, l'intégration Express/Fastify/microservices. Effect-TS gagne sur la **safety** (compile-time tout) et la **composition fonctionnelle**. Les deux peuvent **cohabiter** — beaucoup d'équipes mettent Effect-TS sur la couche métier dans une app NestJS.

---

## 4. Quand l'utiliser, quand l'éviter

### Bons cas d'usage

- App backend complexe avec beaucoup d'erreurs métier différenciées (commerce, fintech, audit)
- Code data-pipeline avec retries/timeouts/concurrence à orchestrer
- Lib réutilisable où tu veux **typer** les erreurs pour les consommateurs
- Monorepo où tu veux pousser la safety à fond

### Mauvais cas d'usage

- Petite API CRUD : trop de cérémonie pour le gain
- Équipe junior, pas de bandwidth pour la formation : la courbe est sévère
- Lib JS classique, exposée à des consommateurs non-Effect : tu trahis l'API

---

## Citations brutes

> *"Effect is a TypeScript library that helps developers easily create complex, synchronous, and asynchronous programs."* — site officiel.

> *"You can think of Effect as a value that **describes** a program. The program isn't executed until you tell Effect to run it."* — docs Effect-TS.

---

## À explorer ensuite

- **`Effect.gen`** vs `pipe()` — les deux styles d'écriture
- **Schema** — l'alternative à Zod, intégrée à Effect
- **Layer** en détail — comment construire un graphe DI
- **Fibers** — la concurrence structurée
- **Migration progressive** : intégrer Effect dans un projet NestJS existant

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

