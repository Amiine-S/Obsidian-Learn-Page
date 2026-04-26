---
title: Closure et Thunk en JavaScript
author: Claude (synthèse)
digested: 2026-04-25T00:00:00.000Z
format: doc
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/intermediate
slug: 2026-04-25-closure-et-thunk-en-javascript
excerpt: >-
  1. Une **closure** est une fonction qui **se souvient des variables de son
  environnement** (scope) au moment où elle a été créée — même si on l'appelle
  bien plus tard, ailleurs. 2. Un **thunk** est une fonction qui **enveloppe un
  calcul pour le différer** : au lieu de faire le ca
related:
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - architecture-fondamentaux
backlinks:
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - une-closure-capture-son-environnement-lexical-a-la-creation
topics:
  - frontend
---

# Closure et Thunk en JavaScript

## Pourquoi cette source

> Deux concepts que tout dev JS/TS utilise tous les jours **sans forcément connaître les noms**. Tu écris des closures dans chaque hook React, et des thunks dès que tu utilises `useState(() => …)` ou Redux Thunk. Mettre les bons mots permet de mieux comprendre ce qui se passe.

## Résumé en 5 lignes

1. Une **closure** est une fonction qui **se souvient des variables de son environnement** (scope) au moment où elle a été créée — même si on l'appelle bien plus tard, ailleurs.
2. Un **thunk** est une fonction qui **enveloppe un calcul pour le différer** : au lieu de faire le calcul tout de suite, on rend une fonction qui le fera quand on l'appellera.
3. Les deux sont liés : la majorité des thunks utilisent une closure pour capturer ce dont ils ont besoin lors de l'évaluation tardive.
4. En React/TS, tu en croises partout : `useState(() => expensive())` (thunk de lazy init), `useCallback`, `useEffect`, Redux Thunk, computed Vue, lazy initializers de NestJS.
5. Comprendre ces deux mots = comprendre pourquoi `useEffect` a un "stale closure problem", pourquoi Redux Thunk existe, et pourquoi on passe des callbacks plutôt que des valeurs.

---

## 1. Closure — une fonction qui capture son scope

### Définition

Une **closure** est ce qu'on obtient quand une fonction interne **référence des variables de son scope englobant**, et qu'on garde une référence à cette fonction interne (en la retournant, en la passant à un callback, etc.).

La fonction "ferme" (close) sur ces variables — elle les emporte avec elle, même si la fonction parente a fini son exécution.

### Exemple minimal

```typescript
function makeCounter() {
  let count = 0;
  return () => {
    count += 1;  // ← capture `count` du scope parent
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3
```

`makeCounter` a fini son exécution dès le premier appel. Pourtant, `count` continue à exister, **parce que la fonction retournée le capture**. C'est ça, une closure.

### Pourquoi ça t'intéresse, toi

Tu utilises des closures **dans tous tes hooks React**. Exemple :

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count);  // ← capture `count` de ce render
    }, 1000);
    return () => clearInterval(id);
  }, []); // ← deps vide
}
```

Le callback dans `setInterval` est une closure qui capture `count` **au moment où le `useEffect` a été créé**. Si `count` change après, **la closure voit toujours l'ancienne valeur** — c'est le fameux "**stale closure problem**" de React. Solution : ajouter `count` aux deps, ou utiliser un ref.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a>

### Autres endroits où tu utilises des closures

- **Encapsulation** (pattern "module") : variables privées via closures
- **Currying** : `add(1)(2)` — chaque fonction renvoyée capture son arg
- **Event listeners** : le callback capture des vars externes
- **`Array.prototype.map/filter/reduce`** : la fonction passée capture le contexte
- **NestJS** : les décorateurs et factories utilisent des closures pour capturer la config

---

## 2. Thunk — une fonction qui retarde un calcul

### Définition

Un **thunk** est une **fonction qui ne prend pas d'arguments (ou très peu) et qui retourne une valeur ou exécute une action**. Son but n'est pas de calculer maintenant, mais de **préparer un calcul à exécuter plus tard**.

Le mot vient de Algol 60 (chercheur "Peter Naur" : *"the function that has been thought about"*) — c'est de l'humour académique sur "to think about something" → "thunk it through".

### Exemple minimal

```typescript
// Sans thunk : calcul immédiat
const value = expensiveComputation();

// Avec thunk : calcul différé
const valueThunk = () => expensiveComputation();
// Plus tard, quand on en a vraiment besoin :
const value = valueThunk();
```

Le thunk te donne le **contrôle sur QUAND** le calcul a lieu.

### Pourquoi ça t'intéresse, toi

Tu utilises des thunks **dès que tu différères un calcul ou un effet**. Trois cas typiques en TS :

#### a. Lazy init de `useState`

```tsx
// ❌ Mauvais : calcul à chaque render
const [state, setState] = useState(expensiveInit());

// ✅ Bon : thunk, exécuté UNE fois (au mount)
const [state, setState] = useState(() => expensiveInit());
```

La fonction passée à `useState` est un thunk : React l'appelle une seule fois pour récupérer l'état initial.

#### b. Redux Thunk

```typescript
// Action classique : objet plain
const incrementAction = { type: 'INCREMENT' };

// Action thunk : fonction qui sera appelée par le middleware
const fetchUserThunk = () => async (dispatch, getState) => {
  const user = await fetch('/api/user').then(r => r.json());
  dispatch({ type: 'SET_USER', payload: user });
};

dispatch(fetchUserThunk()); // le middleware Redux Thunk l'exécute
```

Tout le **point** de Redux Thunk : permettre de dispatcher des **fonctions** au lieu d'objets, pour gérer de l'asynchrone et des effets de bord.

#### c. Lazy modules / lazy imports

```typescript
const loadEditor = () => import('./HeavyEditor');
// Plus tard :
const Editor = await loadEditor();
```

Le `() => import(...)` est un thunk d'import.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a>

---

## 3. Comment ils sont liés

**La plupart des thunks UTILISENT une closure** pour capturer ce dont ils auront besoin au moment de leur exécution :

```typescript
function makeFetchThunk(userId: string) {
  return async () => {  // ← thunk qui capture `userId` (closure)
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  };
}

const thunk = makeFetchThunk('42');
// Plus tard, ailleurs, sans repasser userId :
const user = await thunk();
```

C'est exactement le pattern de Redux Thunk, des lazy initializers, et des nombreux factories TS/NestJS.

---

## Citations brutes

> *"Closures are poor man's objects. Objects are poor man's closures."* — adage de la communauté Lisp/JS, dit que les deux sont équivalents en pouvoir d'expression.

---

## À explorer ensuite

- **Stale closure problem** en détail (avec `useRef` comme solution)
- **Currying** et programmation fonctionnelle en TS
- **Redux Toolkit `createAsyncThunk`** vs Redux Thunk classique
- **Lazy evaluation** vs eager evaluation (concept général PL)
- **Effet de bord** vs valeur pure — c'est la transition vers Effect-TS

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

