---
created: 2026-04-26T00:00:00.000Z
domain: backend
level: beginner
tags:
  - type/concept
  - domain/backend
  - level/beginner
title: >-
  Concept - Validate first place toutes les vérifications en début de fonction
  pour un code happy-path plat
slug: >-
  validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
excerpt: >-
  C'est l'un des refactors les plus impactants visuellement et pour la
  lisibilité. Une fonction qui valide first se lit "haut → bas" comme une
  histoire : "voici les conditions, voici ce qu'on fait quand tout va bien". Une
  fonction sans valide first se lit comme un labyrinthe de `if
oneLiner: >-
  Le pattern **validate first** (ou **early return**, ou **guard clauses**)
  consiste à grouper toutes les vérifications d'invariants au **début** d'une
  fonction et à retourner / throw immédiatement en cas d'échec, pour que le
  reste du corps soit le **happy path** sans `else` imbriqué et sans
  accumulation conditionnelle.
related:
  - >-
    custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
  - 2026-04-26-exception-handling-patterns-en-typescript
  - backend-infra
backlinks:
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - 2026-04-26-exception-handling-patterns-en-typescript
  - >-
    custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
  - zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema
topics:
  - backend
---
## Idée en une phrase

> Le pattern **validate first** (ou **early return**, ou **guard clauses**) consiste à grouper toutes les vérifications d'invariants au **début** d'une fonction et à retourner / throw immédiatement en cas d'échec, pour que le reste du corps soit le **happy path** sans `else` imbriqué et sans accumulation conditionnelle.

## Contexte / pourquoi ça compte

C'est l'un des refactors les plus impactants visuellement et pour la lisibilité. Une fonction qui valide first se lit "haut → bas" comme une histoire : "voici les conditions, voici ce qu'on fait quand tout va bien". Une fonction sans valide first se lit comme un labyrinthe de `if (...) { else { if (...) { ... } } }`.

C'est aussi le pattern qui combine le mieux avec les **schémas de validation** (Zod, Effect Schema) — un seul `parse()` au début te donne soit un type validé, soit une erreur structurée.

## Détails / mécanisme

### Anti-pattern : validation arrow

```typescript
function transferMoney(from: Account, to: Account, amount: number) {
  if (from && to) {
    if (amount > 0) {
      if (from.id !== to.id) {
        if (from.balance >= amount) {
          // Le code utile est noyé à 4 niveaux d'indentation
          from.balance -= amount
          to.balance += amount
          return { from, to }
        } else {
          throw new Error('Insufficient funds')
        }
      } else {
        throw new Error('Cannot transfer to self')
      }
    } else {
      throw new Error('Amount must be positive')
    }
  } else {
    throw new Error('Account missing')
  }
}
```

C'est ce qu'on appelle l'**arrow code** — la pyramide d'imbrications. Difficile à lire, à modifier, à tester.

### Pattern : validate first

```typescript
function transferMoney(from: Account, to: Account, amount: number) {
  // Tous les invariants en haut, fail fast
  if (!from || !to) throw new Error('Account missing')
  if (amount <= 0) throw new Error('Amount must be positive')
  if (from.id === to.id) throw new Error('Cannot transfer to self')
  if (from.balance < amount) throw new Error('Insufficient funds')

  // À partir d'ici, tout est OK : code "happy path" plat
  from.balance -= amount
  to.balance += amount
  return { from, to }
}
```

Avantages :
- **Lisibilité** : tu vois en 4 lignes les conditions, puis 3 lignes de logique. Pas de scroll.
- **Modifiabilité** : ajouter une nouvelle vérification = ajouter une ligne en haut. Pas besoin de réorganiser les `else`.
- **Testabilité** : chaque condition d'erreur testable individuellement par un test "négatif".

### Avec un schema validator (validate first à grande échelle)

```typescript
import { z } from 'zod'

const TransferSchema = z.object({
  fromId: z.string().uuid(),
  toId: z.string().uuid(),
  amount: z.number().positive(),
}).refine(d => d.fromId !== d.toId, 'Cannot transfer to self')

function transferMoney(input: unknown) {
  const data = TransferSchema.parse(input) // throws ZodError si invalide
  // data : { fromId, toId, amount } — typé garanti

  // Logique métier sur data
  return doTransfer(data)
}
```

Une seule ligne de validation pour 4 invariants. Erreur typée structurée si invalide.

### En TS strict avec narrowing

```typescript
function processUser(user: User | null) {
  // Guard early — narrowing !
  if (!user) throw new Error('User required')
  // À partir d'ici, TypeScript sait que user est User (pas null)

  if (!user.verified) throw new Error('User must be verified')
  if (user.banned) throw new Error('User is banned')

  return user.name.toUpperCase() // safe, plus de checks
}
```

TypeScript propage le narrowing après chaque guard, ce qui rend le happy path entièrement typé sans assertions.

## Exemple concret

Refactor d'un controller Express :

**Avant** :
```typescript
app.post('/orders', async (req, res) => {
  if (req.user) {
    if (req.body.items && req.body.items.length > 0) {
      if (req.body.items.every(i => i.quantity > 0)) {
        const order = await createOrder(req.user.id, req.body.items)
        res.json(order)
      } else {
        res.status(422).json({ error: 'Invalid quantity' })
      }
    } else {
      res.status(422).json({ error: 'Empty cart' })
    }
  } else {
    res.status(401).json({ error: 'Auth required' })
  }
})
```

**Après** :
```typescript
const OrderBody = z.object({
  items: z.array(z.object({ id: z.string(), quantity: z.number().int().positive() })).min(1),
})

app.post('/orders', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Auth required' })

  const parsed = OrderBody.safeParse(req.body)
  if (!parsed.success) return res.status(422).json({ errors: parsed.error.flatten() })

  const order = await createOrder(req.user.id, parsed.data.items)
  res.json(order)
})
```

Plus court, mieux typé (parsed.data est typé), erreurs séparées par type (401/422), happy path plat.

## Connexions

**Concepts liés** :
- <span class="wikilink-broken" title="Référence non trouvée : Concept - try/catch impose un narrow manuel et ne documente rien dans la signature">Concept - try/catch impose un narrow manuel et ne documente rien dans la signature</span>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee" data-wiki-title="Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée" data-wiki-preview="Sous-classer `Error` en classes nommées (`UserNotFoundError`, `ForbiddenError`, `RateLimitError`) avec un **tag discriminant** permet de **catcher de façon typée** au point de gestion (via `instanceof` ou switch sur tag) et de mapper propre…">Concept - Custom Exception classes nomment les erreurs métier pour discrimination typée</a>

**Prérequis** :
- Bases du contrôle de flux
- Notion d'invariant

**S'oppose à / à comparer avec** :
- **Arrow code** / pyramide if-else imbriquée — l'anti-pattern direct
- **Defensive programming poussé à l'extrême** : checks redondants partout, vs guard clauses ciblées en début

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-exception-handling-patterns-en-typescript" data-wiki-title="Exception Handling Patterns en TypeScript" data-wiki-preview="1. **try/catch** — la base. Bien, mais coûte cher en lisibilité quand on l'imbrique, et n'apporte rien dans le typage. 2. **Validate first** (early return / guard clauses) — vérifier les invariants au début de la fonction et retourner tôt.…">Exception Handling Patterns en TypeScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

