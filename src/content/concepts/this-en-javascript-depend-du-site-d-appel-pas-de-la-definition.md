---
created: 2026-04-26T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - this en JavaScript dépend du site d'appel pas de la définition
slug: this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
excerpt: >-
  C'est **la** source de bugs JS classique. Toute personne qui code JS finit par
  écrire `this is undefined` sans comprendre pourquoi. Comprendre les règles de
  binding te fait : - Lire correctement n'importe quel code JS classique -
  Savoir quand `bind`, `call`, `apply` sont nécessai
oneLiner: >-
  Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas
  lié à la définition d'une fonction** — il est lié au **site d'appel** (où et
  comment la fonction est invoquée), ce qui produit des comportements
  surprenants quand on passe une méthode comme callback ou qu'on déstructure une
  fonction d'un objet.
related:
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - la-chaine-de-prototypes-structure-l-heritage-en-javascript
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - frontend
backlinks:
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - la-chaine-de-prototypes-structure-l-heritage-en-javascript
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - >-
    les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses
  - frontend
topics:
  - fp
  - frontend
  - javascript
  - react
  - typescript
  - web
---

# Concept - this en JavaScript dépend du site d'appel pas de la définition

## Idée en une phrase

> Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas lié à la définition d'une fonction** — il est lié au **site d'appel** (où et comment la fonction est invoquée), ce qui produit des comportements surprenants quand on passe une méthode comme callback ou qu'on déstructure une fonction d'un objet.

## Contexte / pourquoi ça compte

C'est **la** source de bugs JS classique. Toute personne qui code JS finit par écrire `this is undefined` sans comprendre pourquoi. Comprendre les règles de binding te fait :
- Lire correctement n'importe quel code JS classique
- Savoir quand `bind`, `call`, `apply` sont nécessaires
- Comprendre pourquoi les arrow functions sont la solution standard pour les callbacks
- Décortiquer le sucre `class` ES6

## Détails / mécanisme

### Les 4 règles de binding (ordre de priorité)

| Règle | Forme | `this` =  |
|---|---|---|
| 1. **`new`** | `new Fn()` | un nouvel objet vide (puis le constructeur le peuple) |
| 2. **Explicit** | `fn.call(ctx, ...)` / `fn.apply(ctx, args)` / `fn.bind(ctx)()` | `ctx` |
| 3. **Implicit** | `obj.fn()` (le `.` à gauche) | `obj` |
| 4. **Default** | `fn()` (appel "nu") | `undefined` (strict) ou global (non-strict) |

Note : les **arrow functions ignorent les 4 règles** — elles capturent le `this` du scope englobant à la définition (donc statiquement).

### Le bug classique

```typescript
const user = {
  name: "Alice",
  sayHi() { return `Hi, ${this.name}` }
}

user.sayHi()                  // "Hi, Alice"           — règle 3 (implicit)
const fn = user.sayHi
fn()                          // "Hi, undefined"        — règle 4 (default)

setTimeout(user.sayHi, 100)   // "Hi, undefined"        — passé en callback nu
setTimeout(() => user.sayHi(), 100) // "Hi, Alice"      — l'arrow garde le call site
setTimeout(user.sayHi.bind(user), 100) // "Hi, Alice"   — bind explicit
```

### Pourquoi les arrow functions sauvent

```typescript
class Counter {
  count = 0
  
  // Méthode classique : this dépend de l'appel
  increment() { this.count++ }
  
  // Méthode arrow : this lié à l'instance, immuable
  decrement = () => { this.count-- }
}

const c = new Counter()
const f = c.increment
f()           // ❌ TypeError: Cannot read property 'count' of undefined

const g = c.decrement
g()           // ✅ marche, this lié à c
```

C'est pour ça qu'en React class component, on déclare les handlers comme arrow ou on les `.bind` dans le constructeur.

### Le cas du `new`

```typescript
function Person(name) {
  this.name = name
}

const p = new Person("Alice")  // règle 1 : this = nouvel objet, retourné implicitement
p.name  // "Alice"

// Sans new
const p2 = Person("Bob")       // règle 4 : this = undefined → erreur en strict
```

C'est pourquoi les fonctions constructeurs commencent par une majuscule (convention) et c'est pourquoi `class` a été introduit (le moteur force le `new`).

### Strict vs non-strict

```typescript
"use strict"
function f() { return this }
f()  // undefined

// non-strict
function g() { return this }
g()  // window (browser) ou global (Node)
```

En **module ESM**, le code est strict par défaut. Donc dans un projet TS moderne, `this` undefined sur appel nu est **la règle**.

### Le pattern "new.target"

```typescript
function Foo() {
  if (!new.target) throw new Error("must be called with new")
  this.x = 1
}
new Foo()  // OK
Foo()      // throw
```

Pratique pour forcer l'usage de `new`.

## Exemple concret

Le fameux problème React class :

```typescript
class TodoList extends React.Component {
  state = { items: [] }
  
  // ❌ this est perdu quand React appelle handleClick
  handleClick() {
    this.setState({ items: [...this.state.items, "new"] })
  }
  
  // ✅ Solution 1 : arrow class field
  handleClickArrow = () => {
    this.setState({ items: [...this.state.items, "new"] })
  }
  
  // ✅ Solution 2 : bind dans constructor
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  
  // ✅ Solution 3 : arrow inline (re-créée à chaque render)
  render() {
    return <button onClick={() => this.handleClick()}>+</button>
  }
}
```

Avec les **hooks (functional components)**, ce problème **disparaît** : les hooks closure sur `useState` au lieu d'utiliser `this`. C'est l'une des raisons pour lesquelles la communauté React a basculé vers les fonctions.

### En TypeScript

TS détecte plein de cas problèmes via `noImplicitThis` et le typage du `this` :

```typescript
type ThisFn = (this: { name: string }) => string
const fn: ThisFn = function () { return this.name }

fn.call({ name: "Alice" })  // OK
fn()                         // ❌ TS error: this missing
```

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(arrow functions sont l'intersection closure + this)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks" data-wiki-title="Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks" data-wiki-preview="L'**event loop JS** alterne : exécuter le code synchrone jusqu'à pile vide, **vider toute la microtask queue** (Promises, `queueMicrotask`), prendre **une seule** macrotask (`setTimeout`, événements DOM, I/O), puis recommencer — c'est cette…">Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks</a> *(les callbacks de l'event loop sont appelés "nus" → this perdu)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-chaine-de-prototypes-structure-l-heritage-en-javascript" data-wiki-title="Concept - La chaîne de prototypes structure l'héritage en JavaScript" data-wiki-preview="En JS, **chaque objet pointe vers un autre objet** via `__proto__` (son prototype) — quand on accède à une propriété qui n'existe pas, le moteur **remonte la chaîne** jusqu'à la trouver ou jusqu'à `null` — c'est ce mécanisme de &quot;**prototype…">Concept - La chaîne de prototypes structure l'héritage en JavaScript</a> *(this dans les méthodes est résolu via la chaîne)*

**Prérequis** :
- Notion de fonction et d'objet en JS

**S'oppose à / à comparer avec** :
- **`this` Java/C# (lexical)** : toujours lié à l'instance, jamais d'ambiguïté
- **`self` Python** : passé explicitement comme premier argument, élimine la confusion
- **Closures** : alternative à `this` pour capturer l'état

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-javascript-en-profondeur-concepts-mal-connus" data-wiki-title="JavaScript en profondeur — concepts mal connus" data-wiki-preview="1. **L'event loop** est le cœur de tout — comprendre microtasks vs macrotasks, et que `requestAnimationFrame` n'est ni l'un ni l'autre, change ta façon de débugger. 2. **`this`** n'est PAS lié à la définition d'une fonction — il est lié à *…">JavaScript en profondeur — concepts mal connus</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

