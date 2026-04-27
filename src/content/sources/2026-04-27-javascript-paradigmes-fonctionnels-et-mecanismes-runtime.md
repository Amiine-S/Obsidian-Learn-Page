---
title: JavaScript — paradigmes fonctionnels et mécanismes runtime
author: Claude (synthèse)
digested: 2026-04-27T00:00:00.000Z
format: doc
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/intermediate
slug: 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
excerpt: >-
  1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP /
  pipeline, dangereux en code applicatif (illisible si abusé). 2.
  **Composition** chaîne des fonctions pures `g(f(x))` — la base du style "data
  → pipeline" (RxJS, Effect, lodash/fp). 3. **Iterators / Generators
related:
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - le-currying-transforme-une-fonction-n-aire-en-chaine-unaire
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - les-generators-produisent-des-valeurs-a-la-demande-avec-yield
  - le-module-system-esm-isole-les-fichiers-et-lie-les-imports-statiquement
  - le-shadow-dom-encapsule-style-et-structure-pour-empecher-les-fuites
  - frontend
  - architecture-fondamentaux
backlinks:
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - le-currying-transforme-une-fonction-n-aire-en-chaine-unaire
  - le-global-execution-context-est-l-environnement-racine-de-tout-module
  - le-module-system-esm-isole-les-fichiers-et-lie-les-imports-statiquement
  - le-shadow-dom-encapsule-style-et-structure-pour-empecher-les-fuites
  - les-generators-produisent-des-valeurs-a-la-demande-avec-yield
topics:
  - frontend
---
## Pourquoi cette source

> Suite logique du digest <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-javascript-en-profondeur-concepts-mal-connus" data-wiki-title="JavaScript en profondeur — concepts mal connus" data-wiki-preview="1. **L'event loop** est le cœur de tout — comprendre microtasks vs macrotasks, et que `requestAnimationFrame` n'est ni l'un ni l'autre, change ta façon de débugger. 2. **`this`** n'est PAS lié à la définition d'une fonction — il est lié à *…">JavaScript en profondeur — concepts mal connus</a>. Cette fois on attaque les **paradigmes fonctionnels** (currying, composition, generators) et les **mécanismes runtime moins visibles** (Global Execution Context, module system, Shadow DOM). L'objectif : avoir une connaissance opérationnelle de ces concepts, avec **bonne pratique vs mauvaise pratique** sur chaque sujet — pas de théorie pour la théorie.

## Résumé en 5 lignes

1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP / pipeline, dangereux en code applicatif (illisible si abusé).
2. **Composition** chaîne des fonctions pures `g(f(x))` — la base du style "data → pipeline" (RxJS, Effect, lodash/fp).
3. **Iterators / Generators (`function*`)** produisent des valeurs **à la demande** avec `yield` — base de `for..of`, du spread, des async iterators et de Effect-TS.
4. **Global Execution Context** = le scope racine où tout module commence — `this` y vaut `undefined` en module, l'ordre des imports y règne.
5. **Module system** : ESM lie les imports **avant** d'exécuter le code (live bindings), CommonJS les copie au moment du `require`. **Shadow DOM** : encapsulation native (style + DOM) pour les Web Components, élimine les fuites CSS.

---

## 1. Currying — l'art de l'application partielle

### L'idée

```typescript
// Forme classique : 3 arguments d'un coup
function add(a: number, b: number, c: number) { return a + b + c }
add(1, 2, 3)  // 6

// Forme curryée : une chaîne de fonctions à 1 argument chacune
const addCurried = (a: number) => (b: number) => (c: number) => a + b + c
addCurried(1)(2)(3)  // 6
```

Le **gain** : on peut **fixer une partie des arguments** plus tôt et passer la fonction "préparée" plus loin.

```typescript
const addFive = addCurried(5)        // (b) => (c) => 5 + b + c
const addFiveAndTen = addFive(10)    // (c) => 15 + c
addFiveAndTen(2)                     // 17
```

### Bonne pratique : préapplication ciblée

```typescript
// ✅ Logger configuré une fois, utilisé partout
const log = (level: string) => (tag: string) => (msg: string) =>
  console.log(`[${level}] [${tag}] ${msg}`)

const logError = log("error")
const logErrorAuth = logError("auth")

logErrorAuth("token expired")
logErrorAuth("invalid signature")
// On évite de répéter "error" et "auth" à chaque appel
```

C'est le pattern utilisé par les libs comme **Ramda**, **lodash/fp**, **Effect**. La signature `(config) => (input) => result` est partout en FP.

### Mauvaise pratique : tout currier par dogme

```typescript
// ❌ Pas de gain — un fan de FP qui force le style
const greet = (greeting: string) => (firstName: string) => (lastName: string) =>
  `${greeting}, ${firstName} ${lastName}`

greet("Hello")("Alice")("Smith")
// Aucune préapplication réelle, juste plus dur à lire qu'un `(g, fn, ln) => ...`
```

Le currying **n'est utile que si** :
1. Tu vas réellement préappliquer (sinon `(a, b, c) => …` est plus simple)
2. Tu composes la fonction dans un pipeline (`pipe(f1, f2, f3)`)

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-currying-transforme-une-fonction-n-aire-en-chaine-unaire" data-wiki-title="Concept - Le currying transforme une fonction n-aire en chaîne unaire" data-wiki-preview="Le **currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — une chaîne de fonctions à un seul argument — afin de permettre la **préapplication partielle** des arguments et la **composition** dans des pipelines fonctionnels.">Concept - Le currying transforme une fonction n-aire en chaîne unaire</a>

---

## 2. Composition — le data-flow propre

### L'idée

Composer = **enchaîner** des fonctions où la sortie de l'une devient l'entrée de la suivante.

```typescript
const trim = (s: string) => s.trim()
const lower = (s: string) => s.toLowerCase()
const slugify = (s: string) => s.replace(/\s+/g, "-")

// Sans composition (verbeux)
const pretty = (s: string) => slugify(lower(trim(s)))

// Avec un helper compose (right-to-left)
const compose = <A, B, C, D>(f: (c: C) => D, g: (b: B) => C, h: (a: A) => B) =>
  (a: A) => f(g(h(a)))

const pretty2 = compose(slugify, lower, trim)

// Avec pipe (left-to-right, plus lisible)
const pipe = <A, B, C, D>(h: (a: A) => B, g: (b: B) => C, f: (c: C) => D) =>
  (a: A) => f(g(h(a)))

const pretty3 = pipe(trim, lower, slugify)
pretty3("  Hello World  ")  // "hello-world"
```

### Bonne pratique : pipeline lisible avec `pipe`

```typescript
// ✅ Style "data-first" — la valeur traverse le pipeline
import { pipe } from "effect/Function"

const result = pipe(
  rawUser,
  validate,
  normalize,
  saveToDb,
)
```

C'est exactement le style **Effect-TS**, **RxJS** (`obs.pipe(map, filter, scan)`), **lodash/fp**. On lit de haut en bas comme une recette.

### Mauvaise pratique : composition profonde sans pipe

```typescript
// ❌ Difficile à lire et à débugger
const result = saveToDb(normalize(validate(parseJson(decodeBase64(input)))))
```

À 3+ fonctions, **toujours utiliser `pipe`** : tu peux insérer un `tap(console.log)` au milieu pour débugger sans réorganiser.

### Composition + Currying = combo de FP

```typescript
const map = <A, B>(f: (a: A) => B) => (arr: A[]) => arr.map(f)
const filter = <A>(p: (a: A) => boolean) => (arr: A[]) => arr.filter(p)

// Currying rend les fonctions composables
const result = pipe(
  [1, 2, 3, 4, 5],
  filter((n: number) => n % 2 === 0),
  map((n: number) => n * 10),
)
// [20, 40]
```

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-composition-de-fonctions-chaine-des-transformations-en-pipeline" data-wiki-title="Concept - La composition de fonctions chaîne des transformations en pipeline" data-wiki-preview="**Composer**, c'est combiner deux ou plusieurs fonctions de sorte que la **sortie de l'une devienne l'entrée de la suivante** — `compose(f, g)(x) = f(g(x))` ou plus lisiblement `pipe(x, g, f)` — afin de modéliser un programme comme un **pip…">Concept - La composition de fonctions chaîne des transformations en pipeline</a>

---

## 3. Iterators et Generators — les valeurs à la demande

### Le protocole iterator

Un objet est **iterable** s'il implémente `Symbol.iterator`, qui retourne un **iterator** (objet avec une méthode `next()` qui renvoie `{ value, done }`).

```typescript
const myIterable = {
  [Symbol.iterator]() {
    let i = 0
    return {
      next() {
        return i < 3
          ? { value: i++, done: false }
          : { value: undefined, done: true }
      }
    }
  }
}

for (const x of myIterable) console.log(x)  // 0, 1, 2
```

C'est ce protocole qui fait fonctionner :
- `for..of`
- Le spread `[...x]`
- La déstructuration `const [a, b] = x`
- `Map`, `Set`, `Array.from`

### Generators : iterators à syntaxe naturelle

```typescript
function* range(start: number, end: number, step = 1) {
  for (let i = start; i < end; i += step) yield i
}

for (const n of range(0, 10, 2)) console.log(n)  // 0, 2, 4, 6, 8
[...range(0, 5)]  // [0, 1, 2, 3, 4]
```

`function*` retourne un objet qui est **à la fois** iterable ET iterator. `yield` met la fonction en pause, retourne la valeur, et reprend au prochain `next()`.

### Bonne pratique : streams paresseux

```typescript
// ✅ Stream infini, on ne consomme que ce qu'on veut
function* naturals() {
  let n = 1
  while (true) yield n++
}

function* take<T>(it: Iterable<T>, n: number) {
  let i = 0
  for (const x of it) {
    if (i++ >= n) return
    yield x
  }
}

[...take(naturals(), 5)]  // [1, 2, 3, 4, 5]
```

Sans generator, tu ne peux **pas** modéliser un stream infini en JS.

### Bonne pratique : parcours d'arbres / DFS

```typescript
type Tree = { value: number; children: Tree[] }

function* walk(t: Tree): Generator<number> {
  yield t.value
  for (const c of t.children) yield* walk(c)  // yield* délégue
}

const tree: Tree = { value: 1, children: [
  { value: 2, children: [{ value: 4, children: [] }] },
  { value: 3, children: [] },
]}

[...walk(tree)]  // [1, 2, 4, 3] — DFS
```

### Mauvaise pratique : générer une collection finie petite

```typescript
// ❌ Aucun bénéfice — un simple .map suffit
function* doubled(arr: number[]) {
  for (const x of arr) yield x * 2
}
[...doubled([1, 2, 3])]  // [2, 4, 6]

// ✅ Mieux
[1, 2, 3].map(x => x * 2)
```

### Async generators (`async function*`)

```typescript
async function* fetchPages(url: string) {
  let next: string | null = url
  while (next) {
    const res = await fetch(next)
    const data = await res.json()
    yield data.items
    next = data.nextUrl
  }
}

for await (const items of fetchPages("/api/users")) {
  console.log(items)  // page par page, à la demande
}
```

C'est **la** façon moderne de paginer une API en JS.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-generators-produisent-des-valeurs-a-la-demande-avec-yield" data-wiki-title="Concept - Les generators produisent des valeurs à la demande avec yield" data-wiki-preview="Une fonction **generator** (`function*`) produit une suite de valeurs **paresseusement** : chaque `yield` met l'exécution en pause et la reprend au prochain `next()`, ce qui permet de modéliser des séquences potentiellement **infinies**, de…">Concept - Les generators produisent des valeurs à la demande avec yield</a>

---

## 4. Global Execution Context — le scope racine

### Qu'est-ce que c'est

Quand un script ou un module commence à s'exécuter, le moteur crée un **Global Execution Context** : c'est l'environnement dans lequel les variables top-level vivent et où le code s'exécute par défaut.

Trois éléments :
1. **Variable Environment** — où vivent les `var`, les déclarations `function`
2. **Lexical Environment** — où vivent les `let`, `const`, `class`
3. **`this`** — dépend du contexte (script vs module)

```typescript
// Script (non-module, balise <script> sans type="module")
var a = 1
console.log(this === window)  // true (browser) — this = global
console.log(window.a === 1)   // true — var top-level pollue window

// Module (ESM, .mjs ou type="module")
var b = 1
console.log(this)             // undefined — this = undefined dans un module
console.log((window as any).b) // undefined — pas de pollution
```

### Bonne pratique : toujours en module

Tout projet TS/JS moderne (Vite, esbuild, Node récent, Next, etc.) est en **module ESM**. Conséquences :
- `this` top-level = `undefined`
- Pas de pollution de `window` / `global`
- `import`/`export` plutôt que `require`/`module.exports`
- Code en strict mode automatique

### Mauvaise pratique : code "global" implicite

```typescript
// ❌ Dans un script classique, ce `var` devient une propriété de window
// → conflits, fuites, pollution
var apiKey = "abc"

// ✅ Dans un module, ça reste local au module
export const apiKey = "abc"
```

### Le piège : les imports circulaires

```typescript
// a.ts
import { b } from "./b"
export const a = b + 1

// b.ts
import { a } from "./a"
export const b = a + 1
```

Au chargement, l'un des deux modules verra l'autre **partiellement initialisé** (TDZ). Symptôme : `Cannot access 'X' before initialization`. Solution : casser le cycle en extrayant un module commun.

→ <span class="wikilink-broken" title="Référence non trouvée : Concept - Le Global Execution Context est l'environnement racine où tout module s'exécute">Concept - Le Global Execution Context est l'environnement racine où tout module s'exécute</span>

---

## 5. Module system — ESM vs CommonJS

### Le contraste fondamental

| | CommonJS (Node legacy) | ESM (standard) |
|---|---|---|
| Syntaxe | `require()` / `module.exports` | `import` / `export` |
| Moment de résolution | Runtime (à l'appel) | Static (au parse) |
| Liaison | Copie de valeur | **Live binding** (référence) |
| Tree-shaking | Difficile (dynamique) | Naturel (statique) |
| Top-level `await` | ❌ | ✅ |
| Hoisting | `require` n'est pas hoisté | `import` est hoisté |

### Live binding ESM — la subtilité importante

```typescript
// counter.mjs
export let count = 0
export function inc() { count++ }

// main.mjs
import { count, inc } from "./counter.mjs"
console.log(count)  // 0
inc()
console.log(count)  // 1 ← l'import voit la nouvelle valeur (live binding)
```

En **CommonJS**, `count` aurait été copié, donc resté à 0 dans `main.mjs`. C'est une **différence sémantique** que beaucoup de devs ignorent.

### Bonne pratique : exports nommés > export default

```typescript
// ✅ Nommé : tree-shakable, refactor facile, IDE-friendly
export function fetchUser() { ... }
export function fetchPost() { ... }

// ⚠️ Default : OK pour un point d'entrée unique, sinon évite
export default { fetchUser, fetchPost }
```

Les **exports nommés** sont préférés en 2026 :
- Le bundler peut éliminer les fonctions non utilisées (tree-shaking)
- Renommer une fonction met à jour tous les imports automatiquement
- Pas d'ambiguïté à l'import (`import { x }` vs `import default as x`)

### Mauvaise pratique : mélanger `require` et `import`

```typescript
// ❌ Dans un projet ESM, ne pas faire ça
const lodash = require("lodash")  // ❌ ReferenceError en module

// ✅ Importer, et si la dep est CJS, Node fait le bridge
import lodash from "lodash"
```

### Dynamic imports — chargement à la demande

```typescript
// Lazy-load d'un module lourd seulement si l'utilisateur ouvre la page Stats
async function showStats() {
  const { renderChart } = await import("./chart-heavy.js")
  renderChart()
}
```

Base du **code-splitting** (Vite, Webpack, esbuild). Indispensable pour les PWA / SPA en 2026.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-module-system-esm-isole-les-fichiers-et-lie-les-imports-statiquement" data-wiki-title="Concept - Le module system ESM isole les fichiers et lie les imports statiquement" data-wiki-preview="**ESM** (`import` / `export`) lie les dépendances **avant** d'exécuter le code (résolution statique, **live bindings**, tree-shaking naturel) — par opposition à **CommonJS** (`require` / `module.exports`) qui résout les dépendances **au mom…">Concept - Le module system ESM isole les fichiers et lie les imports statiquement</a>

---

## 6. Shadow DOM — l'encapsulation native

### Le problème qu'il résout

Tout est global dans le DOM classique :
- Un `class="button"` peut entrer en conflit entre composants
- `:root { color: red }` repeint tout
- Un script peut sélectionner `document.querySelector("input")` n'importe où

→ Pour les **Web Components**, il faut une vraie isolation. C'est le rôle du Shadow DOM.

### L'idée

```typescript
class MyButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" })
    shadow.innerHTML = `
      <style>
        button { background: blue; color: white; }
      </style>
      <button><slot></slot></button>
    `
  }
}
customElements.define("my-button", MyButton)
```

```html
<my-button>Click me</my-button>
```

Le `<style>` à l'intérieur du shadow tree **ne fuit pas** vers le document — et le CSS du document **ne pénètre pas** (sauf variables CSS et propriétés héritées contrôlées).

### Bonne pratique : Web Components réutilisables

```typescript
// ✅ Composant publié comme lib UI — aucune fuite CSS, fonctionne dans n'importe quelle page
class CardModal extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host { display: block; padding: 16px; }
        .title { font-weight: bold; }
      </style>
      <div class="title"><slot name="title"></slot></div>
      <slot></slot>
    `
  }
}
```

Tu peux distribuer `<card-modal>` à n'importe quel projet (React, Vue, Angular, vanilla) — le style reste isolé.

### Mauvaise pratique : Shadow DOM dans une app React/Vue

```typescript
// ❌ Inutile et contre-productif
function MyComponent() {
  // Tu n'as pas besoin de Shadow DOM — le scoping CSS de ton framework
  // (CSS Modules, Vue scoped, styled-components) suffit
}
```

Shadow DOM = **pour les composants réutilisables cross-framework** (Web Components). Dans une app React où tu contrôles tout, il complique pour rien (`querySelector` ne traverse pas le shadow, `getComputedStyle` est différent, etc.).

### `mode: "open"` vs `"closed"`

```typescript
const shadow = this.attachShadow({ mode: "open" })   // accessible via this.shadowRoot
const shadow = this.attachShadow({ mode: "closed" }) // shadowRoot toujours null depuis l'extérieur
```

**`open` est la convention** — `closed` n'est pas un mécanisme de sécurité (un attaquant peut intercepter `attachShadow`) et bloque les outils de debug.

### Cas d'usage modernes

- **Design systems** (Adobe Spectrum, Lit-based libs)
- **Embeds tiers** (un player vidéo dans un blog : Shadow DOM empêche le CSS du blog de péter le player)
- **Browser extensions** qui injectent des UI dans des pages existantes

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-shadow-dom-encapsule-style-et-structure-pour-empecher-les-fuites" data-wiki-title="Concept - Le Shadow DOM encapsule style et structure pour empêcher les fuites" data-wiki-preview="Le **Shadow DOM** est une API navigateur qui crée un **sous-arbre DOM isolé** attaché à un élément hôte — son CSS et son DOM **ne fuient pas** vers le document, et le CSS du document **ne pénètre pas** sauf via les variables CSS et les prop…">Concept - Le Shadow DOM encapsule style et structure pour empêcher les fuites</a>

---

## 7. La hiérarchie d'importance

Si tu pratiques ces concepts dans un ordre :

1. **Composition + currying** — change ta façon d'écrire des pipelines, base de RxJS/Effect/lodash-fp
2. **Module system (ESM)** — tu utilises `import` tous les jours sans connaître les live bindings
3. **Generators / async generators** — pagination, streams, modélisation paresseuse
4. **Global Execution Context** — pour comprendre les imports circulaires et `this` top-level
5. **Shadow DOM** — niche (Web Components), à connaître mais à utiliser avec parcimonie

---

## Citations brutes

> *"Currying is the technique of translating a function that takes multiple arguments into a sequence of families of functions, each taking a single argument."* — Wikipedia

> *"Composition is the essence of programming."* — Bartosz Milewski

---

## À explorer ensuite

- **Iterator helpers** (Stage 4 TC39) : `iterator.map().filter().toArray()` natif
- **Records & Tuples** : valeurs immutables, comparable par valeur
- **Decorators** (TC39 Stage 3) : implémentation native vs TS legacy
- **`Reflect` et metaprogramming**
- **Web Components avancés** : Form-Associated Custom Elements, ElementInternals

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>
<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

