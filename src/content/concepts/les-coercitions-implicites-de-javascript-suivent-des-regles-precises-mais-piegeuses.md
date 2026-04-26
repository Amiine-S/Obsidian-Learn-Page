---
created: 2026-04-26T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Les coercitions implicites de JavaScript suivent des règles précises
  mais piégeuses
slug: >-
  les-coercitions-implicites-de-javascript-suivent-des-regles-precises-mais-piegeuses
excerpt: >-
  Les coercitions sont **partout** en JS, même quand on croit les éviter.
  Comprendre : - **Quand `==` coerce** (= toujours, sauf entre types identiques)
  - **Comment `+` se comporte** (string si l'un des opérandes est string, sinon
  number) - **La distinction truthy/falsy vs `==` vs
oneLiner: >-
  JS effectue des **conversions de type implicites** dans plein d'opérations
  (`==`, `+`, `-`, `<`, `if (x)`, `!x`) — ces règles sont **déterministes et
  documentées**, mais leur côté contre-intuitif (`[] == ![]`, `"0" == false`)
  est la raison pour laquelle on utilise **toujours `===`** et qu'on évite les
  ambigüités de type sur `+`.
related:
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - frontend
backlinks:
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - frontend
topics:
  - devops
  - frontend
  - javascript
  - react
  - rust
  - systems
  - tooling
  - typescript
---

# Concept - Les coercitions implicites de JavaScript suivent des règles précises mais piégeuses

## Idée en une phrase

> JS effectue des **conversions de type implicites** dans plein d'opérations (`==`, `+`, `-`, `<`, `if (x)`, `!x`) — ces règles sont **déterministes et documentées**, mais leur côté contre-intuitif (`[] == ![]`, `"0" == false`) est la raison pour laquelle on utilise **toujours `===`** et qu'on évite les ambigüités de type sur `+`.

## Contexte / pourquoi ça compte

Les coercitions sont **partout** en JS, même quand on croit les éviter. Comprendre :
- **Quand `==` coerce** (= toujours, sauf entre types identiques)
- **Comment `+` se comporte** (string si l'un des opérandes est string, sinon number)
- **La distinction truthy/falsy vs `==` vs `===`**

…te permet de :
- Lire du code legacy sans tomber dans les pièges
- Débugger des comparaisons qui "marchent" mais avec un cast caché
- Faire les bons choix défensifs (parse explicite avant compare)
- Répondre aux questions perfides en entretien

## Détails / mécanisme

### Les conversions de base (table abrégée)

| Valeur | → Number | → String | → Boolean |
|---|---|---|---|
| `0` | 0 | "0" | false |
| `1` | 1 | "1" | true |
| `""` | 0 | "" | false |
| `"0"` | 0 | "0" | true (!) |
| `null` | 0 | "null" | false |
| `undefined` | NaN | "undefined" | false |
| `true` | 1 | "true" | true |
| `false` | 0 | "false" | false |
| `[]` | 0 | "" | true (!) |
| `[1, 2]` | NaN (sauf un seul élément number) | "1,2" | true |
| `{}` | NaN | "[object Object]" | true |
| `NaN` | NaN | "NaN" | false |

Deux pièges centraux :
- `"0"` est **truthy** mais coerce en `0` → `"0" == false` est `true`, mais `if ("0")` est aussi `true`
- `[]` est **truthy** mais coerce en `""` → `0` → `[] == false` est `true`

### `==` vs `===` formellement

`a === b` : pas de coercion — types différents → `false`
`a == b` : coerce selon des règles. Cas notables :
1. Si types identiques → comme `===`
2. `null == undefined` → `true` (cas spécial)
3. `null == n'importe quoi d'autre` → `false`
4. `number == string` → string convertie en number
5. `boolean == ?` → boolean convertie en number
6. `object == primitive` → object convertie via `ToPrimitive` (puis re-coerce)

### Les pièges célèbres

```typescript
0 == false                 // true   (false → 0, 0 == 0)
0 == ""                    // true   ("" → 0)
0 == "0"                   // true   ("0" → 0)
"0" == false               // true   (false → 0, "0" → 0)
[] == false                // true   ([] → "" → 0, false → 0)
[] == ![]                  // true   (![] → false → 0, [] → 0)
[null] == false            // true   ([null] → "" → 0)
[undefined] == false       // true   ([undefined] → "" → 0)
NaN == NaN                 // false  (NaN n'est égal à rien)
null == undefined          // true   (cas spécial)
null == 0                  // false  (null ne coerce pas vers number en ==)
```

Ces résultats sont **logiques** une fois qu'on connaît les règles, mais **personne** ne les retient à long terme. D'où la règle communautaire absolue : `===` et `!==`, point.

### `+` ambigu : string ou number ?

```typescript
1 + 2          // 3
"1" + 2        // "12"      (string si l'un des deux est string)
1 + "2"        // "12"
"1" + "2"      // "12"
1 + null       // 1         (null → 0)
1 + undefined  // NaN       (undefined → NaN)
1 + true       // 2
1 + {}         // "1[object Object]"
[1] + [2]      // "12"      (arrays → strings)
[1] + 2        // "12"
```

`-`, `*`, `/`, `%` n'ont **pas** cette ambigüité — ils forcent toujours en number :
```typescript
"3" - "1"      // 2
"3" * "2"      // 6
"foo" - 1      // NaN
```

### Truthy / Falsy — la liste complète

Falsy values (les seules) :
```
false, 0, -0, 0n (BigInt), "", null, undefined, NaN, document.all (legacy)
```

**Tout le reste est truthy**, y compris :
- `"false"` (string non-vide)
- `"0"` (string non-vide)
- `[]` (array, même vide)
- `{}` (object, même vide)
- `function(){}` (fonction)
- `Symbol()`

D'où :
```typescript
if ([]) console.log("yes")       // "yes"
if ([] == false) console.log("yes") // "yes"  ← contradictoire !
```

C'est cohérent : le `if` utilise une **conversion booléenne**, le `==` utilise une **conversion comparative** — règles différentes.

### `Object.is` — le compare strict ultime

```typescript
NaN === NaN       // false
Object.is(NaN, NaN) // true  (cas spécial)

-0 === +0          // true
Object.is(-0, +0)  // false (cas spécial)
```

`Object.is` est ce que React utilise en interne pour comparer states/deps. À utiliser quand tu veux distinguer NaN ou ±0.

### La règle pratique

| Tu veux... | Utilise |
|---|---|
| Comparer égalité simple | `===` |
| Vérifier null/undefined | `x == null` (autorisé même par les linters) |
| Compare booléen | jamais `==`, utilise `Boolean(x)` ou `!!x` |
| Compare avec NaN | `Number.isNaN(x)` |
| Compare type strict | `Object.is(a, b)` (rare) |
| Concat string | `\`${a}${b}\`` (template literals, sans ambiguïté) |
| Add numbers | s'assurer que les opérandes sont des numbers (`+` peut leak si un côté est inconnu) |

## Exemple concret

Bug réel observé en prod :

```typescript
function isReady(value) {
  return value == "ready"
}

isReady("ready")    // true
isReady(0)          // false (0 != "ready")
isReady("0")        // false (string non-coerce-able)
isReady([])         // false ([] → "" != "ready")
isReady("")         // false

// Mais...
isReady(["ready"])  // true   (["ready"] → "ready" → "ready" == "ready")
```

Avec `===`, le dernier cas serait `false` (un array n'est pas une string). Bug évité par défaut.

### Astuces de défense

**Parser explicitement** :
```typescript
// au lieu de
if (req.body.age == 18) ...

// préférer
const age = parseInt(req.body.age, 10)
if (age === 18) ...
```

**Schema validation** (Zod, Effect Schema) :
```typescript
const Body = Schema.Struct({ age: Schema.NumberFromString })
const parsed = Schema.decodeSync(Body)(req.body)
// parsed.age est garanti number
```

**Linter strict** : `eqeqeq` rule (ESLint) interdit `==` sauf cas explicites.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks" data-wiki-title="Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks" data-wiki-preview="L'**event loop JS** alterne : exécuter le code synchrone jusqu'à pile vide, **vider toute la microtask queue** (Promises, `queueMicrotask`), prendre **une seule** macrotask (`setTimeout`, événements DOM, I/O), puis recommencer — c'est cette…">Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/this-en-javascript-depend-du-site-d-appel-pas-de-la-definition" data-wiki-title="Concept - this en JavaScript dépend du site d'appel pas de la définition" data-wiki-preview="Contrairement à la plupart des langages OO, **`this` en JavaScript n'est pas lié à la définition d'une fonction** — il est lié au **site d'appel** (où et comment la fonction est invoquée), ce qui produit des comportements surprenants quand…">Concept - this en JavaScript dépend du site d'appel pas de la définition</a>

**Prérequis** :
- Notions de types primitifs JS

**S'oppose à / à comparer avec** :
- **TypeScript strict** : `==` reste autorisé mais détecte beaucoup de bugs de type. Ne supprime pas la coercion à l'exécution.
- **Python** : `==` n'a presque pas de coercion (sauf int/float). `1 == True` est tout de même `True` en Python aussi.
- **Rust / Go** : pas de coercion implicite du tout — refusé à la compilation.

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-javascript-en-profondeur-concepts-mal-connus" data-wiki-title="JavaScript en profondeur — concepts mal connus" data-wiki-preview="1. **L'event loop** est le cœur de tout — comprendre microtasks vs macrotasks, et que `requestAnimationFrame` n'est ni l'un ni l'autre, change ta façon de débugger. 2. **`this`** n'est PAS lié à la définition d'une fonction — il est lié à *…">JavaScript en profondeur — concepts mal connus</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

