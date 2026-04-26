---
created: 2026-04-26T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS
slug: signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs
excerpt: >-
  Comprendre ces trois primitives, c'est comprendre Solid à 80%. Et c'est aussi
  comprendre **Vue 3 (`ref` / `computed` / `watchEffect`)**, **Angular signals
  (`signal` / `computed` / `effect`)**, **Preact Signals (`signal` / `computed`
  / `effect`)** — le triplet est conceptuellement
oneLiner: >-
  SolidJS expose **trois primitives réactives** qui suffisent à tout exprimer :
  `createSignal` (état modifiable), `createMemo` (valeur dérivée mémoïsée),
  `createEffect` (effet de bord auto-tracké) — les autres APIs
  (`createResource`, `createStore`, `<For>`) ne sont que des compositions de ces
  trois-là.
related:
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
  - la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte
  - signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui
  - 2026-04-26-solidjs-reactivite-fine-grained-vs-react-et-vue
  - frontend
backlinks:
  - 2026-04-26-solidjs-reactivite-fine-grained-vs-react-et-vue
  - la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte
  - signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
  - frontend
---

# Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS

## Idée en une phrase

> SolidJS expose **trois primitives réactives** qui suffisent à tout exprimer : `createSignal` (état modifiable), `createMemo` (valeur dérivée mémoïsée), `createEffect` (effet de bord auto-tracké) — les autres APIs (`createResource`, `createStore`, `<For>`) ne sont que des compositions de ces trois-là.

## Contexte / pourquoi ça compte

Comprendre ces trois primitives, c'est comprendre Solid à 80%. Et c'est aussi comprendre **Vue 3 (`ref` / `computed` / `watchEffect`)**, **Angular signals (`signal` / `computed` / `effect`)**, **Preact Signals (`signal` / `computed` / `effect`)** — le triplet est conceptuellement identique d'une lib à l'autre. C'est devenu le **vocabulaire standard de la réactivité moderne**.

## Détails / mécanisme

### `createSignal` — l'état observable

```typescript
const [count, setCount] = createSignal(0)
// count : Accessor<number>  — fonction qui lit la valeur courante
// setCount : Setter<number> — fonction qui mute la valeur

count()           // lecture : renvoie 0
setCount(5)       // écriture
setCount(c => c + 1) // updater
```

Détail clé : **lire un signal = appeler une fonction**. C'est volontaire. C'est ce qui permet au runtime de tracker les dépendances : "ce code a appelé `count()` → je note la dépendance."

### `createMemo` — valeur dérivée

```typescript
const [first, setFirst] = createSignal("Ada")
const [last, setLast] = createSignal("Lovelace")

const fullName = createMemo(() => `${first()} ${last()}`)
fullName() // "Ada Lovelace"
```

Sémantique :
- **Pure** : pas d'effets de bord
- **Mémoïsée** : recalculée seulement quand une dépendance change
- **Lazy** : évaluée seulement quand quelqu'un la lit
- **Référentiellement stable** : si la valeur ne change pas (par `===`), pas de propagation aval

> `createMemo` ≈ `useMemo` de React, mais sans deps array : le runtime tracke automatiquement les signaux lus.

### `createEffect` — effet de bord auto-tracké

```typescript
const [theme, setTheme] = createSignal("dark")

createEffect(() => {
  document.body.className = theme()
  console.log("thème appliqué:", theme())
})
// → s'exécute UNE fois au montage, puis à chaque setTheme()
```

Sémantique :
- Tracké : ré-exécuté quand une dépendance change
- Effet de bord assumé (DOM, log, fetch, mutation hors React tree)

> `createEffect` ≈ `useEffect` de React, mais sans deps array et **sans cleanup automatique** (utiliser `onCleanup(...)`).

### Tableau de mapping multi-frameworks

| Concept | SolidJS | Angular ≥17 | Vue 3+ | Preact Signals | React (avec compiler) |
|---|---|---|---|---|---|
| Signal | `createSignal` | `signal` | `ref` | `signal` | `useState` (compilé) |
| Memo | `createMemo` | `computed` | `computed` | `computed` | `useMemo` |
| Effect | `createEffect` | `effect` | `watchEffect` | `effect` | `useEffect` |

Bilan : **le triplet est universel**. Apprendre Solid, c'est apprendre Angular signals, et c'est aussi 80% de Vue 3.

### Cleanup et lifecycle

```typescript
import { onMount, onCleanup, createEffect } from "solid-js"

function Component() {
  onMount(() => console.log("monté")) // équivalent useEffect(() => {}, [])
  
  createEffect(() => {
    const id = setInterval(() => console.log("tick"), 1000)
    onCleanup(() => clearInterval(id)) // ← cleanup local au tick d'effet
  })
  
  // Pas de onUnmount séparé — onCleanup fonctionne au niveau composant aussi
  onCleanup(() => console.log("démonté"))
}
```

## Exemple concret

Une "todo list mini" qui combine les trois :

```typescript
function TodoApp() {
  const [todos, setTodos] = createSignal<Todo[]>([])
  const [filter, setFilter] = createSignal<"all" | "done">("all")
  
  // Memo dérivé
  const visible = createMemo(() => 
    filter() === "done" 
      ? todos().filter(t => t.done) 
      : todos()
  )
  
  // Effet : persistance localStorage
  createEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos()))
  })
  
  return (
    <ul>
      <For each={visible()}>
        {todo => <li>{todo.text}</li>}
      </For>
    </ul>
  )
}
```

Trois primitives, comportement complet : état + dérivation + persistance.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux" data-wiki-title="Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux" data-wiki-preview="En SolidJS, **le corps du composant est exécuté une seule fois** au montage : son rôle est de **construire le DOM** et d'**y attacher des bindings réactifs aux signals** — les mises à jour ultérieures contournent complètement le composant.">Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte" data-wiki-title="Concept - La réactivité fine-grained met à jour seulement le DOM affecté" data-wiki-preview="La **réactivité fine-grained** consiste à attacher chaque morceau du DOM à ses dépendances réactives précises, de sorte qu'un changement d'état ne déclenche que la mise à jour des nœuds DOM qui dépendent réellement de cette donnée — pas du…">Concept - La réactivité fine-grained met à jour seulement le DOM affecté</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui" data-wiki-title="Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI" data-wiki-preview="**Virtual DOM** (React) et **signals** (Solid, Vue, Angular) sont deux stratégies opposées pour répondre à &quot;comment mettre à jour le DOM quand l'état change&quot; : le VDOM ré-exécute et diffe, les signals trackent et patchent directement — chaq…">Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI</a>

**Prérequis** :
- Notion de fonction d'ordre supérieur (la primitive, c'est une fonction qu'on appelle)

**S'oppose à / à comparer avec** :
- **Hooks React (`useState` / `useMemo` / `useEffect`)** : sémantiquement proches, mais re-évalués dans un composant ré-exécuté + deps array manuel + règles des hooks
- **MobX** (`@observable` / `@computed` / `autorun`) : conceptuellement très proche, syntaxe par décorateurs

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-solidjs-reactivite-fine-grained-vs-react-et-vue" data-wiki-title="SolidJS — réactivité fine-grained vs React et Vue" data-wiki-preview="1. **SolidJS** est un framework UI créé par **Ryan Carniato**. Syntaxe JSX quasi-identique à React, mais **moteur d'exécution radicalement différent** : pas de Virtual DOM, pas de re-render de composant, mise à jour fine-grained du DOM réel…">SolidJS — réactivité fine-grained vs React et Vue</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

