---
created: 2026-04-25
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - Une closure capture son environnement lexical à la création

## Idée en une phrase

> Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.

## Contexte / pourquoi ça compte

C'est le mécanisme **invisible** derrière la moitié du code JS qu'on écrit : hooks React, callbacks, factories, decorators NestJS, middleware Express. Ne pas comprendre les closures = être surpris par des bugs comme le "stale closure problem" en React, ou des fuites mémoire silencieuses.

Le mot "lexical" est important : c'est le scope **textuel** (où la fonction est écrite dans le code source), pas le scope d'appel.

## Détails / mécanisme

Quand JavaScript crée une fonction, il lui attache une **référence** à son scope englobant (la "scope chain"). Tant que cette fonction existe en mémoire, son scope englobant aussi — même si l'exécution du code a quitté ce scope depuis longtemps.

3 conditions pour qu'une closure se forme :
1. Une fonction interne référence des variables de son scope parent
2. Cette fonction est rendue accessible en dehors de son scope parent (return, callback, event listener, etc.)
3. La fonction parente termine son exécution

Conséquence : les variables capturées **vivent aussi longtemps** que la closure qui les capture (potentielle source de fuite mémoire).

## Exemple concret

**Stale closure dans React** (le bug le plus classique lié aux closures) :

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // 🔒 closure : capture `count` de ce render
      console.log(count);
    }, 1000);
    return () => clearInterval(id);
  }, []); // deps vide → l'effet ne se rejoue jamais

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Tu cliques → `count` passe à 1, 2, 3… mais le `console.log` continue à afficher **0**. Pourquoi ? La closure dans `setInterval` a capturé `count` au moment du premier render (`count = 0`). Comme `useEffect` ne se rejoue pas (deps vide), la closure garde sa vue figée.

**Solutions** :
- Ajouter `count` aux deps → `useEffect` se rejoue, nouvelle closure avec le bon `count`
- Utiliser un `useRef` pour garder une valeur "vivante" à travers les renders
- Utiliser la forme fonctionnelle : `setCount(prev => prev + 1)` (pas de capture de `count`)

## Connexions

**Concepts liés** :
- [[Concept - Un thunk est une fonction qui retarde l'évaluation]] *(les thunks utilisent souvent des closures)*

**Prérequis** :
- Notion de scope en JS
- Notion de fonction first-class (passable en argument, retournable)

**S'oppose à / à comparer avec** :
- **Scope dynamique** (lisp historique, bash) : la fonction voit les variables là où elle est *appelée*, pas où elle est *définie*. JS est lexical.
- **Capture par valeur** (lambdas C++ par défaut) : JS capture **par référence**, donc une closure voit les modifications ultérieures de la variable

## Sources

- [[2026-04-25 - Closure et Thunk en JavaScript]]

## MOC

[[MOC - Architecture & Fondamentaux]] · [[MOC - Frontend]]
