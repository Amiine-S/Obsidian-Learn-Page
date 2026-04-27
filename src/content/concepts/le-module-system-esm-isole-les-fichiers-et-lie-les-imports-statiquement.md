---
created: '2026-04-27T06:41:46.174Z'
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Le module system ESM isole les fichiers et lie les imports
  statiquement
slug: le-module-system-esm-isole-les-fichiers-et-lie-les-imports-statiquement
excerpt: >-
  Tu utilises `import` tous les jours en TS, mais comprendre **comment ESM
  diffère de CommonJS** te permet : - De saisir pourquoi le tree-shaking marche
  en ESM mais pas (ou mal) en CJS - De ne pas tomber dans les pièges des
  dual-package npm (CJS + ESM dans le même paquet) - De conf
oneLiner: >-
  **ESM** (`import` / `export`) lie les dépendances **avant** d'exécuter le code
  (résolution statique, **live bindings**, tree-shaking naturel) — par
  opposition à **CommonJS** (`require` / `module.exports`) qui résout les
  dépendances **au moment de l'appel** (résolution dynamique, copie de valeurs,
  sync).
related:
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - frontend
backlinks:
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - le-global-execution-context-est-l-environnement-racine-de-tout-module
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> **ESM** (`import` / `export`) lie les dépendances **avant** d'exécuter le code (résolution statique, **live bindings**, tree-shaking naturel) — par opposition à **CommonJS** (`require` / `module.exports`) qui résout les dépendances **au moment de l'appel** (résolution dynamique, copie de valeurs, sync).

## Contexte / pourquoi ça compte

Tu utilises `import` tous les jours en TS, mais comprendre **comment ESM diffère de CommonJS** te permet :
- De saisir pourquoi le tree-shaking marche en ESM mais pas (ou mal) en CJS
- De ne pas tomber dans les pièges des dual-package npm (CJS + ESM dans le même paquet)
- De configurer correctement `package.json` (`"type": "module"`, `exports` field)
- De comprendre les différences de comportement avec `__dirname`, `require()`, top-level `await`
- De voir pourquoi Node 20+ pousse fort sur ESM, et pourquoi tout le monde a galéré pendant 5 ans

## Détails / mécanisme

### Le tableau de comparaison

| | CommonJS | ESM |
|---|---|---|
| Syntaxe export | `module.exports = x` / `exports.x = ...` | `export const x = ...` / `export default x` |
| Syntaxe import | `const x = require("...")` | `import { x } from "..."` |
| Phase de résolution | **Runtime** (au require) | **Static** (au parse, avant exécution) |
| Liaison des bindings | **Copie** (snapshot au require) | **Live binding** (référence vivante) |
| Tree-shaking | Limité (require dynamique) | Naturel (analyse statique) |
| Top-level `await` | ❌ | ✅ |
| Hoisting | `require` n'est pas hoisté | `import` est hoisté en haut du module |
| `__dirname` / `__filename` | ✅ | ❌ (utiliser `import.meta.url`) |
| `this` top-level | `module.exports` | `undefined` |
| Sync | Oui | Non (async par nature) |

### Live bindings — le piège qui surprend

```typescript
// counter.mjs (ESM)
export let count = 0
export function inc() { count++ }

// main.mjs
import { count, inc } from "./counter.mjs"
console.log(count)  // 0
inc()
console.log(count)  // 1 ← l'import est une RÉFÉRENCE vivante
```

```javascript
// counter.cjs (CommonJS)
let count = 0
function inc() { count++ }
module.exports = { count, inc }

// main.cjs
const { count, inc } = require("./counter.cjs")
console.log(count)  // 0
inc()
console.log(count)  // 0 ← copie, pas mise à jour
```

**Implication pratique** : si tu écris une lib en ESM qui exporte un compteur ou un état mutable, les consommateurs voient les changements en temps réel. En CJS, ils auraient une snapshot au moment du `require`.

### Imports statiques — pourquoi c'est important

ESM exige que les imports soient au **top-level**, jamais conditionnels :

```typescript
// ✅ ESM : OK
import { fetchUsers } from "./api"

// ❌ ESM : ne compile pas
if (someCondition) {
  import { fetchUsers } from "./api"   // SyntaxError
}
```

```javascript
// ✅ CJS : OK
if (someCondition) {
  const { fetchUsers } = require("./api")
}
```

Pourquoi ? Parce qu'ESM doit **construire le graphe de dépendances avant d'exécuter** quoi que ce soit. C'est ce qui permet :
- Le **tree-shaking** : un bundler peut savoir au parse ce qui est utilisé
- Le **circular detection** propre
- Les **type-checks** statiques (TS exploite ce graph)

Si tu veux un import conditionnel, utilise **dynamic import** :

```typescript
// ✅ ESM dynamic import — retourne une Promise
if (someCondition) {
  const { fetchUsers } = await import("./api")
}
```

### Bonne pratique : exports nommés systématiques

```typescript
// ✅ Tree-shakable, refactor-friendly
export function fetchUser(id: string) { ... }
export function fetchPost(id: string) { ... }
export const API_URL = "..."
```

```typescript
// import sélectif — seules les fonctions utilisées sont bundled
import { fetchUser } from "./api"
```

Le bundler élimine `fetchPost` et `API_URL` du bundle final si non utilisés. C'est **automatique** en ESM.

### Mauvaise pratique : `export default { ... }` fourre-tout

```typescript
// ⚠️ Anti-pattern courant
export default {
  fetchUser,
  fetchPost,
  API_URL,
}
```

```typescript
// import obligatoirement complet
import api from "./api"
api.fetchUser(...)
```

Conséquences :
- **Tree-shaking cassé** : le bundler ne sait pas si tu utilises `fetchUser` ou pas, il garde tout
- **Refactor difficile** : renommer `fetchUser` ne met pas à jour les `api.fetchUser` automatiquement
- **Découverte IDE médiocre** : autocomplete moins propre

Réserve `export default` aux **points d'entrée uniques** : un composant React (`export default function Button()`), une route Next.js, un middleware Express. Sinon, **toujours nommé**.

### Bonne pratique : dynamic imports pour le code-splitting

```typescript
// ✅ Lazy-load d'un module lourd seulement quand nécessaire
async function showStats() {
  const { renderChart } = await import("./chart-heavy")  // bundle séparé
  renderChart()
}
```

Vite, Webpack, Rollup, esbuild reconnaissent ce pattern et **séparent le bundle**. C'est la base du code-splitting des SPA / PWA modernes.

```typescript
// React.lazy = sucre au-dessus de dynamic import
const Stats = React.lazy(() => import("./Stats"))
```

### Mauvaise pratique : mélanger CJS et ESM dans un même projet

```json
// package.json
{
  "type": "module"   // tous les .js sont ESM
}
```

```javascript
// utils.js (ESM par défaut)
const fs = require("fs")  // ❌ ReferenceError: require is not defined
```

```javascript
// utils.js — corriger
import { readFile } from "fs/promises"
```

Si une lib externe est CJS-only, Node fait le bridge mais tu ne peux pas `import { x } from "lib"` en nommé — tu dois `import lib from "lib"; const { x } = lib`.

C'est la **dual-package hazard**. En 2026, la plupart des libs sont devenues **ESM-first** mais beaucoup gardent un build CJS pour Node legacy.

### `package.json` `exports` — la map moderne

```json
{
  "name": "my-lib",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": "./dist/esm/utils.js"
  }
}
```

Permet de :
- Servir ESM aux outils modernes, CJS aux outils legacy
- Restreindre les imports profonds (`my-lib/internal/...` peut être bloqué)
- Mapper les types

C'est le mécanisme **moderne** de packaging npm. Toute lib publiée en 2025+ devrait l'utiliser.

### `import.meta` — le remplaçant de `__dirname`

```typescript
// ❌ ESM : pas de __dirname
console.log(__dirname)  // ReferenceError

// ✅ ESM : import.meta.url
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
```

Verbeux pour Node — beaucoup le mettent dans un helper. En 2026, Node propose aussi `import.meta.dirname` directement.

### Top-level `await`

```typescript
// ESM only — un module entier devient async
const config = await loadConfig()
export { config }
```

Tout module qui importe celui-ci attend automatiquement la résolution. Impossible en CommonJS.

## Exemple concret

### Cas réel : configurer un projet TS moderne

```json
// package.json
{
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "verbatimModuleSyntax": true
  }
}
```

`verbatimModuleSyntax: true` force des `import type` explicites pour les types — clarifie ce qui est code vs ce qui est juste typage.

### Cas réel : le piège des dual modules

```typescript
// Tu as une lib qui exporte un Singleton
// lib-cjs/index.cjs
const instance = createInstance()
module.exports = { instance }
```

Si la même lib est chargée à la fois en ESM et en CJS dans une app, **tu auras deux instances** — chaque format fait sa propre évaluation. Cela casse les patterns Singleton.

Solution : publier en **dual package** mais n'avoir qu'**un seul "entry"** réel (le binaire pré-compilé), et faire pointer ESM et CJS vers le même.

### Cas réel : NestJS / AdonisJS

NestJS est historiquement CJS (CommonJS) — `tsc` compile en CJS, le decorator metadata fonctionne, etc. Le passage à ESM en NestJS est en cours en 2026 mais demande des migrations (notamment l'ordre des decorators).

AdonisJS 6+ est **ESM-first** par design : `import.meta.url`, top-level await, ESM-only providers.

## Connexions

**Concepts liés** :
- <span class="wikilink-broken" title="Référence non trouvée : Concept - Le Global Execution Context est l'environnement racine où tout module s'exécute">Concept - Le Global Execution Context est l'environnement racine où tout module s'exécute</span> *(chaque module a son propre GEC ; ESM en pose les règles)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs" data-wiki-title="Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs" data-wiki-preview="Le **hoisting** est le mécanisme par lequel JS &quot;remonte&quot; les **déclarations** de variables et fonctions en haut de leur scope, mais pas leurs **valeurs** — d'où le piège classique : `var` est `undefined` avant son `=`, alors que `let`/`cons…">Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs</a> *(les imports ESM sont hoistés au top du module)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-ecosysteme-js-migre-vers-des-outils-en-rust-et-go-pour-la-perf" data-wiki-title="Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf" data-wiki-preview="Tout l'outillage JS — bundlers, linters, formatters, type-checkers, runtimes — est en cours de **réécriture en Rust ou Go** pour gagner 5× à 100× sur les workloads CPU-bound (parsing, AST, traversal).">Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf</a> *(les bundlers modernes en Rust/Go exploitent l'analyse statique ESM)*

**Prérequis** :
- Notion de fichier vs module
- `import` / `export` (les bases)

**S'oppose à / à comparer avec** :
- **CommonJS** : runtime resolution, copie de valeurs, sync, pas de top-level await
- **AMD / UMD** : formats legacy pour le browser pré-ESM
- **CSS @import** : équivalent côté CSS (mais sans tree-shaking)

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime" data-wiki-title="JavaScript — paradigmes fonctionnels et mécanismes runtime" data-wiki-preview="1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP / pipeline, dangereux en code applicatif (illisible si abusé). 2. **Composition** chaîne des fonctions pures `g(f(x))` — la base du style &quot;data → pipeline&quot; (RxJS, Effect,…">JavaScript — paradigmes fonctionnels et mécanismes runtime</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

