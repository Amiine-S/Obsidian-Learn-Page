---
title: Clean Architecture hybride — sans over-engineering
author: Claude (synthèse)
digested: 2026-04-26T00:00:00.000Z
format: doc
domain: architecture
level: intermediate
tags:
  - type/source
  - status/done
  - domain/architecture
  - format/doc
  - level/intermediate
slug: 2026-04-26-clean-architecture-hybride-sans-over-engineering
excerpt: >-
  1. La Clean Architecture standard prescrit **4 couches** (Entities, Use Cases,
  Interface Adapters, Frameworks). Sur un projet petit/moyen, 80% de cette
  structure est du **scaffolding sans valeur métier**. 2. L'**idée à garder** :
  la **règle de dépendance** — les couches externes
related:
  - clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
  - l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
  - architecture-fondamentaux
backlinks:
  - clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
  - l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
topics:
  - architecture
---
## Pourquoi cette source

> La Clean Architecture (Uncle Bob) est régulièrement critiquée comme étant **over-engineered** sur des projets normaux : 4 couches, des interfaces partout, du mapping entre DTOs, ... pour un CRUD à 3 utilisateurs. La question : **comment garder l'esprit (testabilité, isolation du domaine, découplage de la techno) sans payer le prix de l'orthodoxie** ?

## Résumé en 5 lignes

1. La Clean Architecture standard prescrit **4 couches** (Entities, Use Cases, Interface Adapters, Frameworks). Sur un projet petit/moyen, 80% de cette structure est du **scaffolding sans valeur métier**.
2. L'**idée à garder** : la **règle de dépendance** — les couches externes (Express, Postgres) **dépendent** des couches internes (domaine), jamais l'inverse. Tout le reste est négociable.
3. **Hybride pragmatique** : commence à **2 couches** (`domain` / `infrastructure`) et n'ajoute une couche que **quand un coût concret de couplage** apparaît (= triple repo de la même entité, mock impossible, refactor risqué).
4. **Effect-TS, Hexagonal allégée, Vertical Slice Architecture** sont des variantes pragmatiques qui gardent l'inversion de dépendance sans la cérémonie. À retenir comme alternatives au "Bob orthodoxe".
5. La règle d'or : **n'introduis une abstraction que face à une douleur réelle**, pas face à une douleur anticipée. Un YAGNI bien appliqué bat dix designs idéaux.

---

## 1. Rappel rapide : la Clean Architecture stricte

Les **4 couches concentriques** d'Uncle Bob, de l'extérieur vers l'intérieur :

```
┌──────────────────────────────────────────┐
│ Frameworks & Drivers                     │ ← Express, Postgres driver, Stripe SDK
│  ┌────────────────────────────────────┐ │
│  │ Interface Adapters                 │ │ ← Controllers, Presenters, Gateways
│  │  ┌──────────────────────────────┐ │ │
│  │  │ Use Cases                    │ │ │ ← logique applicative
│  │  │  ┌────────────────────────┐ │ │ │
│  │  │  │ Entities               │ │ │ │ ← règles métier pures
│  │  │  └────────────────────────┘ │ │ │
│  │  └──────────────────────────────┘ │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
       Dépendances : pointent VERS L'INTÉRIEUR
```

**La règle de dépendance** : aucune couche interne ne connaît les couches externes. `Entities` ne sait rien de `UseCases`, qui ne sait rien d'`Adapters`, qui ne sait rien d'Express.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/clean-architecture-inverse-les-dependances-pour-isoler-le-domaine" data-wiki-title="Concept - Clean Architecture inverse les dépendances pour isoler le domaine" data-wiki-preview="La Clean Architecture (Uncle Bob) repose sur **une seule règle structurante** — la **règle de dépendance** : les couches externes (frameworks, DB, UI) **dépendent** des couches internes (logique métier, entités), **jamais l'inverse** — ce q…">Concept - Clean Architecture inverse les dépendances pour isoler le domaine</a>

## 2. Le coût caché

Pour une seule feature "créer un user", tu écris facilement :

```
domain/User.ts                      # Entity
application/CreateUserUseCase.ts    # Use Case
application/IUserRepository.ts      # Port (interface)
infrastructure/PgUserRepository.ts  # Adapter
adapters/dto/CreateUserDto.ts       # DTO entrée
adapters/dto/UserResponseDto.ts     # DTO sortie
adapters/mappers/UserMapper.ts      # User <-> Dto
adapters/http/UserController.ts     # Express handler
```

8 fichiers pour ce qu'Express + Drizzle font en 30 lignes. Sur un projet de 50 features, tu as **400 fichiers** dont la majorité est du scaffolding.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie" data-wiki-title="Concept - L'over-engineering vient de couches sans valeur métier qui les justifie" data-wiki-preview="L'**over-engineering architectural** se reconnaît à un signe : une couche, une interface, un DTO, un mapper qui **n'isole rien de réel** parce qu'il n'y a qu'une seule implémentation, jamais de variation, et que personne ne traverse cette f…">Concept - L'over-engineering vient de couches sans valeur métier qui les justifie</a>

**Quand c'est justifié** :
- Domaine très complexe (banque, assurance, ERP)
- Très long terme (10+ ans, plusieurs migrations DB)
- Équipes nombreuses (>20 devs, partition par couche)

**Quand c'est over-engineering** :
- App de moins de 20 features
- Équipe < 5 devs
- Domaine simple (CRUD principalement)
- MVP / produit qui pivote

---

## 3. La règle pragmatique : 2 couches au départ

```
src/
├── domain/                # règles métier + types — PUR, sans I/O
│   ├── User.ts
│   └── User.spec.ts
└── infrastructure/        # tout le reste — HTTP, DB, services tiers
    ├── http/
    ├── db/
    └── services/
```

C'est tout. Pas de Use Cases pour des CRUDs. Pas d'IRepository pour 1 implémentation. Pas de DTO en plus de l'entity sauf si elles divergent réellement.

**Test du domaine** :
```typescript
// domain/User.spec.ts
import { User } from "./User"

test("user must be 18+", () => {
  expect(() => User.create({ age: 17 })).toThrow()
})
```

Pure logique, pas de mock, pas de DI. Si tu peux tester ton domaine sans mock, **tu es bon**.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin" data-wiki-title="Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin" data-wiki-preview="Une approche pragmatique de la Clean Architecture commence par **2 couches** (`domain` / `infrastructure`) et n'introduit une 3e ou 4e couche **que face à un signe concret de douleur** — et non par anticipation — ce qui maximise la valeur t…">Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin</a>

---

## 4. Quand introduire une 3e couche — les signes concrets

**Signe 1 — La même entité a 3 implémentations**.
> "J'ai une `UserRepository` pour Postgres, une autre pour les tests, et maintenant l'équipe veut une version Redis pour le cache."
→ Extraire l'interface (`IUserRepository`) devient utile.

**Signe 2 — Un test métier nécessite un mock complexe**.
> "Pour tester `validateUserCanBuy`, je dois mocker la DB, Stripe, et l'email service."
→ Ces dépendances doivent être injectables dans une couche `application`.

**Signe 3 — Refactor de la techno bloque pendant 2 sprints**.
> "On change de Postgres à DynamoDB et on doit modifier 50 fichiers."
→ Un port (interface) entre domaine et infra te coûtait 0 jusqu'ici, te ferait gagner 50 fichiers maintenant.

**Signe 4 — La logique métier "sale" se répand dans les controllers**.
> "Le contrôleur `POST /orders` fait 200 lignes : validation, calcul de prix, appel Stripe, persist, envoi mail."
→ Une couche `application` (Use Cases) avec un orchestrateur résoudrait l'éparpillement.

Tant que **aucun** de ces signes n'est présent, **n'ajoute rien**.

---

## 5. Variantes pragmatiques

### Hexagonal allégée (Ports & Adapters)

```
src/
├── domain/             # entities + logic
├── ports/              # interfaces (uniquement celles vraiment utilisées)
└── adapters/
    ├── http/
    └── db/
```

Une seule couche d'abstraction (les ports), introduite au cas par cas. Plus simple que Clean.

### Vertical Slice Architecture (VSA)

Plutôt que des couches horizontales (domain/app/infra), on découpe **par feature** :

```
src/
├── features/
│   ├── create-order/
│   │   ├── create-order.handler.ts
│   │   ├── create-order.spec.ts
│   │   └── create-order.types.ts
│   └── list-orders/
└── shared/
    └── db.ts
```

Chaque feature est autonome. Pas de couplage par couche, couplage par feature uniquement. Bien adapté à CQRS, MediatR, ou des handlers Effect.

### Effect-TS — la couche est dans le type

Avec Effect-TS, les "ports" deviennent des **services Layer**. La frontière domaine/infra est dans le **type d'Effect** (les `R` de `Effect<A, E, R>`).

```typescript
// "domaine" pur — pas d'I/O dans le code
const createOrder = (cart: Cart) =>
  Effect.gen(function* () {
    const total = computeTotal(cart) // pure
    const inventory = yield* InventoryService     // requirement (port)
    yield* inventory.reserve(cart)
    return { id: ..., total }
  })

// "infrastructure" : le Layer fournit InventoryService
// → cf. [[Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP]]
```

Tu as les bénéfices de la Clean (testabilité, inversion) **sans la cérémonie de fichiers**. Une feature peut tenir dans **un fichier** tout en respectant l'inversion de dépendance.

---

## 6. La règle ultime — YAGNI architectural

**You Aren't Gonna Need It** appliqué à l'archi :

> "Cette interface, ce DTO, cette couche — j'en ai besoin **maintenant** ou j'imagine en avoir besoin **un jour** ?"

Si la réponse est "un jour", **n'écris rien**. Le coût de l'extraction quand le besoin arrive est typiquement **plus faible** que le coût cumulé de maintenir l'abstraction superflue pendant tout ce temps.

C'est contre-intuitif, parce que les blogs Clean te promettent l'inverse. La réalité empirique (Sandi Metz, DHH, Kent Beck) est unanime : **on n'extrait pas en avance**.

---

## 7. Tableau de décision

| Cas | Recommandation |
|---|---|
| Solo / MVP / projet < 6 mois | 2 couches max, pas d'interfaces |
| Petite équipe, app stable, peu de domaines | Hexagonal allégée ou VSA |
| Backend Effect-TS | Layers + Services = ton archi |
| Gros projet, longue durée, plusieurs domaines | Clean Architecture stricte ou DDD tactique |
| Microservices | VSA par service, partage = duplication contrôlée |
| Équipe + experte sur Clean | Garde Clean si vous êtes alignés et que ça aide |

---

## Citations brutes

> *"There's no such thing as a free abstraction."* — Hillel Wayne.

> *"Make the change easy, then make the easy change."* — Kent Beck.

> *"Premature abstraction is the root of all evil."* — adapté du dicton perf de Knuth.

---

## À explorer ensuite

- **DDD tactique** (Eric Evans) : Aggregates, Value Objects, Bounded Contexts
- **Vertical Slice Architecture** : pourquoi Jimmy Bogard a popularisé l'approche
- **CQRS sans event sourcing** : le sweet spot read/write séparés sans la complexité d'event store
- **L'approche "trois files" de DHH** : controller / model / view comme couches de base
- **Effect-TS comme alternative** : pourquoi le système de types peut se substituer à des couches entières

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

