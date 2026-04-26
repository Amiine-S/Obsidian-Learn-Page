---
created: 2026-04-26T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - La chaîne de prototypes structure l'héritage en JavaScript
slug: la-chaine-de-prototypes-structure-l-heritage-en-javascript
excerpt: >-
  Les `class` ES6 sont du **sucre syntaxique** au-dessus du système de
  prototypes, qui existe depuis 1995. Comprendre la chaîne de prototypes te
  permet : - De lire correctement n'importe quel code JS classique (jQuery, libs
  anciennes) - De comprendre `Object.create`, `Object.getPro
oneLiner: >-
  En JS, **chaque objet pointe vers un autre objet** via `__proto__` (son
  prototype) — quand on accède à une propriété qui n'existe pas, le moteur
  **remonte la chaîne** jusqu'à la trouver ou jusqu'à `null` — c'est ce
  mécanisme de "**prototype chain**" qui implémente tout l'héritage, y compris
  derrière les `class` ES6.
related:
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - frontend
backlinks:
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - frontend
topics:
  - fp
  - frontend
  - javascript
  - rust
  - systems
  - typescript
---

# Concept - La chaîne de prototypes structure l'héritage en JavaScript

## Idée en une phrase

> En JS, **chaque objet pointe vers un autre objet** via `__proto__` (son prototype) — quand on accède à une propriété qui n'existe pas, le moteur **remonte la chaîne** jusqu'à la trouver ou jusqu'à `null` — c'est ce mécanisme de "**prototype chain**" qui implémente tout l'héritage, y compris derrière les `class` ES6.

## Contexte / pourquoi ça compte

Les `class` ES6 sont du **sucre syntaxique** au-dessus du système de prototypes, qui existe depuis 1995. Comprendre la chaîne de prototypes te permet :
- De lire correctement n'importe quel code JS classique (jQuery, libs anciennes)
- De comprendre `Object.create`, `Object.getPrototypeOf`, `instanceof`
- De savoir pourquoi `arr.map` fonctionne (`arr.__proto__ === Array.prototype`)
- De déboguer des erreurs `... is not a function` quand une méthode disparaît
- De faire de la méta-programmation propre (mixins, traits)

## Détails / mécanisme

### Anatomie d'un objet

Tout objet en JS a une **propriété interne `<span class="wikilink-broken" title="Référence non trouvée : Prototype">Prototype</span>`** (exposée via `__proto__` ou `Object.getPrototypeOf`). Cette propriété pointe vers un autre objet — son prototype — ou vers `null`.

```typescript
const obj = { name: "Alice" }
console.log(Object.getPrototypeOf(obj))  // Object.prototype
console.log(Object.getPrototypeOf(Object.prototype))  // null
```

Donc :
```
obj
 ↓ __proto__
Object.prototype  (toString, hasOwnProperty, valueOf, ...)
 ↓ __proto__
null
```

### La résolution de propriété

Quand tu écris `obj.foo`, le moteur :
1. Cherche `foo` directement sur `obj` → trouvé ? renvoie
2. Sinon, cherche sur `obj.__proto__` → trouvé ? renvoie
3. Sinon, sur `obj.__proto__.__proto__` → ...
4. Si on arrive à `null`, renvoie `undefined`

```typescript
const obj = {}
obj.toString()  // "[object Object]"  — toString vient de Object.prototype
```

### `class` est du sucre

```typescript
class Animal {
  constructor(public name: string) {}
  speak() { return `${this.name} makes a sound` }
}
class Dog extends Animal {
  bark() { return `${this.name} barks` }
}
const rex = new Dog("Rex")
```

C'est strictement équivalent à :

```typescript
function Animal(name) { this.name = name }
Animal.prototype.speak = function () { return `${this.name} makes a sound` }

function Dog(name) { Animal.call(this, name) }
Dog.prototype = Object.create(Animal.prototype)
Dog.prototype.constructor = Dog
Dog.prototype.bark = function () { return `${this.name} barks` }

const rex = new Dog("Rex")
```

Sous le capot :
```
rex
 ↓ __proto__
Dog.prototype  { bark, constructor: Dog }
 ↓ __proto__
Animal.prototype  { speak, constructor: Animal }
 ↓ __proto__
Object.prototype  { toString, ... }
 ↓ __proto__
null
```

`rex.speak()` cherche `speak` sur `rex` → non, sur `Dog.prototype` → non, sur `Animal.prototype` → trouvé.

### `Object.create` — créer sans `new`

```typescript
const animalProto = {
  speak() { return `${this.name} makes a sound` }
}

const dog = Object.create(animalProto)
dog.name = "Rex"
dog.speak()  // "Rex makes a sound"
```

Pas de classe, pas de constructeur. **Lien direct** par prototype.

### `instanceof` utilise la chaîne

```typescript
rex instanceof Dog       // true
rex instanceof Animal    // true (Dog.prototype.__proto__ === Animal.prototype)
rex instanceof Object    // true
```

`a instanceof B` revient à : "est-ce que `B.prototype` est dans la chaîne de prototypes de `a` ?"

### Méthode propre vs héritée

```typescript
const obj = { ownProp: 1 }

obj.hasOwnProperty("ownProp")           // true
obj.hasOwnProperty("toString")          // false (héritée)

Object.hasOwn(obj, "ownProp")           // true (équivalent moderne)
Object.hasOwn(obj, "toString")          // false
```

Distinguer **propriétés propres** (sur l'objet) et **propriétés héritées** (sur la chaîne) est important pour `for..in`, `Object.keys`, et la sérialisation.

### Le piège : modifier `prototype` en runtime

```typescript
Array.prototype.first = function () { return this[0] }
[1, 2, 3].first()  // 1
```

**Très mauvaise pratique** : tu pollues TOUS les arrays du programme. C'est ce qu'on appelle "monkey patching." À ne pas faire en prod (sauf polyfills bien isolés).

## Exemple concret

### Mixin pattern via prototype

```typescript
const SerializableMixin = {
  toJSON() { return JSON.stringify(this) },
  fromJSON(s: string) { Object.assign(this, JSON.parse(s)) }
}

class User {
  constructor(public name: string) {}
}
Object.assign(User.prototype, SerializableMixin)

const u = new User("Alice")
u.toJSON()  // '{"name":"Alice"}'
```

C'est l'équivalent des "traits" de Rust ou Scala, fait à la main.

### Pourquoi `arr.map` fonctionne

```typescript
const arr = [1, 2, 3]
console.log(arr.__proto__ === Array.prototype) // true
console.log(Array.prototype.map === arr.map)    // true
```

`arr.map` est trouvé sur `Array.prototype`. C'est pour ça que **toutes** les arrays partagent la même méthode `map` (pas dupliquée).

### En entretien : la question piégeuse

```typescript
function Foo() {}
Foo.prototype.bar = "baz"

const obj = new Foo()

console.log(obj.bar)        // "baz"   — héritée
obj.bar = "custom"          // crée une OWN prop sur obj
console.log(obj.bar)        // "custom" — own override
delete obj.bar
console.log(obj.bar)        // "baz"   — l'héritée réapparaît
```

Comprendre ça = comprendre comment fonctionne la résolution de propriété.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/this-en-javascript-depend-du-site-d-appel-pas-de-la-definition" data-wiki-title="Concept - this en JavaScript dépend du site d'appel pas de la définition" data-wiki-preview="Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas lié à la définition d'une fonction** — il est lié au **site d'appel** (où et comment la fonction est invoquée), ce qui produit des comportements surprenants quand…">Concept - this en JavaScript dépend du site d'appel pas de la définition</a> *(this dans une méthode = l'instance qui invoque, pas le proto)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(les méthodes prototype + closures sont les deux mécanismes d'encapsulation)*

**Prérequis** :
- Notion d'objet et de propriété
- `new`, `function`, `class`

**S'oppose à / à comparer avec** :
- **Class-based inheritance (Java, C#)** : structure fixe, héritage défini à la compilation
- **Composition over inheritance** : philosophie qui privilégie les "objets simples liés" — bien adaptée au JS prototypal
- **Trait-based inheritance (Rust)** : autre approche, plus typée, sans hiérarchie

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-javascript-en-profondeur-concepts-mal-connus" data-wiki-title="JavaScript en profondeur — concepts mal connus" data-wiki-preview="1. **L'event loop** est le cœur de tout — comprendre microtasks vs macrotasks, et que `requestAnimationFrame` n'est ni l'un ni l'autre, change ta façon de débugger. 2. **`this`** n'est PAS lié à la définition d'une fonction — il est lié à *…">JavaScript en profondeur — concepts mal connus</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

