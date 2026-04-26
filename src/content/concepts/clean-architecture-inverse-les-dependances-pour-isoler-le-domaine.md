---
created: 2026-04-26T00:00:00.000Z
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
title: Concept - Clean Architecture inverse les dépendances pour isoler le domaine
slug: clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
excerpt: >-
  C'est l'**idée centrale** à retenir de toute l'architecture Bob, hexagonale,
  ports & adapters, onion architecture. Toutes ces approches partagent le même
  cœur : **isoler le métier des choix techniques**, pour que : - Le métier soit
  testable sans frameworks - Tu puisses changer de
oneLiner: >-
  La Clean Architecture (Uncle Bob) repose sur **une seule règle structurante**
  — la **règle de dépendance** : les couches externes (frameworks, DB, UI)
  **dépendent** des couches internes (logique métier, entités), **jamais
  l'inverse** — ce qui rend le domaine indépendant de la technologie.
related:
  - l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
  - atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react
  - 2026-04-26-clean-architecture-hybride-sans-over-engineering
  - architecture-fondamentaux
backlinks:
  - 2026-04-26-clean-architecture-hybride-sans-over-engineering
  - l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
  - architecture-fondamentaux
---

# Concept - Clean Architecture inverse les dépendances pour isoler le domaine

## Idée en une phrase

> La Clean Architecture (Uncle Bob) repose sur **une seule règle structurante** — la **règle de dépendance** : les couches externes (frameworks, DB, UI) **dépendent** des couches internes (logique métier, entités), **jamais l'inverse** — ce qui rend le domaine indépendant de la technologie.

## Contexte / pourquoi ça compte

C'est l'**idée centrale** à retenir de toute l'architecture Bob, hexagonale, ports & adapters, onion architecture. Toutes ces approches partagent le même cœur : **isoler le métier des choix techniques**, pour que :
- Le métier soit testable sans frameworks
- Tu puisses changer de DB / framework sans réécrire le métier
- L'équipe métier (BAs, domaine experts) puisse lire et critiquer le code métier sans connaître Express

C'est aussi **le seul élément qu'il vaut la peine de garder** quand on rejette le côté cérémoniel de la Clean Architecture stricte.

## Détails / mécanisme

### La règle, formellement

```
Entities  ←  Use Cases  ←  Interface Adapters  ←  Frameworks & Drivers
   (Couche la plus interne)              (Couche la plus externe)
```

Les **flèches de dépendance** ne pointent que vers la gauche (vers l'intérieur). Concrètement :
- `Entities` n'importe **rien** de l'extérieur (pas Express, pas Drizzle, pas même `axios`)
- `Use Cases` peut importer `Entities`, mais pas Express ni Drizzle
- `Frameworks` peut importer tout le reste

### Pourquoi "inversion de dépendance" ?

Parce que l'idée naturelle d'un dev junior, c'est :
```
Use Case → DB Repository (concret) → DB driver
```

→ ton Use Case dépend du Repository, qui dépend de Postgres. Si tu changes de DB, tu dois changer le Use Case.

L'inversion :
```
Use Case → IUserRepository (interface définie dans le domaine)
                    ↑
                    │ implémente
                    │
       PgUserRepository (dans la couche Frameworks)
```

→ Le Use Case dépend d'une **interface** qu'**il définit lui-même** (ou la couche application). C'est l'**Adapter** Postgres qui dépend de l'interface, pas l'inverse. **La flèche s'est retournée.**

### Le principe **DIP** de SOLID

C'est exactement le **Dependency Inversion Principle** de Robert Martin :

> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

La Clean Architecture est l'**application de DIP au niveau de l'architecture entière**, pas juste au niveau d'une classe.

### Conséquences pratiques

1. **Tests sans mock complexe** : tu testes `Entities` et `Use Cases` avec des fakes en mémoire, sans démarrer Postgres
2. **Refactor de techno isolé** : changer Express en Fastify ne touche que la couche Frameworks
3. **Compilation rapide** : la couche métier ne change pas quand tu update Drizzle
4. **Lisibilité** : un nouveau dev peut comprendre le métier sans connaître ta stack

### Le piège

Inverser la dépendance **a un coût** : il faut écrire l'interface (port), le mapper, l'adapter, et brancher le tout. Sur un domaine simple ou un projet court, ce coût peut **dépasser le bénéfice**.

C'est pourquoi la Clean stricte est sur-vendue : l'idée d'inversion est précieuse, **l'application orthodoxe (4 couches systématiques) est souvent excessive**.

## Exemple concret

**Sans inversion** (couplage direct) :

```typescript
// application/createUser.ts
import { db } from "../db/postgres" // ← dépendance directe

export async function createUser(email: string) {
  if (!email.includes("@")) throw new Error("invalid")
  return db.query("INSERT INTO users (email) VALUES ($1) RETURNING *", [email])
}
```

Pour tester `createUser`, tu dois soit démarrer Postgres, soit mocker `db` via un magic patch (`jest.mock`). Tu ne peux pas changer de DB sans toucher à ce fichier.

**Avec inversion** :

```typescript
// domain/UserRepository.ts (port)
export interface UserRepository {
  create(email: string): Promise<User>
}

// application/createUser.ts (Use Case)
export const createUser = (repo: UserRepository) => async (email: string) => {
  if (!email.includes("@")) throw new Error("invalid")
  return repo.create(email)
}

// infrastructure/PgUserRepository.ts (adapter)
import { db } from "../db/postgres"
export const PgUserRepository: UserRepository = {
  create: (email) => db.query(...).then(r => r.rows[0])
}

// usage
const handler = createUser(PgUserRepository)

// test
const handler = createUser({ create: async () => ({ id: "1", email: "x@y.z" }) })
```

`createUser` ne sait rien de Postgres. Il dépend uniquement de **l'interface qu'il définit**. C'est l'inversion.

### En Effect-TS

```typescript
// domain
class UserRepository extends Effect.Service<UserRepository>()("UserRepository", {
  effect: Effect.fail("must be provided") // pas d'impl par défaut
}) {}

const createUser = (email: string) => Effect.gen(function* () {
  if (!email.includes("@")) yield* Effect.fail("invalid")
  const repo = yield* UserRepository
  return yield* repo.create(email)
})

// L'inversion est dans le système de types : `createUser` requiert UserRepository (R)
// L'impl Postgres fournit le Layer correspondant (cf. autres concepts)
```

L'inversion est **gratuite** structurellement : tu n'écris pas plus de code, le système de types fait le travail.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie" data-wiki-title="Concept - L'over-engineering vient de couches sans valeur métier qui les justifie" data-wiki-preview="L'**over-engineering architectural** se reconnaît à un signe : une couche, une interface, un DTO, un mapper qui **n'isole rien de réel** parce qu'il n'y a qu'une seule implémentation, jamais de variation, et que personne ne traverse cette f…">Concept - L'over-engineering vient de couches sans valeur métier qui les justifie</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin" data-wiki-title="Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin" data-wiki-preview="Une approche pragmatique de la Clean Architecture commence par **2 couches** (`domain` / `infrastructure`) et n'introduit une 3e ou 4e couche **que face à un signe concret de douleur** — et non par anticipation — ce qui maximise la valeur t…">Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/atomruntime-branche-les-layers-effect-ts-dans-le-state-management-react" data-wiki-title="Concept - Atom.runtime branche les Layers Effect-TS dans le state management React" data-wiki-preview="`Atom.runtime(layer)` est le pont qui prend un **`Layer&lt;…&gt;` Effect-TS** et le transforme en **runtime accessible depuis React** — chaque atom créé via ce runtime obtient automatiquement les services du Layer en injection.">Concept - Atom.runtime branche les Layers Effect-TS dans le state management React</a>

**Prérequis** :
- Notion d'interface / abstraction
- Comprendre le couplage entre modules

**S'oppose à / à comparer avec** :
- **Architecture en couches "naïve"** : DAO → Service → Controller, mais le DAO connaît la DB et tout dépend de lui (pas d'inversion)
- **Big ball of mud** : aucune couche, tout connaît tout
- **Vertical Slice Architecture** : autre découpage, peut conserver l'inversion locale par feature

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-clean-architecture-hybride-sans-over-engineering" data-wiki-title="Clean Architecture hybride — sans over-engineering" data-wiki-preview="1. La Clean Architecture standard prescrit **4 couches** (Entities, Use Cases, Interface Adapters, Frameworks). Sur un projet petit/moyen, 80% de cette structure est du **scaffolding sans valeur métier**. 2. L'**idée à garder** : la **règle…">Clean Architecture hybride — sans over-engineering</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

