---
created: 2026-04-26T00:00:00.000Z
domain: architecture
level: intermediate
tags:
  - type/concept
  - domain/architecture
  - level/intermediate
title: >-
  Concept - L'over-engineering vient de couches sans valeur métier qui les
  justifie
slug: l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie
excerpt: >-
  C'est la critique principale faite à l'application orthodoxe de la Clean
  Architecture, du DDD complet, ou des "best practices" empilées : **on paye le
  prix d'une protection qu'on n'utilise pas**.
oneLiner: >-
  L'**over-engineering architectural** se reconnaît à un signe : une couche, une
  interface, un DTO, un mapper qui **n'isole rien de réel** parce qu'il n'y a
  qu'une seule implémentation, jamais de variation, et que personne ne traverse
  cette frontière — c'est un coût permanent de maintenance pour un bénéfice
  imaginaire.
related:
  - clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
  - 2026-04-26-clean-architecture-hybride-sans-over-engineering
  - architecture-fondamentaux
backlinks:
  - 2026-04-26-clean-architecture-hybride-sans-over-engineering
  - clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
  - architecture-fondamentaux
topics:
  - architecture
  - backend
  - database
  - infra
  - typescript
---

# Concept - L'over-engineering vient de couches sans valeur métier qui les justifie

## Idée en une phrase

> L'**over-engineering architectural** se reconnaît à un signe : une couche, une interface, un DTO, un mapper qui **n'isole rien de réel** parce qu'il n'y a qu'une seule implémentation, jamais de variation, et que personne ne traverse cette frontière — c'est un coût permanent de maintenance pour un bénéfice imaginaire.

## Contexte / pourquoi ça compte

C'est la critique principale faite à l'application orthodoxe de la Clean Architecture, du DDD complet, ou des "best practices" empilées : **on paye le prix d'une protection qu'on n'utilise pas**.

Comprendre ce qu'est précisément l'over-engineering t'aide à :
- Refuser des PRs qui "abstraient pour le futur"
- Identifier où ton code pèse sans servir
- Apprendre à supprimer (déléter du code qu'on a écrit, c'est aussi de l'archi)

## Détails / mécanisme

### La définition opératoire

> Une abstraction est **over-engineered** si :
> 1. Il n'existe **qu'une seule implémentation** dans tout le code
> 2. Personne **ne franchit** cette frontière dans la vie réelle (pas de mock, pas de test qui en bénéficie, pas de variante)
> 3. Tu ne peux pas nommer **un coût concret évité** par cette abstraction

Si les 3 sont vraies, l'abstraction est du **scaffolding gratuit** : tu paies un coût (lecture, refactor, navigation) pour une promesse qui ne se réalise pas.

### Symptômes typiques

**Symptôme 1 — Interface à une seule impl, pas de mock** :
```typescript
// IUserService.ts
export interface IUserService {
  getById(id: string): Promise<User>
}
// UserService.ts
export class UserService implements IUserService { /* ... */ }
// Et c'est tout. Personne d'autre n'implémente. Aucun test n'utilise un mock.
```

**Symptôme 2 — Mapper Entity ↔ DTO identique** :
```typescript
// User et UserDto ont les mêmes 5 champs
function toDto(u: User): UserDto {
  return { id: u.id, email: u.email, name: u.name, age: u.age, role: u.role }
}
```

**Symptôme 3 — Fichier d'export "pour les imports propres"** :
```typescript
// domain/index.ts
export * from "./User"
export * from "./Order"
// Ajoute zero valeur, mais oblige à maintenir
```

**Symptôme 4 — Nesting infini** :
```
src/modules/users/application/use-cases/create/handlers/CreateUserHandler.ts
```
Chaque dossier qui n'a qu'un fichier dedans est suspect.

### Pourquoi c'est tentant

L'over-engineering n'est presque jamais malicieux. Il vient de :
- **Anticipation excessive** : "et si un jour on changeait de DB ?"
- **Mimétisme** : "le tutoriel Clean dit qu'il faut faire comme ça"
- **Prestige** : "ça fait architecture solide aux yeux du senior"
- **Peur du refactor** : "si je n'extrais pas maintenant, je n'oserai jamais"

### La fausse économie

L'argument "ça coûte rien d'abstraire en avance" est **faux**. Coûts cachés :
- **Lecture** : chaque dev qui arrive doit comprendre 3 fichiers au lieu d'1
- **Refactor** : changer la signature, c'est changer 3 fichiers cohérents au lieu d'1
- **Onboarding** : "pourquoi y a-t-il une `IUserRepository` qui n'a qu'une impl ?" → discussion 30 min
- **Bugs** : plus de fichiers = plus de joints = plus d'opportunités d'incohérence

**Make the change easy, then make the easy change.** (Kent Beck)
Si le besoin de l'abstraction se présente plus tard, la refactorisation à ce moment-là est **moins coûteuse** que toute la maintenance accumulée d'une abstraction inutile.

### Le test concret

Pose la question pour chaque abstraction :
> "Si je supprime cette interface / ce DTO / cette couche, qu'est-ce qui devient impossible **maintenant** ?"

- Si la réponse est "rien" → tu as ta réponse.
- Si la réponse est "ce test devient impossible" / "cette feature devient bloquante" → garde-la.
- Si la réponse est "mais un jour..." → 99% du temps, supprime.

## Exemple concret

**Avant (over-engineered)** :
```
src/
├── domain/
│   ├── entities/User.ts
│   └── repositories/IUserRepository.ts
├── application/
│   ├── use-cases/
│   │   └── create-user/
│   │       ├── CreateUserUseCase.ts
│   │       ├── CreateUserCommand.ts
│   │       └── CreateUserResponse.ts
│   └── ports/
│       └── ILogger.ts
├── infrastructure/
│   ├── repositories/PgUserRepository.ts
│   ├── adapters/WinstonLogger.ts
│   └── mappers/UserMapper.ts
└── presentation/
    ├── controllers/UserController.ts
    └── dto/CreateUserDto.ts
```

13 fichiers pour "POST /users".

**Après (pragmatique)** :
```
src/
├── domain/
│   └── User.ts          # entity + validation
├── infrastructure/
│   ├── db.ts            # connexion Postgres
│   └── http/
│       └── users.ts     # handler Express, ~30 lignes
└── main.ts
```

3 fichiers pour la même feature. Si plus tard on a besoin d'un mock, on **extrait alors** une fonction et on la passe en argument. Si on doit changer de DB, **les 30 lignes de handler bougent**, pas 13 fichiers.

### Quand l'over-engineering est *justifié*

- **Domaine très complexe** (banque, ERP, healthcare avec règles légales)
- **Très long terme** (10+ ans envisagés, vraie possibilité de migration majeure)
- **Régulation** qui exige des frontières claires (audit, sécurité)
- **Équipe nombreuse** où la séparation par couches sert la coordination

Hors de ces cas : **simplifie**.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/clean-architecture-inverse-les-dependances-pour-isoler-le-domaine" data-wiki-title="Concept - Clean Architecture inverse les dépendances pour isoler le domaine" data-wiki-preview="La Clean Architecture (Uncle Bob) repose sur **une seule règle structurante** — la **règle de dépendance** : les couches externes (frameworks, DB, UI) **dépendent** des couches internes (logique métier, entités), **jamais l'inverse** — ce q…">Concept - Clean Architecture inverse les dépendances pour isoler le domaine</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin" data-wiki-title="Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin" data-wiki-preview="Une approche pragmatique de la Clean Architecture commence par **2 couches** (`domain` / `infrastructure`) et n'introduit une 3e ou 4e couche **que face à un signe concret de douleur** — et non par anticipation — ce qui maximise la valeur t…">Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin</a>

**Prérequis** :
- Notions de couches, interfaces, DTOs

**S'oppose à / à comparer avec** :
- **YAGNI** : "You Aren't Gonna Need It" — la règle qui combat directement l'over-engineering
- **Premature abstraction** : la version "code-level" du même piège (vs over-engineering qui est "archi-level")
- **Speculative generality** (Code Smell, Fowler) : nom plus ancien du même phénomène

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-clean-architecture-hybride-sans-over-engineering" data-wiki-title="Clean Architecture hybride — sans over-engineering" data-wiki-preview="1. La Clean Architecture standard prescrit **4 couches** (Entities, Use Cases, Interface Adapters, Frameworks). Sur un projet petit/moyen, 80% de cette structure est du **scaffolding sans valeur métier**. 2. L'**idée à garder** : la **règle…">Clean Architecture hybride — sans over-engineering</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

