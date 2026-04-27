---
created: '2026-04-26T15:54:50.622Z'
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs
  valeurs
slug: le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
excerpt: >-
  Le hoisting cause des bugs subtils, surtout dans : - Des modules avec des
  cycles d'imports - Des classes où on essaie d'utiliser un field avant son init
  - Des refactors de `var` → `let` (TDZ apparaît) - Des codes legacy qui
  utilisaient le hoisting comme feature (`function` declar
oneLiner: >-
  Le **hoisting** est le mécanisme par lequel JS "remonte" les **déclarations**
  de variables et fonctions en haut de leur scope, mais pas leurs **valeurs** —
  d'où le piège classique : `var` est `undefined` avant son `=`, alors que
  `let`/`const` lèvent une erreur `ReferenceError` (Temporal Dead Zone) jusqu'à
  leur déclaration.
related:
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - frontend
backlinks:
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - le-global-execution-context-est-l-environnement-racine-de-tout-module
  - le-module-system-esm-isole-les-fichiers-et-lie-les-imports-statiquement
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Le **hoisting** est le mécanisme par lequel JS "remonte" les **déclarations** de variables et fonctions en haut de leur scope, mais pas leurs **valeurs** — d'où le piège classique : `var` est `undefined` avant son `=`, alors que `let`/`const` lèvent une erreur `ReferenceError` (Temporal Dead Zone) jusqu'à leur déclaration.

## Contexte / pourquoi ça compte

Le hoisting cause des bugs subtils, surtout dans :
- Des modules avec des cycles d'imports
- Des classes où on essaie d'utiliser un field avant son init
- Des refactors de `var` → `let` (TDZ apparaît)
- Des codes legacy qui utilisaient le hoisting comme feature (`function` declarations utilisées avant leur point d'écriture)

C'est aussi un classique des entretiens techniques. Bien comprendre pourquoi `console.log(x); var x = 5` affiche `undefined` au lieu d'une erreur, c'est comprendre comment le moteur découpe l'exécution en deux passes (création → exécution).

## Détails / mécanisme

### Les deux passes du moteur JS

Quand le moteur entre dans un scope :
1. **Phase de création** : scan toutes les déclarations (`var`, `let`, `const`, `function`, `class`), réserve l'emplacement
2. **Phase d'exécution** : exécute les instructions ligne par ligne, **assigne** les valeurs

Le hoisting est l'effet visible de la phase 1.

### Le tableau exhaustif

| Type | Hoisté ? | Valeur avant l'assignement |
|---|---|---|
| `var x = 5` | ✅ déclaration | `undefined` |
| `let x = 5` | ✅ déclaration | TDZ → ReferenceError si lu |
| `const x = 5` | ✅ déclaration | TDZ → ReferenceError si lu |
| `function f() {}` | ✅ déclaration ET corps | la fonction utilisable |
| `class C {}` | ✅ déclaration | TDZ → ReferenceError si lu |
| `var f = function() {}` | ✅ déclaration | `undefined` (function expression) |

### Exemples

```typescript
// var : déclaration hoistée, valeur = undefined
console.log(a)   // undefined  ← pas d'erreur
var a = 1

// let : déclaration hoistée, mais TDZ
console.log(b)   // ❌ ReferenceError: Cannot access 'b' before initialization
let b = 1

// function declaration : tout est hoisté
foo()            // "hi"  ← marche !
function foo() { console.log("hi") }

// function expression : seul le `var fn` est hoisté
bar()            // ❌ TypeError: bar is not a function (bar est undefined)
var bar = function () { console.log("hi") }
```

### La Temporal Dead Zone (TDZ)

```typescript
{
  // début du scope
  // ↓ ZONE INTERDITE pour x : x existe mais y accéder lance une erreur
  console.log(x)  // ❌ ReferenceError
  let x = 5
  // ↑ fin de la TDZ
  console.log(x)  // 5
}
```

C'est volontaire. Le comité ECMAScript voulait :
- Que `let`/`const` soient **block-scopés** (bloc `{}` au lieu de fonction comme `var`)
- Que les utiliser avant déclaration soit **une erreur explicite** (vs `var` qui rendait `undefined`, source de bugs latents)

### Cas piégeux fréquents

**Cas 1 — Class field avant constructor** :
```typescript
class A {
  static y = A.x()       // ❌ ReferenceError (x pas encore déclaré)
  static x() { return 1 }
}
```

**Cas 2 — Cycle d'import ESM** :
```typescript
// a.ts
import { b } from "./b"
export const a = "from a"
console.log("a sees:", b)  // peut être undefined si b est dans la TDZ

// b.ts
import { a } from "./a"
export const b = "from b"
console.log("b sees:", a)  // pareil
```

ESM gère les cycles différemment de CJS, mais une lecture **avant que le module ait fini d'exécuter** peut tomber en TDZ.

**Cas 3 — `var` dans une boucle** (problème classique pré-ES6) :
```typescript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// Output: 3, 3, 3 (var est function-scoped, hoisté en haut de la fonction)

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// Output: 0, 1, 2 (let est block-scoped, nouvelle variable par itération)
```

### Pourquoi function declarations sont hoistées avec leur corps

Historique : pour permettre le pattern "définir les helpers en bas du fichier" qui était courant avant les modules :

```typescript
processData()   // marche : la déclaration est hoistée

function processData() {
  // ...
}
```

C'est une des rares features qui a été conservée parce qu'elle était utile.

## Exemple concret

Décortiquer un script complet :

```typescript
console.log(typeof x)    // "undefined" — var x est hoistée
console.log(typeof y)    // ❌ ReferenceError — let y est en TDZ
console.log(typeof foo)  // "function" — function decl est hoistée
console.log(typeof bar)  // "undefined" — var bar est hoistée mais sans valeur

var x = 1
let y = 2
function foo() {}
var bar = function () {}
```

Comprendre cette sortie = comprendre le hoisting.

### En 2026, on s'en fiche ?

Pas vraiment. Tu utilises `let`/`const` partout, donc plus de "var hoisté undefined." Mais :
- TDZ apparaît dans les cycles ESM réels
- Les classes avec fields complexes peuvent surprendre
- Les `function` hoistées restent partout (libs externes, code legacy)
- Les questions d'entretien tombent encore là-dessus

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(scope = base du hoisting)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/this-en-javascript-depend-du-site-d-appel-pas-de-la-definition" data-wiki-title="Concept - this en JavaScript dépend du site d'appel pas de la définition" data-wiki-preview="Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas lié à la définition d'une fonction** — il est lié au **site d'appel** (où et comment la fonction est invoquée), ce qui produit des comportements surprenants quand…">Concept - this en JavaScript dépend du site d'appel pas de la définition</a>

**Prérequis** :
- Notion de scope / portée

**S'oppose à / à comparer avec** :
- **C/Java** : pas de hoisting, déclaration et utilisation strictement ordonnées
- **Python** : aussi pas de hoisting, `NameError` si utilisé avant assignement (sauf fonctions, hoistées en module-level)

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-javascript-en-profondeur-concepts-mal-connus" data-wiki-title="JavaScript en profondeur — concepts mal connus" data-wiki-preview="1. **L'event loop** est le cœur de tout — comprendre microtasks vs macrotasks, et que `requestAnimationFrame` n'est ni l'un ni l'autre, change ta façon de débugger. 2. **`this`** n'est PAS lié à la définition d'une fonction — il est lié à *…">JavaScript en profondeur — concepts mal connus</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

