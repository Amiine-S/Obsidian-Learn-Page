---
title: JavaScript en profondeur — concepts mal connus
author: Claude (synthèse)
digested: 2026-04-26T00:00:00.000Z
format: doc
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/intermediate
slug: 2026-04-26-javascript-en-profondeur-concepts-mal-connus
excerpt: >-
  1. **L'event loop** est le cœur de tout — comprendre microtasks vs macrotasks,
  et que `requestAnimationFrame` n'est ni l'un ni l'autre, change ta façon de
  débugger. 2. **`this`** n'est PAS lié à la définition d'une fonction — il est
  lié à **comment elle est appelée**. C'est la so
related:
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - >-
    les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses
  - la-chaine-de-prototypes-structure-l-heritage-en-javascript
  - frontend
  - architecture-fondamentaux
backlinks:
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - la-chaine-de-prototypes-structure-l-heritage-en-javascript
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - >-
    les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
topics:
  - frontend
---
## Pourquoi cette source

> Reprendre **JavaScript de zéro**, mais en visant les **concepts que la majorité des devs JS ne maîtrisent pas vraiment** — ceux qui produisent des bugs étranges, des questions piégeuses en entretien, ou des mésententes architecturales. C'est le socle qu'on ne vous enseigne pas dans les bootcamps mais qui distingue un dev qui "code en JS" d'un dev qui "comprend JS".

## Résumé en 5 lignes

1. **L'event loop** est le cœur de tout — comprendre microtasks vs macrotasks, et que `requestAnimationFrame` n'est ni l'un ni l'autre, change ta façon de débugger.
2. **`this`** n'est PAS lié à la définition d'une fonction — il est lié à **comment elle est appelée**. C'est la source #1 de bugs JS.
3. **Le hoisting** déplace les *déclarations* en haut du scope, mais pas leurs *valeurs* — d'où la TDZ (`Temporal Dead Zone`) pour `let`/`const`.
4. **Les coercitions implicites** (`==`, `+`, `[] == ![]`) suivent des règles précises, mais piégeuses — d'où la règle **toujours `===`**, mais aussi : comprendre quand JS coerce malgré toi.
5. **Le prototype chain** est le mécanisme d'héritage **réel** de JS — les `class` ES6 sont du sucre syntaxique au-dessus. Comprendre `__proto__`, `Object.create`, `prototype`, c'est comprendre l'OO en JS.

---

## 1. L'event loop — la mécanique cachée derrière `async`

JS est **mono-thread**. Pourtant tu fais des `fetch`, des `setTimeout`, des promises, des `await`. Comment ?

### Les pièces

```
┌──────────────────────────────────────────────┐
│  CALL STACK (le code en cours d'exécution)   │
└──────────────────────────────────────────────┘
              ↑
              │ pop quand pile vide
              │
┌──────────────────────────────────────────────┐
│  MICROTASK QUEUE  (Promises, queueMicrotask) │ ← prioritaire
└──────────────────────────────────────────────┘
              ↑
              │ poll quand stack ET microtasks vides
              │
┌──────────────────────────────────────────────┐
│  MACROTASK QUEUE  (setTimeout, I/O, events)  │
└──────────────────────────────────────────────┘
```

**L'algorithme** (simplifié) :
1. Exécuter le code synchrone jusqu'à pile vide
2. **Vider toute** la microtask queue
3. Prendre **une seule** macrotask, l'exécuter
4. (Browser) Render si besoin
5. Goto 2

### Le piège classique

```typescript
console.log("1")
setTimeout(() => console.log("2"), 0)
Promise.resolve().then(() => console.log("3"))
console.log("4")

// Output: 1, 4, 3, 2
```

Pourquoi ? Synchrone d'abord (1, 4), puis microtasks (Promise → 3), enfin macrotasks (setTimeout → 2). Même avec `0ms`, `setTimeout` arrive après la microtask.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks" data-wiki-title="Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks" data-wiki-preview="L'**event loop JS** alterne : exécuter le code synchrone jusqu'à pile vide, **vider toute la microtask queue** (Promises, `queueMicrotask`), prendre **une seule** macrotask (`setTimeout`, événements DOM, I/O), puis recommencer — c'est cette…">Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks</a>

### Astuces moins connues

- `queueMicrotask(fn)` ajoute fn à la microtask queue, comme une promise déjà résolue
- `requestAnimationFrame(fn)` est dans **un autre type** de queue, lié au cycle de rendu (16ms à 60Hz)
- `MutationObserver` callbacks sont microtasks (utile pour les patches DOM)
- **Une boucle infinie de microtasks bloque les macrotasks** — d'où des bugs de UI freeze sans CPU à 100%

---

## 2. `this` — défini à l'appel, pas à la définition

L'erreur la plus fréquente : croire que `this` est lié à la fonction au moment où on l'écrit. **Faux.** `this` est lié au moment où on **appelle** la fonction, et il dépend de **comment** on l'appelle.

```typescript
const obj = {
  name: "Alice",
  greet() { return `Hi, ${this.name}` }
}

obj.greet()                    // "Hi, Alice"  — appel via `obj.` → this = obj
const fn = obj.greet
fn()                           // "Hi, undefined" — appel "nu" → this = undefined (ou window en non-strict)

const bound = obj.greet.bind(obj)
bound()                        // "Hi, Alice"  — bind locks this
```

### Les 4 règles de binding

| Mode d'appel | `this` est... |
|---|---|
| `fn()` (call site nu) | `undefined` (strict) ou global (non-strict) |
| `obj.fn()` | `obj` |
| `fn.call(ctx, ...)` / `fn.apply(ctx, [...])` | `ctx` |
| `new Fn()` | un nouvel objet vide (puis le constructeur le remplit) |

### Les arrow functions changent tout

```typescript
const obj = {
  name: "Alice",
  greet: () => `Hi, ${this.name}` // ← arrow : this lexical, pas dynamique
}

obj.greet() // "Hi, undefined" — this = scope englobant (ici module/window)
```

**Arrow functions n'ont pas de `this` propre** — elles utilisent celui du scope englobant. C'est pour ça qu'on les utilise dans les callbacks d'event handlers React : pas besoin de `.bind(this)`.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/this-en-javascript-depend-du-site-d-appel-pas-de-la-definition" data-wiki-title="Concept - this en JavaScript dépend du site d'appel pas de la définition" data-wiki-preview="Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas lié à la définition d'une fonction** — il est lié au **site d'appel** (où et comment la fonction est invoquée), ce qui produit des comportements surprenants quand…">Concept - this en JavaScript dépend du site d'appel pas de la définition</a>

---

## 3. Hoisting et Temporal Dead Zone

Le hoisting est cette propriété par laquelle JavaScript **"remonte"** les déclarations en haut de leur scope. Mais ce qui est hoisté **diffère** entre `var`, `let`/`const`, et `function`.

```typescript
// `var` : déclaration hoistée, valeur = undefined
console.log(a) // undefined  (pas une erreur !)
var a = 1

// `function` : déclaration ET corps hoistés
foo()           // "hi"
function foo() { console.log("hi") }

// `let` / `const` : déclaration hoistée, mais zone interdite jusqu'au let
console.log(b) // ❌ ReferenceError: Cannot access 'b' before initialization
let b = 1

// `let` arrow function : déclaration hoistée, valeur = uninitialized (TDZ)
bar()           // ❌ ReferenceError
const bar = () => console.log("hi")
```

### La Temporal Dead Zone (TDZ)

Entre le début du scope et la déclaration `let`/`const`, la variable **existe** (le moteur l'a réservée) mais l'accéder **lance une erreur**. C'est volontaire — empêche les bugs subtils de "j'utilise avant déclaration."

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs" data-wiki-title="Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs" data-wiki-preview="Le **hoisting** est le mécanisme par lequel JS &quot;remonte&quot; les **déclarations** de variables et fonctions en haut de leur scope, mais pas leurs **valeurs** — d'où le piège classique : `var` est `undefined` avant son `=`, alors que `let`/`cons…">Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs</a>

### Pourquoi c'est important même en 2026

Tu utilises `const` partout, donc plus de TDZ ? Faux :
- En **module top-level**, l'ordre de déclaration importe (cycles d'import → bugs)
- Dans une **classe**, les méthodes sont accessibles depuis le constructeur, mais pas tous les fields
- Dans des **eval / Function() / dynamic imports**, le hoisting peut surprendre

---

## 4. Coercitions implicites — `==`, `+`, et leurs surprises

JS coerce automatiquement les types dans plein d'opérateurs. **Toujours utiliser `===`** est la règle. Mais comprendre les coercitions reste utile, parce que `+`, `<`, `*`, et le contexte conditionnel (`if (x)`, `!x`) coerce aussi.

### `==` vs `===`

```typescript
0 == ""        // true  (coerce les deux en number 0)
0 == "0"       // true  (idem)
0 == false     // true
"" == false    // true
null == undefined  // true (cas spécial)
NaN == NaN     // false (NaN n'est égal à rien, même pas à lui-même)
[] == false    // true  ([].toString() === "" → 0 → 0 == 0)
[] == ![]      // true  (![] est false → 0, [] coerce en 0 → true)
```

**Solution** : toujours `===` et `!==`. La règle est non-négociable en code production.

### `+` ambigu

```typescript
1 + 2       // 3 (number + number)
"1" + 2     // "12" (string si l'un des opérandes est string)
1 + "2"     // "12"
"1" - 2     // -1 (- force la coercion en number)
1 + null    // 1 (null → 0)
1 + undefined  // NaN (undefined → NaN)
1 + true    // 2 (true → 1)
[1, 2] + [3, 4]  // "1,23,4" (les arrays sont stringifiées)
```

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses" data-wiki-title="Concept - Les coercitions implicites de JavaScript suivent des règles précises mais piégeuses" data-wiki-preview="JS effectue des **conversions de type implicites** dans plein d'opérations (`==`, `+`, `-`, `&lt;`, `if (x)`, `!x`) — ces règles sont **déterministes et documentées**, mais leur côté contre-intuitif (`[] == ![]`, `&quot;0&quot; == false`) est la raison…">Concept - Les coercitions implicites de JavaScript suivent des règles précises mais piégeuses</a>

### Truthy / Falsy

Falsy values (les seules) :
```typescript
false, 0, -0, 0n, "", null, undefined, NaN, document.all
```

Tout le reste est truthy, **y compris** :
```typescript
if ("0") {}      // true (string non-vide)
if ([]) {}       // true (array même vide est truthy)
if ({}) {}       // true (object même vide est truthy)
if (-1) {}       // true (nombre non-zero)
```

Le fait que `[]` et `{}` soient truthy mais `[] == false` soit true illustre bien la **séparation** entre coercion booléenne (`if`, `!`) et coercion comparative (`==`).

---

## 5. Prototype chain — l'héritage réel

Les `class` ES6 sont du **sucre syntaxique**. En dessous, c'est toujours du **prototype chain** depuis 1995.

```typescript
class Animal {
  constructor(public name: string) {}
  speak() { return `${this.name} makes a sound` }
}

class Dog extends Animal {
  bark() { return `${this.name} barks` }
}

const rex = new Dog("Rex")
rex.bark()   // "Rex barks"
rex.speak()  // "Rex makes a sound"
```

Sous le capot :
```
rex
 ↑ __proto__ →  Dog.prototype { bark, constructor }
                 ↑ __proto__ → Animal.prototype { speak, constructor }
                                ↑ __proto__ → Object.prototype { toString, ... }
                                               ↑ __proto__ → null
```

Quand tu appelles `rex.speak()`, JS :
1. Cherche `speak` sur `rex` → pas trouvé
2. Cherche sur `rex.__proto__` (= `Dog.prototype`) → pas trouvé
3. Cherche sur `Dog.prototype.__proto__` (= `Animal.prototype`) → trouvé → exécute

C'est ça, le **prototype chain**.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-chaine-de-prototypes-structure-l-heritage-en-javascript" data-wiki-title="Concept - La chaîne de prototypes structure l'héritage en JavaScript" data-wiki-preview="En JS, **chaque objet pointe vers un autre objet** via `__proto__` (son prototype) — quand on accède à une propriété qui n'existe pas, le moteur **remonte la chaîne** jusqu'à la trouver ou jusqu'à `null` — c'est ce mécanisme de &quot;**prototype…">Concept - La chaîne de prototypes structure l'héritage en JavaScript</a>

### Sans `class`

```typescript
const animalProto = {
  speak() { return `${this.name} makes a sound` }
}

const dog = Object.create(animalProto)
dog.name = "Rex"
dog.speak() // "Rex makes a sound"
```

Pas de `class`, pas de `new`. Juste des objets liés.

---

## 6. Concepts bonus à connaître

### Les Symbols

```typescript
const id = Symbol("user-id")
const obj = { [id]: 42 }
obj[id] // 42 — clé unique, ne collisionne avec rien
```

Symbols permettent les "private fields" avant les vrais `#field`, et surtout les **well-known symbols** (`Symbol.iterator`, `Symbol.asyncIterator`).

### Iterators et generators

```typescript
function* range(start: number, end: number) {
  for (let i = start; i < end; i++) yield i
}

for (const n of range(0, 5)) console.log(n)
```

Les generators sont la **base** de tout `for..of`, du spread (`[...x]`), de RxJS, des async iterators (`for await`), et même du modèle Effect-TS.

### WeakRef et FinalizationRegistry

```typescript
const obj = { large: new Array(1e6) }
const ref = new WeakRef(obj)
// `ref` ne maintient pas obj en vie — si rien d'autre ne le tient, il sera GC'd
ref.deref() // l'objet ou undefined si GC

const reg = new FinalizationRegistry(name => console.log(`finalized ${name}`))
reg.register(obj, "myObj")
// Quand obj est GC, callback s'exécute (mais sans garantie de timing)
```

Apparu pour les caches, les bindings natifs (WASM), les libs réactives modernes. Peu utilisé en code applicatif, **très** important pour les libs.

### Tagged template literals

```typescript
function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "")
}

const name = "<script>"
html`Hello ${name}` // tu peux échapper / valider avant d'interpoler
```

C'est le mécanisme derrière `lit-html`, `styled-components`, `gql\`...\``.

### Proxies

```typescript
const obj = new Proxy({}, {
  get(target, prop) { console.log("get", prop); return target[prop] },
  set(target, prop, value) { console.log("set", prop, value); target[prop] = value; return true }
})

obj.foo = 1     // log: set foo 1
obj.foo         // log: get foo → 1
```

C'est ce qui permet la réactivité Vue 3, MobX, Immer. Outil méta-programmation puissant.

### TC39 nouveautés à surveiller (2026)

- **Records & Tuples** (Stage 2) : valeurs immutables natives `#{ a: 1 }`, `#[1, 2]`
- **Pipeline operator** (Stage 2) : `value |> fn1 |> fn2`
- **Iterator helpers** (Stage 4) : `iterator.map(...).filter(...).toArray()`
- **Temporal** (Stage 3) : remplaçant moderne de `Date` (enfin)
- **Pattern matching** (Stage 1) : `match (x) { ... }` à la Rust

---

## 7. La hiérarchie d'importance

Si tu devais pratiquer ces concepts dans un ordre :

1. **`this` et call site** — sans ça, tu galères tous les jours
2. **Event loop micro/macro** — sans ça, tu débugges du timing au pif
3. **Coercitions** — sans ça, tu écris des bugs `==` même en 2026
4. **Prototype chain** — sans ça, tu utilises `class` sans comprendre
5. **Hoisting / TDZ** — sans ça, les ordres d'init te piègent

Le reste (Symbols, Generators, Proxies, WeakRef) — utile à connaître, mais utilisable surtout dans les libs.

---

## Citations brutes

> *"JavaScript: the parts you didn't know you didn't know."* — esprit du livre **You Don't Know JS** (Kyle Simpson).

> *"Three rules of `this`: read the call site, read the call site, read the call site."*

---

## À explorer ensuite

- **Closures revisitées** : combo avec hoisting + scope chain (bon exercice : "implémenter `useState` à la main")
- **`Reflect`** — le pendant méta-prog des Proxies
- **`Symbol.iterator` / `Symbol.asyncIterator`** — implémenter ses propres iterables
- **L'algo de réconciliation V8** — comment le moteur optimise les hidden classes
- **Prototypal vs Class inheritance** — la confusion historique (Crockford l'a beaucoup écrit)
- **Module formats** : ESM vs CommonJS, `import.meta`, dynamic imports

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

