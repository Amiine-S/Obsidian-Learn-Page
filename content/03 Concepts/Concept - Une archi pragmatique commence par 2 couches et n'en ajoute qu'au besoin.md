---
created: 2026-04-26
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
---

# Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin

## Idée en une phrase

> Une approche pragmatique de la Clean Architecture commence par **2 couches** (`domain` / `infrastructure`) et n'introduit une 3e ou 4e couche **que face à un signe concret de douleur** — et non par anticipation — ce qui maximise la valeur tout en minimisant le coût de maintenance.

## Contexte / pourquoi ça compte

C'est la **stratégie incrémentale** qui résout le dilemme entre "j'écris un spaghetti de 30 lignes en Express" et "je déploie 4 couches plus DTOs+mappers pour un CRUD". Elle s'aligne avec :
- **YAGNI** (You Aren't Gonna Need It)
- **Make the change easy, then make the easy change** (Kent Beck)
- **Premature abstraction is bad** (folklore communautaire, démontré empiriquement)

C'est aussi la philosophie portée par Effect-TS et la Vertical Slice Architecture : **l'inversion de dépendance gratuite quand elle est dans les types, des fichiers en plus uniquement quand le domaine le justifie**.

## Détails / mécanisme

### Étape 0 — Setup minimal (2 couches)

```
src/
├── domain/
│   └── User.ts            # entité + règles métier pures
└── infrastructure/
    ├── db.ts              # connexion DB
    ├── http/
    │   └── users.ts       # handler HTTP
    └── services/
        └── stripe.ts      # client Stripe
```

Règle : **`domain/` ne fait JAMAIS d'I/O et n'importe rien de `infrastructure/`**. C'est la seule discipline. Le reste est libre.

Test simple : `npm test domain/` doit tourner sans démarrer la DB.

### Étape 1 — Tu touches une douleur, tu réagis

**Douleur A — Tests difficiles**.
> Tu veux tester `validateOrder` mais ça appelle Stripe.

**Réaction** : injecter Stripe en argument, ou passer par un service Effect, ou extraire une fonction.
```typescript
// avant : import direct
const validate = (cart: Cart) => stripe.charges.list(...)

// après : injection (suffit souvent)
const validate = (charges: ChargesAPI) => (cart: Cart) => charges.list(...)
```

**Douleur B — Une 2e implémentation arrive**.
> Ton `userRepo` est uniquement Postgres. Maintenant tu veux un cache Redis devant.

**Réaction** : extraire l'interface, créer 2 implémentations, choisir au boot.
```typescript
interface UserRepo { findById(id: string): Promise<User> }
class PgUserRepo implements UserRepo { ... }
class CachedUserRepo implements UserRepo { 
  constructor(private cache: Redis, private inner: UserRepo) {}
  ...
}
```

**Douleur C — La logique métier "fuit" partout**.
> 200 lignes de logique dans `users.ts` (controller). Trois autres handlers font partiellement la même chose.

**Réaction** : extraire un Use Case (fonction ou Effect avec services). Pas une couche entière, juste cette logique-là.

### Étape 2 — La 3e couche apparaît si

Tu remarques que **plusieurs use cases** émergent et **partagent** des dépendances (DB, services). Là, créer une couche `application/` (use cases) **commence à payer**, parce que :
- Elle déduplique les fakes en test
- Elle fait apparaître clairement les ports nécessaires
- Elle découple les handlers HTTP de la logique réelle

```
src/
├── domain/
├── application/         # ← NOUVELLE COUCHE
│   ├── createOrder.ts
│   ├── validateUser.ts
│   └── ports.ts
└── infrastructure/
```

**Pas avant.** Si tu as 3 use cases triviaux, garder 2 couches reste meilleur.

### Quand t'arrêter

L'archi finale dépend de la complexité réelle :

| Complexité du domaine | Couches recommandées |
|---|---|
| CRUD simple, < 20 features | 2 |
| CRUD + quelques règles métier | 2 (avec extractions ponctuelles) |
| Domaine non-trivial, plusieurs règles métier | 3 (domain / application / infra) |
| Domaine très complexe, multi-bounded-contexts, > 5 ans | 4 (Clean stricte) ou DDD tactique |

### Le test "j'ajoute une couche maintenant ?"

Trois questions :
1. **Quel coût concret est-ce que je paie aujourd'hui** ? (lent à tester, fragile au refactor, copier-coller, ...)
2. **Est-ce que la couche supprime ce coût** ? (vraiment ? ou juste le déplace ?)
3. **Quel est le coût permanent** d'avoir cette couche ? (fichiers, indirection, onboarding)

Si (1) > (3), ajoute. Sinon, refuse.

## Exemple concret

**Phase 1** — Démarrage MVP (2 mois, 1 dev) :

```typescript
// domain/User.ts
export class User {
  constructor(public email: string, public age: number) {
    if (!email.includes("@")) throw new Error("invalid email")
    if (age < 18) throw new Error("must be 18+")
  }
}

// infrastructure/http/users.ts
import express from "express"
import { db } from "../db"
import { User } from "../../domain/User"

const router = express.Router()
router.post("/users", async (req, res) => {
  const user = new User(req.body.email, req.body.age) // valide en construisant
  const saved = await db.query("INSERT INTO users(...) VALUES (...)", [user.email, user.age])
  res.json(saved.rows[0])
})
```

Ça suffit. Pas de Use Case, pas de Repository, pas de DTO. **Tu shippes**.

**Phase 2** — 6 mois plus tard, l'app a marché :
- Tu ajoutes Stripe → la création user fait maintenant 80 lignes mêlant DB + Stripe + email
- Plusieurs handlers font la même validation

**Tu extrais** :
```typescript
// application/createUser.ts
export async function createUser(deps: { db: Db; stripe: Stripe; mail: Mail }, dto: CreateUserDto) {
  const user = new User(dto.email, dto.age)
  const customer = await deps.stripe.customers.create({ email: user.email })
  const saved = await deps.db.users.insert({ ...user, stripeId: customer.id })
  await deps.mail.sendWelcome(user.email)
  return saved
}
```

3 couches naissent **maintenant**, parce qu'elles paient. Pas plus tôt.

## Connexions

**Concepts liés** :
- [[Concept - Clean Architecture inverse les dépendances pour isoler le domaine]]
- [[Concept - L'over-engineering vient de couches sans valeur métier qui les justifie]]
- [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]] *(une autre voie pour avoir l'inversion sans cérémonie)*

**Prérequis** :
- Notion de couplage et de dépendance entre modules
- Avoir vu (ou subi) un projet over-engineered

**S'oppose à / à comparer avec** :
- **Clean Architecture stricte** : 4 couches dès le départ, sans condition
- **Big ball of mud** : pas de couches du tout, tout se mélange
- **Vertical Slice Architecture** : autre stratégie pragmatique, complémentaire (couper par feature plutôt que par couche)

## Sources

- [[2026-04-26 - Clean Architecture hybride sans over-engineering]]

## MOC

[[MOC - Architecture & Fondamentaux]]
