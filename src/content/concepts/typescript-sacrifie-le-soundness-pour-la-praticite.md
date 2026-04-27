---
created: 2026-04-27T00:00:00.000Z
domain: frontend
level: advanced
tags:
  - type/concept
  - domain/frontend
  - level/advanced
title: Concept - TypeScript sacrifie le soundness pour la praticité
slug: typescript-sacrifie-le-soundness-pour-la-praticite
excerpt: >-
  Comprendre ce compromis te permet : - De savoir **où** TS te ment et donc où
  il faut être prudent (validation runtime, tests, audits) - De **choisir**
  entre `any` (escape), `unknown` (forcing narrow), et la validation runtime
  (zod, valibot) - De ne pas être surpris par un `Cannot
oneLiner: >-
  **Sound** signifie "si le programme type-check, il ne plante pas au runtime
  sur un type" — TypeScript est **délibérément unsound** : `any`, covariance des
  arrays, bivariance des méthodes, casts non vérifiés, et plus encore — pour
  rester **ergonomique** et **adoptable** pour des devs JS qui migrent.
related:
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema
  - >-
    le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion
  - try-catch-impose-un-narrow-manuel-et-ne-documente-rien-dans-la-signature
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - frontend
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-typescript-types-avances-de-la-variance-aux-hkt
  - la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques
  - architecture-fondamentaux
  - frontend
topics:
  - frontend
  - typescript
---
## Idée en une phrase

> **Sound** signifie "si le programme type-check, il ne plante pas au runtime sur un type" — TypeScript est **délibérément unsound** : `any`, covariance des arrays, bivariance des méthodes, casts non vérifiés, et plus encore — pour rester **ergonomique** et **adoptable** pour des devs JS qui migrent.

## Contexte / pourquoi ça compte

Comprendre ce compromis te permet :
- De savoir **où** TS te ment et donc où il faut être prudent (validation runtime, tests, audits)
- De **choisir** entre `any` (escape), `unknown` (forcing narrow), et la validation runtime (zod, valibot)
- De ne pas être surpris par un `Cannot read properties of undefined` sur du code qui type-check
- De saisir pourquoi **Flow** (Facebook) a perdu la guerre face à TS malgré être plus sound

C'est un sujet de **maturité** : tu passes de "TS dit OK donc c'est bon" à "TS dit OK mais où sont mes hypothèses cachées ?"

## Détails / mécanisme

### Définition rigoureuse

- **Sound** : si le compilateur dit "type-check OK", alors **aucune erreur de type ne peut survenir au runtime** sur le code typé.
- **Complete** : si le programme est correct, le compilateur le reconnaît.

Un système de types "parfait" est sound + complete. **Aucun langage mainstream ne l'est** (théorème de Rice : indécidable). Tous font des compromis.

TS choisit explicitement de **ne pas être sound**. Voici les principaux trous, tous délibérés.

### Trou n°1 : `any` — l'escape hatch

```typescript
const x: any = "hello"
const n: number = x        // ✅ pas d'erreur compile
n.toFixed(2)               // 💥 RuntimeError: x.toFixed is not a function
```

`any` désactive **tout** le typage à son contact. Très utile en migration JS→TS, à éviter en code applicatif.

### Trou n°2 : covariance des arrays

```typescript
class Animal { eat() {} }
class Cat extends Animal { meow() {} }
class Dog extends Animal { bark() {} }

const cats: Cat[] = [new Cat()]
const animals: Animal[] = cats   // ✅ TS accepte (covariant)
animals.push(new Dog())           // ✅ Dog <: Animal donc OK
const c: Cat = cats[1]            // ✅ TS le type Cat
c.meow()                          // 💥 RuntimeError — c'est un Dog
```

`Array<T>` devrait être **invariant** (lecture + écriture), mais TS le traite covariant pour ergonomie. Cf. <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques" data-wiki-title="Concept - La variance décrit comment les sous-types se propagent dans les génériques" data-wiki-preview="La **variance** est la règle qui décide, **quand `Cat &lt;: Animal`, si `F&lt;Cat&gt;` est un sous-type de `F&lt;Animal&gt;`** — selon que `T` est utilisé en **sortie** (covariant), en **entrée** (contravariant) ou aux deux (invariant).">Concept - La variance décrit comment les sous-types se propagent dans les génériques</a>.

### Trou n°3 : bivariance des méthodes

```typescript
type EventMap = {
  click: (e: MouseEvent) => void
}

const m: EventMap = {
  click: (e: KeyboardEvent) => e.key   // ⚠️ TS l'accepte par défaut
}
m.click(new MouseEvent("click"))       // 💥 e.key est undefined
```

Les **méthodes** (`click(e: ...): void` ou `click: (e: ...) => void` selon la syntaxe) sont **bivariantes** par défaut — TS accepte les deux directions de variance, ce qui est unsound.

`strictFunctionTypes: true` corrige les **types fonction** mais pas les **méthodes** explicitement (l'équipe TS l'a maintenu pour ne pas casser DOM, EventEmitter, etc.).

### Trou n°4 : `as` est du wishful thinking

```typescript
const x: unknown = "hello"
const n = x as number           // ✅ TS te fait confiance
n.toFixed(2)                     // 💥 RuntimeError

const data = JSON.parse(input) as User   // ⚠️ rien ne valide réellement
data.name.toUpperCase()                  // 💥 si data n'a pas de name
```

`as` est un **type assertion** : tu dis au compilateur "fais-moi confiance, je sais ce que c'est". Aucune vérification.

### Trou n°5 : `Object.keys` retourne `string[]`

```typescript
const u: User = { name: "Alice", age: 30 }
const keys = Object.keys(u)    // string[] — pas (keyof User)[]

for (const k of keys) {
  console.log(u[k])   // ❌ Element implicitly has an 'any' type
}
```

Ici TS est **sound** mais **frustrant**. La raison : un `User` peut au runtime être un `User & { extra: string }` upcasté, donc `Object.keys` peut retourner des clés inconnues.

Workaround usuel : `Object.keys(u) as (keyof User)[]` (et tu prends le risque).

### Trou n°6 : type narrowing perdu après une closure

```typescript
function process(x: string | null) {
  if (x === null) return
  
  setTimeout(() => {
    x.toUpperCase()    // ❌ TS oublie le narrow ici
  }, 100)
}
```

À l'intérieur d'une closure async, TS ne peut pas garantir que `x` n'a pas été réassigné dans le scope englobant. Le narrow est perdu.

### Trou n°7 : non-existence des branded types natifs

```typescript
type UserId = string   // c'est juste un alias de string
function getUser(id: UserId) { ... }
getUser("hello")       // ✅ TS accepte (any string is a UserId)
```

Pas de typage **nominal** natif. Pour l'avoir, il faut **simuler** :

```typescript
type UserId = string & { __brand: "UserId" }
```

C'est lourd mais ça marche.

### Trou n°8 : `Promise<T>` dans un `await` non synchronisé

```typescript
async function f(): Promise<number> {
  return Promise.resolve(42)   // OK : auto-unwrap
}

const n = await f()   // n: number — OK

// Mais
const p: Promise<number> = Promise.resolve(42)
await p
const x: Promise<number> = p   // ✅ — déjà résolu mais TS ne le sait pas
```

Sound dans la plupart des cas, mais peut surprendre quand tu mélanges `Promise.resolve(promise)` (auto-flatten en JS).

### Bonne pratique : préférer `unknown` à `any`

```typescript
// ❌ any désactive tout
function process(data: any) {
  return data.field.subfield   // 💥 si data ne matche pas
}

// ✅ unknown force le narrow
function process(data: unknown) {
  if (typeof data === "object" && data !== null && "field" in data) {
    // narrow ici
  }
}

// ✅ Encore mieux : validation runtime
function process(data: unknown) {
  const valid = MySchema.parse(data)   // throw si invalide
  return valid.field.subfield
}
```

`unknown` te **force** à narrow avant usage. C'est `any` "responsable".

### Bonne pratique : valider les bords du système

```typescript
import { z } from "zod"

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
})

// À chaque "bord" : I/O réseau, lecture de fichier, query DB, env vars
async function fetchUser(id: string) {
  const res = await fetch(`/users/${id}`)
  const json = await res.json()
  return UserSchema.parse(json)   // ✅ runtime validé, type sûr ensuite
}
```

À l'intérieur du système : tu fais confiance au type. Aux **bords** (network, FS, env, JSON, DOM input) : **valider**.

### Mauvaise pratique : `as` partout

```typescript
// ❌ Tu mens au compilateur
const data = JSON.parse(input) as User
const list = something as Array<User>
const event = e as MouseEvent
```

Chaque `as` est une **dette** : au runtime, ça peut planter. Si tu en mets 50 dans un projet, tu n'as plus rien de garanti.

### Mauvaise pratique : `any` par paresse

```typescript
// ❌ "Je verrai plus tard"
function handle(data: any) {
  return data.something.complicated.path
}
```

`any` se **propage** : tout ce qui touche `data` devient `any`. Tu obtiens un projet "TypeScript en façade, JS au fond."

### Comparer à Flow (le concurrent perdu)

Flow (Facebook) avait fait le choix inverse — **soundness max** :
- Variance correcte sur tout
- Pas de méthodes bivariantes
- `Object.keys` retournait des types précis
- `any` (`mixed` chez eux) était plus strict

Résultat : Flow était plus rigoureux mais **moins ergonomique**. La courbe d'apprentissage était raide, les annotations plus verbeuses, l'écosystème JS plus lent à adopter. TS a gagné par **DX**.

### Le futur : `--exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`

Depuis 2022, TS pousse des **flags opt-in** pour devenir progressivement plus sound :

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,    // arr[0] retourne T | undefined
    "exactOptionalPropertyTypes": true   // { x?: T } ≠ { x: T | undefined }
  }
}
```

Active-les progressivement. Plus de soundness sans break global.

## Exemple concret

### Cas réel : un bug en prod via `as`

```typescript
// utils.ts
const config = JSON.parse(env.CONFIG) as Config
const port = config.port        // type: number

// runtime
// CONFIG="{}" → config = {} → port = undefined
// app.listen(port)  → 💥 throw au démarrage
```

Le bug : `as Config` n'a rien validé. `port` est `undefined` malgré le type `number`. Solution : **toujours valider** les env vars / config / payloads avec zod.

### Cas réel : `any` qui se propage en NestJS

```typescript
// Une fois utilisé dans une signature, l'any se propage
function legacyApiCall(): any { ... }

const data = legacyApiCall()        // any
const items = data.items.map(...)   // any
items.forEach(item => item.name)    // any partout
```

Un `any` quelque part contamine **toute la chaîne**. Toujours coller un type au plus tôt :

```typescript
function legacyApiCall(): unknown { ... }
const data = legacyApiCall()
const validated = ApiResponseSchema.parse(data)
const items = validated.items     // type précis ici
```

### Cas réel : array covariance qui mord

```typescript
function logAll(items: { id: string }[]) {
  items.push({ id: "added", extra: "snuck in" } as { id: string })  // ⚠️
}

const users: User[] = [{ id: "u1", name: "Alice", age: 30 }]
logAll(users)   // ✅ User[] <: { id: string }[] (covariant)

// Maintenant users[1] est { id: "added" } — pas un vrai User
const u: User = users[1]     // ✅ TS le type User
u.name.toUpperCase()         // 💥 undefined
```

C'est ce qui rend les **mutating arrays** dangereux quand on les passe à des fonctions qui peuvent y écrire.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-variance-decrit-comment-les-sous-types-se-propagent-dans-les-generiques" data-wiki-title="Concept - La variance décrit comment les sous-types se propagent dans les génériques" data-wiki-preview="La **variance** est la règle qui décide, **quand `Cat &lt;: Animal`, si `F&lt;Cat&gt;` est un sous-type de `F&lt;Animal&gt;`** — selon que `T` est utilisé en **sortie** (covariant), en **entrée** (contravariant) ou aux deux (invariant).">Concept - La variance décrit comment les sous-types se propagent dans les génériques</a> *(la covariance des arrays est l'unsoundness canonique de TS)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema" data-wiki-title="Concept - zod unifie validation runtime et types compile-time depuis un seul schéma" data-wiki-preview="**zod** te permet de définir un schéma **une seule fois** qui sert simultanément de **validateur runtime** (parse, refine, transform) et de **source de type TypeScript** (via `z.infer&lt;...&gt;`) — éliminant la double maintenance des `interface…">Concept - zod unifie validation runtime et types compile-time depuis un seul schéma</a> *(zod est la réponse pratique aux trous de TS aux bords du système)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion" data-wiki-title="Concept - Le pattern Result encode l'erreur dans le type de retour pour forcer la gestion" data-wiki-preview="Le pattern **Result** (ou **Either**, ou **Try**) consiste à modéliser une fonction &quot;qui peut échouer&quot; non pas via `throw`, mais via un **type de retour union** — `Result&lt;T, E&gt; = { ok: true; value: T } | { ok: false; error: E }` — ce qui fo…">Concept - Le pattern Result encode l'erreur dans le type de retour pour forcer la gestion</a> *(une discipline pour traiter unknown comme valeur typée)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/try-catch-impose-un-narrow-manuel-et-ne-documente-rien-dans-la-signature" data-wiki-title="Concept - try/catch impose un narrow manuel et ne documente rien dans la signature" data-wiki-preview="En TypeScript, `catch (err)` reçoit l'erreur typée `unknown` (avec `useUnknownInCatchVariables`) — il faut **narrower manuellement** avant de l'utiliser, et la signature de la fonction qui throw **ne mentionne rien** : le caller ne sait pas…">Concept - try/catch impose un narrow manuel et ne documente rien dans la signature</a> *(autre cas où TS perd l'info aux frontières)*

**Prérequis** :
- Bases TS (annotations, génériques, narrow)

**S'oppose à / à comparer avec** :
- **Flow (Facebook)** : plus sound, perdu la guerre d'adoption
- **Rust** : sound (par construction, pas de any), mais courbe d'apprentissage abrupte
- **Haskell / OCaml** : full soundness via Hindley-Milner, mais inférence pas adaptée à JS dynamique
- **Python + Pyright** : annotations optionnelles + checker, choix similaire à TS

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-typescript-types-avances-de-la-variance-aux-hkt" data-wiki-title="TypeScript types avancés — de la variance aux Higher-Kinded Types" data-wiki-preview="1. **Variance** : si `Cat &lt;: Animal`, est-ce que `Container&lt;Cat&gt; &lt;: Container&lt;Animal&gt;` ? Ça dépend de la **position** de `T` (input = contravariant, output = covariant). C'est le coeur des erreurs de génériques. 2. **Types conditionnels** (…">TypeScript types avancés — de la variance aux Higher-Kinded Types</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>
<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

