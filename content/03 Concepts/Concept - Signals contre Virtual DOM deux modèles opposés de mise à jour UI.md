---
created: 2026-04-26
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI

## Idée en une phrase

> **Virtual DOM** (React) et **signals** (Solid, Vue, Angular) sont deux stratégies opposées pour répondre à "comment mettre à jour le DOM quand l'état change" : le VDOM ré-exécute et diffe, les signals trackent et patchent directement — chaque modèle a sa contrepartie en DX, perf, et complexité.

## Contexte / pourquoi ça compte

Cette opposition est devenue **le débat structurant du frontend en 2025-2026**. React reste majoritaire en parts de marché, mais l'industrie converge vers les signals : **Vue 4, Angular 20, Preact, Qwik, Solid** sont tous signal-first, et le **React Compiler** est explicitement une tentative d'**obtenir les avantages des signals sans casser l'API hooks**.

Comprendre les deux modèles, c'est :
- Pouvoir lire/écrire dans n'importe lequel de ces frameworks
- Choisir le bon outil pour un projet donné
- Comprendre pourquoi `useMemo` et `useCallback` existent (et pourquoi Solid n'en a pas besoin)

## Détails / mécanisme

### Le Virtual DOM (React)

**Idée** : représenter l'UI comme un arbre d'objets JS (le VDOM), le reconstruire entièrement à chaque update, le differ avec le précédent, appliquer la diff sur le DOM réel.

```
État change
  ↓
Composant ré-exécute (le rendu = une fonction pure)
  ↓
Nouvel arbre VDOM
  ↓
Diff avec l'ancien VDOM (algorithme de réconciliation)
  ↓
Patches → DOM réel
```

**Avantages** :
- **Mental model simple** : "le rendu, c'est une fonction `state → UI`"
- **Pure functions** : facile à tester, à raisonner
- **Découpage en composants** transparent (chaque fonction est un composant)
- **Inertie** : énorme écosystème, énorme tooling

**Inconvénients** :
- **Travail inutile** : ré-exécution de tout le composant pour changer 1 nœud
- **Mémoïsation manuelle** : `useMemo`, `useCallback`, `React.memo`, `key` — tu dois "enseigner" au framework où ne pas re-render
- **Bundle plus gros** : le VDOM + le réconciliateur tournent en runtime (~45 KB)
- **Closures piégeuses** : `stale closure`, `useEffect deps`, `eslint-react-hooks` exists pour ça

### Le modèle signals (SolidJS, Vue 3+, Angular ≥17)

**Idée** : l'état est exposé comme des **valeurs observables** (signals). Quand un signal est lu pendant l'exécution d'un effet réactif, le runtime enregistre la dépendance. Quand le signal change, seuls les effets qui dépendent de lui ré-exécutent.

```
État (signal) change
  ↓
Runtime lookup du graphe de dépendances
  ↓
Seuls les effets / bindings DOM concernés ré-exécutent
  ↓
DOM patché directement (pas de VDOM intermédiaire)
```

**Avantages** :
- **Granularité optimale par défaut** : pas besoin de mémoïser
- **Bundle plus léger** (~5-8 KB)
- **Pas de stale closure** : le signal est toujours lu "frais"
- **Pas de règles des hooks** : tu peux créer un signal dans une condition

**Inconvénients** :
- **Mental model moins évident** : un composant qui ne se ré-exécute pas surprend
- **Pièges spécifiques** : destructuration des props, conditionnelles inline, l'oubli des `()`
- **Écosystème plus jeune** sur Solid (mature sur Vue/Angular)
- **Composants moins purs** : un composant Solid est plus une "fonction d'effet" qu'une fonction pure

## Exemple concret

Même composant, deux mondes :

```typescript
// REACT — re-render à chaque tick du parent
function PriceTag({ price }: { price: number }) {
  const formatted = useMemo(
    () => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price),
    [price] // ← deps array obligatoire
  )
  return <span>{formatted}</span>
}

// SOLIDJS — composant exécuté une fois, le binding réagit au signal
function PriceTag(props: { price: number }) {
  const formatted = createMemo(() =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(props.price)
    // pas de deps — le runtime track props.price tout seul
  )
  return <span>{formatted()}</span>
}
```

L'écart est petit visuellement, mais il dit tout :
- React : tu déclares les deps, ou tu paies en perf
- Solid : le runtime déclare les deps pour toi

### Le compromis React Compiler

```typescript
// Avant (React 18)
const expensive = useMemo(() => computeStuff(a, b), [a, b])

// Après (React 19 + Compiler)
const expensive = computeStuff(a, b)
// → le compiler insère automatiquement la mémoïsation au build time
```

C'est pragmatique : conserver l'API hooks, faire le travail au compilateur. Mais ça reste sur un modèle "ré-exécute le composant et mémoïse intelligemment", **pas** "ne ré-exécute que ce qui change". Le coût n'est pas tout à fait le même.

## Connexions

**Concepts liés** :
- [[Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux]]
- [[Concept - La réactivité fine-grained met à jour seulement le DOM affecté]]
- [[Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS]]

**Prérequis** :
- Connaître React minimum (sinon le contraste est invisible)

**S'oppose à / à comparer avec** :
- **No framework / vanilla JS** : tu fais le diff toi-même, à la main
- **Compile-time approaches (Svelte 5, Qwik)** : pas de runtime du tout — tout est compilé en mutations DOM directes. Plus extrême encore que les signals.

## Sources

- [[2026-04-26 - SolidJS - réactivité fine-grained vs React et Vue]]

## MOC

[[MOC - Frontend]]
