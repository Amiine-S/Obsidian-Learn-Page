---
created: 2026-04-25
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - Un thunk est une fonction qui retarde l'évaluation

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

→ [[Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature]]

## Connexions

**Concepts liés** :
- [[Concept - Une closure capture son environnement lexical à la création]] *(la majorité des thunks utilisent une closure)*
- [[Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature]] *(Effect-TS = thunks typés à grande échelle)*

**Prérequis** :
- Fonctions first-class en JS

**S'oppose à / à comparer avec** :
- **Eager evaluation** : exécution immédiate. Norme en JS pour les expressions plain.
- **Generator** : peut aussi différer, mais avec reprise/yield. Plus puissant mais plus lourd.
- **Promise** : représente une valeur future *en cours* de calcul, pas un calcul *non démarré*. Une Promise s'exécute à la création — un thunk attend qu'on l'appelle.

## Sources

- [[2026-04-25 - Closure et Thunk en JavaScript]]

## MOC

[[MOC - Architecture & Fondamentaux]] · [[MOC - Frontend]]
