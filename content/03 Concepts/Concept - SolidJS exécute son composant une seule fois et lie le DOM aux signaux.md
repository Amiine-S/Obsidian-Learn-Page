---
created: 2026-04-26
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux

## Idée en une phrase

> En SolidJS, **le corps du composant est exécuté une seule fois** au montage : son rôle est de **construire le DOM** et d'**y attacher des bindings réactifs aux signals** — les mises à jour ultérieures contournent complètement le composant.

## Contexte / pourquoi ça compte

C'est la rupture mentale la plus dure pour un dev React. En React, on est habitué à dire "ce composant re-render quand son state change". En Solid, **le composant est juste un constructeur**. Une fois exécuté, il disparaît : il ne reste que le DOM et les bindings réactifs au signal.

Comprendre ça change ta façon d'écrire le code (les `console.log` dans le corps ne loggent qu'une fois, les fonctions définies au-dessus du `return` ne se redéfinissent jamais, etc.).

## Détails / mécanisme

### Compilation : JSX → instructions DOM

Le compilateur SolidJS (`babel-plugin-jsx-dom-expressions`) transforme ce JSX :

```typescript
function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>
}
```

en quelque chose comme :

```typescript
function Counter() {
  const [count, setCount] = createSignal(0)
  
  // Création du DOM en dur — fait UNE FOIS
  const _el = document.createElement("button")
  _el.addEventListener("click", () => setCount(c => c + 1))
  
  // Création d'un binding réactif — l'effet ré-écrit le textContent à chaque tick du signal
  insert(_el, () => count())
  
  return _el
}
```

Le `insert(_el, () => count())` enveloppe la lecture `count()` dans un `createEffect` interne : à chaque fois que `count` change, **seul** ce binding ré-exécute, **seul** ce `textContent` est mis à jour.

### Conséquences pratiques

```typescript
function MyComp() {
  console.log("setup")              // ← UNE fois au mount
  const [n, setN] = createSignal(0)
  
  const upper = (s: string) => s.toUpperCase() // ← définie UNE fois
  
  setInterval(() => setN(x => x + 1), 1000)
  // → setInterval lancé UNE fois, OK ; pas besoin de useEffect
  
  return <div>{upper("hello")}: {n()}</div>
}
```

Pas de `useCallback`. Pas de `useMemo` pour stabiliser des références. Pas de "render funny." Le code que tu écris est exécuté littéralement.

### Les pièges qui en découlent

**Piège 1 — destructuration des props** :
```typescript
// ❌ Captures la valeur figée au mount
function Greet({ name }: { name: string }) {
  return <h1>Hello {name}</h1> // ← string statique
}

// ✅ Garde l'accès via props (proxy réactif)
function Greet(props: { name: string }) {
  return <h1>Hello {props.name}</h1>
}
```

**Piège 2 — conditionnelles** :
```typescript
// ❌ Évalue en dur au mount, donc figé
function App(props) {
  if (props.loggedIn) return <Dashboard />
  return <Login />
}

// ✅ Conditionnelle réactive
function App(props) {
  return <Show when={props.loggedIn} fallback={<Login />}><Dashboard /></Show>
}
```

## Exemple concret

Mise en parallèle frontale avec React :

```typescript
// REACT
function Counter() {
  console.log("render")            // s'imprime à CHAQUE clic
  const [n, setN] = useState(0)
  const expensive = computeStuff() // recalcule à CHAQUE clic (sauf useMemo)
  return <button onClick={() => setN(n + 1)}>{n} ({expensive})</button>
}

// SOLIDJS
function Counter() {
  console.log("setup")              // s'imprime UNE fois
  const [n, setN] = createSignal(0)
  const expensive = computeStuff() // calculé UNE fois — pas de useMemo nécessaire
  return <button onClick={() => setN(x => x + 1)}>{n()} ({expensive})</button>
}
```

Le coût d'une fonction "tu paies par dépendance qui change", pas "tu paies par render."

## Connexions

**Concepts liés** :
- [[Concept - La réactivité fine-grained met à jour seulement le DOM affecté]]
- [[Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS]]

**Prérequis** :
- Comprendre les signals (au moins l'idée d'un getter/setter réactif)

**S'oppose à / à comparer avec** :
- **React Virtual DOM** : ré-exécute le composant à chaque update, diff l'arbre, patch
- **Vue (proxies)** : intermédiaire — composant ré-exécuté mais avec tracking proxy automatique
- **Svelte** : encore plus radical — pas de runtime du tout, tout est compilé en mutations directes

## Sources

- [[2026-04-26 - SolidJS - réactivité fine-grained vs React et Vue]]

## MOC

[[MOC - Frontend]]
