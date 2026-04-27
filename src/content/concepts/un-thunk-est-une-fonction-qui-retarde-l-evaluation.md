---
created: 2026-04-25T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - Un thunk est une fonction qui retarde l'évaluation
slug: un-thunk-est-une-fonction-qui-retarde-l-evaluation
excerpt: >-
  C'est l'outil de base pour **différer** quelque chose de coûteux ou
  d'imprécis-dans-le-temps. Tu en utilises en React, Redux, lazy loading, et dès
  que tu vois un argument typé `() => T`, tu manipules un thunk même si on ne
  l'appelle pas comme ça.
oneLiner: >-
  Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer
  un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à
  la demande de l'appelant.
related:
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - 2026-04-25-closure-et-thunk-en-javascript
  - architecture-fondamentaux
  - frontend
backlinks:
  - 2026-04-25-closure-et-thunk-en-javascript
  - 2026-04-25-effect-ts-pourquoi-et-pour-qui
  - >-
    effect-atom-unifie-state-client-serveur-et-di-dans-des-atomes-bases-sur-effect
  - l-event-loop-traite-les-microtasks-avant-chaque-rendu-et-entre-macrotasks
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature
  - les-generators-produisent-des-valeurs-a-la-demande-avec-yield
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - architecture-fondamentaux
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.

## Contexte / pourquoi ça compte

C'est l'outil de base pour **différer** quelque chose de coûteux ou d'imprécis-dans-le-temps. Tu en utilises en React, Redux, lazy loading, et dès que tu vois un argument typé `() => T`, tu manipules un thunk même si on ne l'appelle pas comme ça.

Étymologie : terme inventé en 1960 (Algol 60) pour désigner "le travail que la fonction est censée faire". Aussi en CS : un thunk de mémoization, un thunk de continuation, etc.

## Détails / mécanisme

**Forme canonique** : `() => T` (en TS).

**Trois rôles principaux** :
1. **Différer un calcul coûteux** : on ne le fait que quand on en a besoin (lazy evaluation).
2. **Différer un effet de bord** : on garde le contrôle sur le moment où l'effet se produit (HTTP call, écriture DB, dispatch Redux…).
3. **Capturer un contexte** pour s'en servir plus tard (combiné avec une closure).

Un thunk est presque toujours **combiné à une closure** : il capture les valeurs qui lui seront nécessaires au moment de l'évaluation.

## Exemple concret

### a. Lazy init en React (pattern le plus courant)

```tsx
// ❌ Mauvais : `expensiveInit()` exécuté à CHAQUE render
const [state, setState] = useState(expensiveInit());

// ✅ Bon : thunk — exécuté UNE fois (au mount uniquement)
const [state, setState] = useState(() => expensiveInit());
```

React détecte que tu lui passes une fonction (un thunk) et l'appelle pour récupérer la valeur initiale, **sans la rappeler aux renders suivants**.

### b. Redux Thunk

```typescript
// Sans Redux Thunk : `dispatch` n'accepte que des objets
dispatch({ type: 'SET_USER', payload: user });

// Avec Redux Thunk : on peut dispatcher des fonctions
const fetchUser = (id: string) =>
  async (dispatch, getState) => {  // ← thunk (closure capture id)
    const user = await api.getUser(id);
    dispatch({ type: 'SET_USER', payload: user });
  };

dispatch(fetchUser('42'));
```

Le middleware Redux Thunk reconnaît qu'une fonction a été dispatchée (au lieu d'un objet) et l'appelle avec `(dispatch, getState)`. C'est ce qui permet d'embrasser l'asynchrone et les side effects dans Redux.

### c. Lazy module loading

```typescript
const loadEditor = () => import('./HeavyEditor');
// Plus tard, à la demande :
const Editor = await loadEditor();
```

### d. Effect-TS (avant-goût)

Effect-TS pousse cette idée au maximum : **TOUT** ton programme devient un thunk géant — un `Effect<A, E, R>` est essentiellement un thunk décrit par son type, qui ne s'exécute que quand on appelle `Effect.runPromise(...)`.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a>

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a> *(la majorité des thunks utilisent une closure)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-type-effect-rend-les-dependances-et-erreurs-explicites-dans-la-signature" data-wiki-title="Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature" data-wiki-preview="`Effect&lt;A, E, R&gt;` — &quot;calcule un `A`, peut échouer avec `E`, requiert un `R` dans son contexte&quot; — rend **visibles dans la signature de retour** trois choses que TypeScript laisse normalement invisibles : ce que la fonction renvoie, ce qu'ell…">Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature</a> *(Effect-TS = thunks typés à grande échelle)*

**Prérequis** :
- Fonctions first-class en JS

**S'oppose à / à comparer avec** :
- **Eager evaluation** : exécution immédiate. Norme en JS pour les expressions plain.
- **Generator** : peut aussi différer, mais avec reprise/yield. Plus puissant mais plus lourd.
- **Promise** : représente une valeur future *en cours* de calcul, pas un calcul *non démarré*. Une Promise s'exécute à la création — un thunk attend qu'on l'appelle.

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-closure-et-thunk-en-javascript" data-wiki-title="Closure et Thunk en JavaScript" data-wiki-preview="1. Une **closure** est une fonction qui **se souvient des variables de son environnement** (scope) au moment où elle a été créée — même si on l'appelle bien plus tard, ailleurs. 2. Un **thunk** est une fonction qui **enveloppe un calcul pou…">Closure et Thunk en JavaScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a> · <a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

