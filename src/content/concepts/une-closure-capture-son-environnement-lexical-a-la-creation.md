---
created: 2026-04-25T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - Une closure capture son environnement lexical à la création
slug: une-closure-capture-son-environnement-lexical-a-la-creation
excerpt: >-
  C'est le mécanisme **invisible** derrière la moitié du code JS qu'on écrit :
  hooks React, callbacks, factories, decorators NestJS, middleware Express. Ne
  pas comprendre les closures = être surpris par des bugs comme le "stale
  closure problem" en React, ou des fuites mémoire silen
oneLiner: >-
  Une closure est une fonction qui **se souvient** des variables de son scope
  englobant **au moment où elle a été définie** — et continue d'y accéder même
  quand le scope parent a fini son exécution.
related:
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - 2026-04-25-closure-et-thunk-en-javascript
  - architecture-fondamentaux
  - frontend
backlinks:
  - 2026-04-25-closure-et-thunk-en-javascript
  - la-chaine-de-prototypes-structure-l-heritage-en-javascript
  - le-hoisting-deplace-les-declarations-en-haut-du-scope-mais-pas-leurs-valeurs
  - >-
    les-atoms-d-effect-atom-se-liberent-automatiquement-avec-keepalive-comme-opt-out
  - this-en-javascript-depend-du-site-d-appel-pas-de-la-definition
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - architecture-fondamentaux
  - frontend
topics:
  - backend
  - frontend
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
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a> *(les thunks utilisent souvent des closures)*

**Prérequis** :
- Notion de scope en JS
- Notion de fonction first-class (passable en argument, retournable)

**S'oppose à / à comparer avec** :
- **Scope dynamique** (lisp historique, bash) : la fonction voit les variables là où elle est *appelée*, pas où elle est *définie*. JS est lexical.
- **Capture par valeur** (lambdas C++ par défaut) : JS capture **par référence**, donc une closure voit les modifications ultérieures de la variable

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-25-closure-et-thunk-en-javascript" data-wiki-title="Closure et Thunk en JavaScript" data-wiki-preview="1. Une **closure** est une fonction qui **se souvient des variables de son environnement** (scope) au moment où elle a été créée — même si on l'appelle bien plus tard, ailleurs. 2. Un **thunk** est une fonction qui **enveloppe un calcul pou…">Closure et Thunk en JavaScript</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a> · <a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

