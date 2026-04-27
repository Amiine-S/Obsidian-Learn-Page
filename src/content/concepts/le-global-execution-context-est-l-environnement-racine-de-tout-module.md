---
created: '2026-04-27T06:40:48.038Z'
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Le Global Execution Context est l'environnement racine de tout
  module
slug: le-global-execution-context-est-l-environnement-racine-de-tout-module
excerpt: >-
  Le GEC est invisible la plupart du temps mais il explique : - Pourquoi `this`
  top-level vaut `undefined` dans un fichier ESM moderne (et pas dans un vieux
  script) - Pourquoi un import circulaire produit `Cannot access 'X' before
  initialization` - Pourquoi `var` top-level pollue `
oneLiner: >-
  Quand un script ou un module commence à s'exécuter, le moteur crée un **Global
  Execution Context** : l'environnement racine où vivent les déclarations
  top-level, où `this` a une valeur particulière (`undefined` en module,
  `globalThis` en script), et où l'ordre des imports/instructions détermine ce
  qui est disponible quand.
related:
  - le-module-system-esm-isole-les-fichiers-et-lie-les-imports-statiquement
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Quand un script ou un module commence à s'exécuter, le moteur crée un **Global Execution Context** : l'environnement racine où vivent les déclarations top-level, où `this` a une valeur particulière (`undefined` en module, `globalThis` en script), et où l'ordre des imports/instructions détermine ce qui est disponible quand.

## Contexte / pourquoi ça compte

Le GEC est invisible la plupart du temps mais il explique :
- Pourquoi `this` top-level vaut `undefined` dans un fichier ESM moderne (et pas dans un vieux script)
- Pourquoi un import circulaire produit `Cannot access 'X' before initialization`
- Pourquoi `var` top-level pollue `window` mais pas en module
- Pourquoi le **strict mode** est automatique en module
- Comment se comporte un `top-level await` (modules async)

C'est un **modèle mental** : sans lui, tu écris du code qui marche par hasard.

## Détails / mécanisme

### Les composants d'un Execution Context

Chaque contexte d'exécution (global ou de fonction) contient :

1. **Variable Environment** — pour `var`, `function declarations` (hoistées avec leur valeur)
2. **Lexical Environment** — pour `let`, `const`, `class` (hoistées sans valeur, TDZ)
3. **`this` binding** — la valeur de `this` dans ce contexte
4. **Outer environment reference** — vers le contexte parent (chaîne de scope)

### Script vs Module — la grosse différence

```html
<!-- Script classique -->
<script src="legacy.js"></script>
```

```js
// legacy.js (script classique, non-strict)
var apiKey = "abc"
console.log(this)            // window (browser) ou globalThis
console.log(window.apiKey)   // "abc" — var top-level pollue window
function foo() {}
console.log(window.foo)      // function — pollue aussi
```

```html
<!-- Module -->
<script type="module" src="modern.js"></script>
```

```js
// modern.js (module ESM, strict mode automatique)
var b = 1
console.log(this)            // undefined ← !
console.log(window.b)        // undefined — pas de pollution
export function foo() {}     // export explicite obligatoire
```

**Les modules sont strict + non-pollueurs + this = undefined**. Tout projet TS/JS moderne (Vite, Next, esbuild, Node récent) utilise les modules.

### Phase de création vs phase d'exécution

Quand un module commence à charger :

1. **Phase de parse** : le moteur lit tout le code, repère les `import`/`export`, les `var`, les `function declarations`, les `let`/`const`
2. **Phase de linking** (ESM) : tous les imports sont résolus **avant** toute exécution
3. **Phase d'exécution** : le code s'exécute ligne par ligne dans l'ordre

C'est pour ça que :

```typescript
// foo.ts
console.log(bar())   // ❌ ReferenceError? Non — bar est hoisted
function bar() { return 1 }

console.log(baz)     // ❌ ReferenceError: Cannot access 'baz' before initialization (TDZ)
const baz = 1
```

`function declarations` sont **complètement hoistées** (déclaration + corps). `let`/`const`/`class` sont **partiellement** hoistées (le moteur sait qu'elles existeront mais y accéder avant la ligne d'initialisation est interdit — TDZ).

### Live bindings ESM

```typescript
// counter.ts
export let count = 0
export function inc() { count++ }

// main.ts
import { count, inc } from "./counter"
console.log(count)  // 0
inc()
console.log(count)  // 1 ← l'import voit la nouvelle valeur (live binding)
```

`count` côté `main.ts` n'est **pas une copie** — c'est une **référence** vers la cellule du module `counter`. C'est une particularité ESM (en CommonJS, `count` aurait été copié).

### Bonne pratique : toujours utiliser les modules

```typescript
// ✅ ESM avec exports nommés
export const API_URL = process.env.API_URL!
export function fetchUsers() { ... }
```

- Pas de pollution globale
- Imports explicites (auditables, tree-shakable)
- Strict par défaut
- Compatible top-level await

### Mauvaise pratique : compter sur `this` ou globals top-level

```typescript
// ❌ Code qui marche en script mais pas en module
var config = { url: "..." }   // ← devient window.config en script, mais pas en module

function init() {
  console.log(this.config)    // ❌ undefined en module
}
```

Si tu vois `this.something` au top-level, c'est presque toujours du code legacy à porter en ESM avec exports.

### Les imports circulaires — le piège du GEC

```typescript
// a.ts
import { b } from "./b"
export const a = b + 1
console.log("a loaded:", a)

// b.ts
import { a } from "./a"
export const b = a + 1
console.log("b loaded:", b)
```

À l'exécution, l'un des deux modules sera évalué **alors que l'autre n'a pas fini** son initialisation. Symptôme :

```
ReferenceError: Cannot access 'a' before initialization
```

C'est la **TDZ** appliquée aux modules : `a` existe mais n'a pas encore de valeur quand `b.ts` y accède.

**Solutions** :
- Casser le cycle en extrayant les éléments communs dans un 3e module
- Différer l'usage : utiliser `a` dans une fonction (pas au top-level), pour qu'à l'appel le module soit initialisé

### Top-level `await` — un module devient async

```typescript
// config.ts (module ESM)
const res = await fetch("/config.json")
export const config = await res.json()
```

Le module **entier** devient une promesse. Tout module qui l'importe attendra qu'il soit résolu avant de commencer.

```typescript
// main.ts
import { config } from "./config"  // ← attend automatiquement
console.log(config.apiUrl)
```

C'est uniquement disponible en **modules ESM**, pas en script ni en CommonJS.

### `globalThis` — le portail unifié

Pour accéder au global volontairement (vraiment besoin) :

```typescript
// ✅ Marche en browser, Node, Deno, Workers
globalThis.fetch
globalThis.process  // (Node only, undefined ailleurs)
```

Avant 2020, on faisait `(typeof window !== "undefined" ? window : global)`. `globalThis` standardise ça.

## Exemple concret

### Cas réel : éviter les imports circulaires en NestJS / AdonisJS

```typescript
// user.service.ts
import { OrderService } from "./order.service"  // ← cycle ?

export class UserService {
  constructor(private orders: OrderService) {}
}

// order.service.ts
import { UserService } from "./user.service"  // ← cycle !

export class OrderService {
  constructor(private users: UserService) {}
}
```

NestJS détecte ça et te demande de marquer un côté comme `forwardRef(() => OrderService)`. Pourquoi ? Parce qu'au moment où NestJS instancie `UserService`, `OrderService` n'est pas encore défini (TDZ ESM). Le `forwardRef` retarde l'évaluation.

C'est **exactement** le mécanisme du GEC : casser le cycle en différant l'accès.

### Cas réel : `this` au top-level d'un module

```typescript
// config.ts (module)
function readConfig() {
  return this.env  // ❌ this = undefined → TypeError
}

const cfg = readConfig()  // ❌ Cannot read property 'env' of undefined
```

Cette fonction marchait en script (parce que `this = window`) mais casse en module. Solution : passer la config en argument explicite.

### Cas réel : pollution globale involontaire

```typescript
// vieux.js — chargé en <script> classique
function helper() { ... }   // ← devient window.helper

// nouveau.js — autre script, chargé après
function helper() { ... }   // ← écrase l'ancien sans warning
```

Bug horrible à débugger. En module, chaque `helper` est local et le compilateur t'aurait alerté du double-export.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-module-system-esm-isole-les-fichiers-et-lie-les-imports-statiquement" data-wiki-title="Concept - Le module system ESM isole les fichiers et lie les imports statiquement" data-wiki-preview="**ESM** (`import` / `export`) lie les dépendances **avant** d'exécuter le code (résolution statique, **live bindings**, tree-shaking naturel) — par opposition à **CommonJS** (`require` / `module.exports`) qui résout les dépendances **au mom…">Concept - Le module system ESM isole les fichiers et lie les imports statiquement</a> *(le GEC est créé par module ; ESM impose les règles modernes)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs" data-wiki-title="Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs" data-wiki-preview="Le **hoisting** est le mécanisme par lequel JS &quot;remonte&quot; les **déclarations** de variables et fonctions en haut de leur scope, mais pas leurs **valeurs** — d'où le piège classique : `var` est `undefined` avant son `=`, alors que `let`/`cons…">Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs</a> *(le hoisting est ce qui se passe à la création du GEC)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/this-en-javascript-depend-du-site-d-appel-pas-de-la-definition" data-wiki-title="Concept - this en JavaScript dépend du site d'appel pas de la définition" data-wiki-preview="Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas lié à la définition d'une fonction** — il est lié au **site d'appel** (où et comment la fonction est invoquée), ce qui produit des comportements surprenants quand…">Concept - this en JavaScript dépend du site d'appel pas de la définition</a> *(this top-level = undefined en module, c'est le GEC qui décide)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(les closures pointent vers les Lexical Environments des contextes parents)*

**Prérequis** :
- Notion de scope
- Modules import/export (les bases)

**S'oppose à / à comparer avec** :
- **Script classique** : `this = window`, `var` pollue, pas de strict, pas de top-level await
- **CommonJS** : `module.exports`/`require`, pas de live binding, pas de top-level await, sync
- **Workers / iframes** : ont leur propre GEC isolé du document principal

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime" data-wiki-title="JavaScript — paradigmes fonctionnels et mécanismes runtime" data-wiki-preview="1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP / pipeline, dangereux en code applicatif (illisible si abusé). 2. **Composition** chaîne des fonctions pures `g(f(x))` — la base du style &quot;data → pipeline&quot; (RxJS, Effect,…">JavaScript — paradigmes fonctionnels et mécanismes runtime</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

