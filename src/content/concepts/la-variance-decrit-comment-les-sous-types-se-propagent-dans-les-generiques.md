---
created: '2026-04-27T06:46:39.319Z'
domain: frontend
level: advanced
tags:
  - type/concept
  - domain/frontend
  - level/advanced
title: >-
  Concept - La variance décrit comment les sous-types se propagent dans les
  génériques
slug: la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
excerpt: >-
  Comprendre la variance, c'est comprendre **80% des erreurs cryptiques** de
  TypeScript : - `Type 'string[]' is not assignable to type '(string |
  number)[]'` ← invariance - `Argument of type 'X' is not assignable to
  parameter of type 'Y'` sur des callbacks ← contravariance - `stric
oneLiner: >-
  La **variance** est la règle qui décide, **quand `Cat <: Animal`, si `F<Cat>`
  est un sous-type de `F<Animal>`** — selon que `T` est utilisé en **sortie**
  (covariant), en **entrée** (contravariant) ou aux deux (invariant).
related:
  - typescript-sacrifie-le-soundness-pour-la-praticite
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - frontend
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme
  - les-mapped-types-transforment-chaque-cle-d-un-type-en-un-nouveau-type
  - les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types
  - typescript-sacrifie-le-soundness-pour-la-praticite
  - architecture-fondamentaux
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> La **variance** est la règle qui décide, **quand `Cat <: Animal`, si `F<Cat>` est un sous-type de `F<Animal>`** — selon que `T` est utilisé en **sortie** (covariant), en **entrée** (contravariant) ou aux deux (invariant).

## Contexte / pourquoi ça compte

Comprendre la variance, c'est comprendre **80% des erreurs cryptiques** de TypeScript :
- `Type 'string[]' is not assignable to type '(string | number)[]'` ← invariance
- `Argument of type 'X' is not assignable to parameter of type 'Y'` sur des callbacks ← contravariance
- `strictFunctionTypes` qui change ton code qui marchait

Tu en as besoin pour :
- Lire des libs typées (Effect, fp-ts, RxJS)
- Comprendre `Promise<Cat>` vs `Promise<Animal>`
- Annoter correctement les variances en TS 4.7+ (`in`, `out`, `in out`)
- Saisir le compromis "bivariance des méthodes" en TS

## Détails / mécanisme

### Le rappel : le sous-typage

```typescript
class Animal { eat() {} }
class Cat extends Animal { meow() {} }
// Cat <: Animal (Cat est un sous-type d'Animal)
```

Tout endroit où `Animal` est attendu, on peut donner un `Cat`. Question : et dans un générique ?

### Les 3 variances

```typescript
type Producer<T> = () => T               // T en SORTIE
type Consumer<T> = (x: T) => void        // T en ENTRÉE
type Holder<T> = { get(): T; set(t: T): void }  // T des deux côtés
```

#### Covariance (sortie)

```typescript
let pa: Producer<Animal>
let pc: Producer<Cat>

pa = pc   // ✅ — un truc qui produit Cat produit aussi Animal (Cat <: Animal)
pc = pa   // ❌ — un truc qui produit Animal pourrait produire un Dog
```

**Producer<Cat> <: Producer<Animal>** — le sous-typage **se propage**. C'est covariant.

#### Contravariance (entrée)

```typescript
let ca: Consumer<Animal>  // accepte n'importe quel Animal
let cc: Consumer<Cat>     // accepte uniquement des Cat

cc = ca   // ✅ — Consumer<Animal> est plus permissif (accepte Cat aussi)
ca = cc   // ❌ — Consumer<Cat> ne peut pas traiter un Dog
```

**Consumer<Animal> <: Consumer<Cat>** — le sous-typage **s'inverse**. C'est contravariant.

L'intuition : si tu attends quelqu'un qui sait traiter un `Cat`, tu peux donner quelqu'un qui sait traiter **n'importe quel `Animal`** (il fera le boulot). L'inverse ne marche pas.

#### Invariance (entrée + sortie)

```typescript
let ha: Holder<Animal>
let hc: Holder<Cat>

ha = hc   // ❌ — ha.set(new Dog()) écrirait un Dog dans hc (interdit)
hc = ha   // ❌ — hc.get() retournerait Animal qu'on traiterait comme Cat (faux)
```

Ni covariant, ni contravariant. **Invariant**.

### TS et les arrays — le compromis cassé

En théorie, `Array<T>` devrait être **invariant** (on peut lire ET écrire). Mais TS le traite **covariant** pour ergonomie :

```typescript
const cats: Cat[] = [new Cat()]
const animals: Animal[] = cats   // ✅ TS accepte (covariant)
animals.push(new Dog())           // ✅ TS accepte (Dog <: Animal)
const c: Cat = cats[1]            // ✅ TS te le tape Cat
c.meow()                          // 💥 RuntimeError — c'est un Dog
```

C'est un trou de soundness délibéré (cf. <a class="wikilink" href="/Obsidian-Learn-Page/concepts/typescript-sacrifie-le-soundness-pour-la-praticite" data-wiki-title="Concept - TypeScript sacrifie le soundness pour la praticité" data-wiki-preview="**Sound** signifie &quot;si le programme type-check, il ne plante pas au runtime sur un type&quot; — TypeScript est **délibérément unsound** : `any`, covariance des arrays, bivariance des méthodes, casts non vérifiés, et plus encore — pour rester **e…">Concept - TypeScript sacrifie le soundness pour la praticité</a>).

### `strictFunctionTypes` — la contravariance correcte sur les fonctions

```typescript
type Handler<T> = (e: T) => void

const animalH: Handler<Animal> = (a) => console.log(a)
const catH: Handler<Cat> = (c) => c.meow()

let h: Handler<Cat>
h = animalH   // ✅ contravariant : Handler<Animal> <: Handler<Cat>
h = catH      // ✅ trivialement
```

Avec `strictFunctionTypes: true` (inclus dans `strict: true`), TS applique **vraiment** la contravariance sur les **types fonctions**. Sans, il était bivariant (les deux directions OK = unsound).

### Bivariance des **méthodes** — toujours active

```typescript
type EventMap = {
  click: (e: MouseEvent) => void   // déclaré comme MÉTHODE (signature shorthand)
}

const m: EventMap = {
  click: (e: KeyboardEvent) => e.key   // ⚠️ TS l'accepte malgré strictFunctionTypes
}
m.click(new MouseEvent("click"))       // 💥 e.key est undefined au runtime
```

Pourquoi ? Parce qu'**en JS, les méthodes sont fréquemment overridées avec des signatures variant légèrement** (DOM events, lifecycle, EventEmitter). L'équipe TS a explicitement gardé la bivariance des méthodes pour praticité.

**Workaround** : déclarer en propriété fonction :

```typescript
type EventMap = {
  click: (e: MouseEvent) => void   // toujours méthode shorthand
}

type StrictEventMap = {
  click: ((e: MouseEvent) => void)  // c'est une PROPRIÉTÉ fonction
  //  ↑ subtilité de syntaxe, change la variance
}
```

En 2026, on préfère écrire en `(e: ...) => void` explicite (forme propriété) pour la stricte.

### Bonne pratique : annotations explicites en TS 4.7+

```typescript
interface Producer<out T> {
  get(): T
}

interface Consumer<in T> {
  set(x: T): void
}

interface Holder<in out T> {
  get(): T
  set(x: T): void
}
```

`out`, `in`, `in out` documentent l'intention ET TS vérifie. Si tu utilises `T` dans une position qui contredit l'annotation, **erreur compile**.

```typescript
interface Producer<out T> {
  get(): T
  set(x: T): void   // ❌ Type 'T' is declared as 'out', but used as input
}
```

Précieux pour les libs : impossible d'introduire un bug de variance par inadvertance.

### Mauvaise pratique : ignorer la variance dans les types fonction

```typescript
// ❌ Confusion : pourquoi TS n'accepte pas ?
type Validator<T> = (input: T) => boolean

const validateAnimal: Validator<Animal> = (a) => true
const validateCat: Validator<Cat> = (c) => true

let v: Validator<Cat>
v = validateAnimal  // ✅ contravariant
v = validateCat     // ✅ ok

let w: Validator<Animal>
w = validateAnimal  // ✅
w = validateCat     // ❌ Validator<Cat> n'accepte pas un Animal — erreur correcte
```

Sans comprendre la contravariance, l'erreur sur `w = validateCat` semble bizarre. Avec : c'est évident.

### Bonne pratique : variance et observables

```typescript
import { Observable } from "rxjs"

let oa: Observable<Animal>
let oc: Observable<Cat>

oa = oc   // ✅ — Observable est covariant (T en sortie via subscribe)
```

Effect, RxJS, Promises — tous **covariants** sur leur type de valeur. Tu peux upcast sans souci.

### Mauvaise pratique : forcer un cast pour contourner

```typescript
const cats: Cat[] = [new Cat()]
const animals = cats as Animal[]   // ⚠️ marche, mais...
animals.push(new Dog())             // 💥 corrompt cats !
```

Le cast `as` désactive la vérification mais **ne change pas le runtime**. Les deux variables pointent le **même array**, donc `push` corrompt aussi `cats`.

## Exemple concret

### Cas réel : Effect-TS avec variance déclarée

```typescript
// Dans le source d'Effect (simplifié)
interface Effect<out A, out E = never, out R = never> {
  // A et E en sortie : Effect<Cat> assignable à Effect<Animal>
  // R en sortie aussi (car les requirements sont fournis, pas demandés)
}
```

Toutes les positions sont `out` parce qu'Effect est essentiellement un descripteur de calcul **lecture seule** une fois construit.

### Cas réel : Observer / Subject (RxJS)

```typescript
import { Subject } from "rxjs"

// Subject<T> est INVARIANT (peut emit ET subscribe)
const sa = new Subject<Animal>()
const sc: Subject<Cat> = sa as any   // ❌ ne devrait pas marcher
sc.next(new Dog())                    // 💥 émet un Dog dans le Subject<Cat>
```

C'est pour ça que dans les API RxJS modernes, on expose des `Observable<T>` (covariant, lecture seule) plutôt que des `Subject<T>` (invariant).

### Cas réel : NestJS / class-validator

```typescript
class CreateUserDto { @IsString() name!: string }
class CreateAdminDto extends CreateUserDto { @IsString() role!: string }

function process<T extends CreateUserDto>(dto: T) { ... }

process(new CreateAdminDto())   // ✅ T = CreateAdminDto, sous-type de CreateUserDto
```

Les paramètres génériques contraints (`extends CreateUserDto`) suivent la covariance naturelle. Quand tu as une erreur "is not assignable to parameter of type", regarde **où** ton T est utilisé dans la fonction (input ou output) — ça te dira où est le problème.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-types-conditionnels-font-des-branchements-dans-le-systeme-de-types" data-wiki-title="Concept - Les types conditionnels font des branchements dans le système de types" data-wiki-preview="Un **type conditionnel** s'écrit `T extends U ? X : Y` — c'est un **if/else exécuté par le compilateur** sur les types — et combiné à `infer` pour extraire des sous-types, il forme la base de quasi toutes les **utility types** modernes (`Re…">Concept - Les types conditionnels font des branchements dans le système de types</a> *(infer R préserve la variance)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/typescript-sacrifie-le-soundness-pour-la-praticite" data-wiki-title="Concept - TypeScript sacrifie le soundness pour la praticité" data-wiki-preview="**Sound** signifie &quot;si le programme type-check, il ne plante pas au runtime sur un type&quot; — TypeScript est **délibérément unsound** : `any`, covariance des arrays, bivariance des méthodes, casts non vérifiés, et plus encore — pour rester **e…">Concept - TypeScript sacrifie le soundness pour la praticité</a> *(la covariance des arrays est le sacrifice canonique)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-higher-kinded-types-abstraient-sur-le-constructeur-de-type-lui-meme" data-wiki-title="Concept - Les Higher-Kinded Types abstraient sur le constructeur de type lui-même" data-wiki-preview="Un **Higher-Kinded Type (HKT)** est un type qui prend en argument **un autre constructeur de type** plutôt qu'un type concret — `F&lt;_&gt;` au lieu de `T` — ce qui permet de définir des abstractions comme `Functor&lt;F&gt;` ou `Monad&lt;F&gt;` qui marchent…">Concept - Les Higher-Kinded Types abstraient sur le constructeur de type lui-même</a> *(les libs HKT déclarent les variances de F<_>)*

**Prérequis** :
- Sous-typage (ce qu'est un sous-type)
- Génériques TS (`<T>`)

**S'oppose à / à comparer avec** :
- **Java wildcards** : `List<? extends Animal>` (covariant) vs `List<? super Cat>` (contravariant) — annotation au site d'usage
- **C# `in` / `out`** : modèle inspirant TS 4.7+
- **Kotlin `in` / `out`** : déclaratif comme TS, mais sound (Kotlin n'a pas la bivariance)
- **Scala variance** : déclaratif au site de définition, fully sound

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-typescript-types-avances-de-la-variance-aux-hkt" data-wiki-title="TypeScript types avancés — de la variance aux Higher-Kinded Types" data-wiki-preview="1. **Variance** : si `Cat &lt;: Animal`, est-ce que `Container&lt;Cat&gt; &lt;: Container&lt;Animal&gt;` ? Ça dépend de la **position** de `T` (input = contravariant, output = covariant). C'est le coeur des erreurs de génériques. 2. **Types conditionnels** (…">TypeScript types avancés — de la variance aux Higher-Kinded Types</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>
<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

