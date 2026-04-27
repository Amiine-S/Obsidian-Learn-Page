---
title: SolidJS — réactivité fine-grained vs React et Vue
url: 'https://www.solidjs.com/'
author: Ryan Carniato (créateur) · synthèse Claude
digested: '2026-04-26T15:34:57.361Z'
format: doc
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/intermediate
slug: 2026-04-26-solidjs-reactivite-fine-grained-vs-react-et-vue
excerpt: >-
  1. **SolidJS** est un framework UI créé par **Ryan Carniato**. Syntaxe JSX
  quasi-identique à React, mais **moteur d'exécution radicalement différent** :
  pas de Virtual DOM, pas de re-render de composant, mise à jour fine-grained du
  DOM réel. 2. Le **composant ne s'exécute qu'une
related:
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
  - la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte
  - signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs
  - signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui
  - frontend
backlinks:
  - la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte
  - signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs
  - signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
topics:
  - frontend
---
## Pourquoi cette source

> Comprendre **ce qui distingue vraiment SolidJS** de React et Vue : pas seulement la syntaxe ou la perf brute, mais le **modèle d'exécution** sous-jacent (signals fine-grained vs Virtual DOM vs proxies réactifs). C'est le framework qui a popularisé les signals — modèle adopté ensuite par Angular 20, Vue 4, Preact, et qui influence le React Compiler.

## Résumé en 5 lignes

1. **SolidJS** est un framework UI créé par **Ryan Carniato**. Syntaxe JSX quasi-identique à React, mais **moteur d'exécution radicalement différent** : pas de Virtual DOM, pas de re-render de composant, mise à jour fine-grained du DOM réel.
2. Le **composant ne s'exécute qu'une seule fois** au montage. Ce qui ré-évalue ensuite, ce sont les **dépendances réactives** (signals) — uniquement les fragments JSX qui en dépendent.
3. **Trois primitives** : `createSignal` (état), `createMemo` (valeur dérivée), `createEffect` (effet de bord). Tout le reste s'en déduit.
4. Côté perf, SolidJS truste le top du **js-framework-benchmark** depuis 2021. Bundle ~7.6 KB gzipped vs React+ReactDOM ~45 KB. Mémoire et update DOM ~70% plus rapides que React sur des charges intenses.
5. En 2026, **les signals ont gagné** : Angular 20, Vue 4, Preact Signals, Qwik, et même React (via le React Compiler) convergent vers ce modèle. SolidJS reste la référence "pure" du paradigme.

---

## 1. Le modèle mental — la rupture vs React

### React (Virtual DOM)

```typescript
function Counter() {
  const [count, setCount] = useState(0)
  console.log("render") // ← s'imprime à chaque clic
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

À chaque update :
1. Le composant **ré-exécute son corps** entièrement
2. React construit un nouveau Virtual DOM
3. Diff avec l'ancien Virtual DOM
4. Patch du DOM réel

C'est simple à comprendre, coûteux à exécuter. D'où `useMemo`, `useCallback`, `React.memo` — tout l'arsenal pour **éviter le re-render**.

### SolidJS (fine-grained reactivity)

```typescript
function Counter() {
  const [count, setCount] = createSignal(0)
  console.log("setup") // ← s'imprime UNE seule fois
  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>
}
```

À chaque update :
1. **Le composant ne s'exécute pas**
2. Le signal `count` notifie ses dépendants
3. **Seul le node texte du `<button>`** est mis à jour dans le DOM réel

Pas de Virtual DOM, pas de diff, pas de "render". Le compilateur Solid (basé sur **Babel/dom-expressions**) transforme ton JSX en **instructions DOM directes** au build time.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux" data-wiki-title="Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux" data-wiki-preview="En SolidJS, **le corps du composant est exécuté une seule fois** au montage : son rôle est de **construire le DOM** et d'**y attacher des bindings réactifs aux signals** — les mises à jour ultérieures contournent complètement le composant.">Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux</a>
→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/la-reactivite-fine-grained-met-a-jour-seulement-le-dom-affecte" data-wiki-title="Concept - La réactivité fine-grained met à jour seulement le DOM affecté" data-wiki-preview="La **réactivité fine-grained** consiste à attacher chaque morceau du DOM à ses dépendances réactives précises, de sorte qu'un changement d'état ne déclenche que la mise à jour des nœuds DOM qui dépendent réellement de cette donnée — pas du…">Concept - La réactivité fine-grained met à jour seulement le DOM affecté</a>

---

## 2. Les trois primitives

### `createSignal` — état réactif

```typescript
const [count, setCount] = createSignal(0)

// LECTURE = appel de fonction
console.log(count())          // 0

// ÉCRITURE
setCount(5)                    // valeur directe
setCount(c => c + 1)           // updater
```

> ⚠️ Différence cruciale avec React : **`count` est une fonction, pas une valeur**. C'est ce qui permet le tracking automatique des dépendances.

### `createMemo` — valeur dérivée mémoïsée

```typescript
const [first, setFirst] = createSignal("Ada")
const [last, setLast] = createSignal("Lovelace")

const fullName = createMemo(() => `${first()} ${last()}`)

console.log(fullName()) // "Ada Lovelace"
setFirst("Grace")
console.log(fullName()) // "Grace Lovelace" — recalculé à la demande
```

Équivalent de `useMemo`, mais sans liste de dépendances : le système réactif les détecte tout seul (les `first()` et `last()` lus dans le callback).

### `createEffect` — effet de bord auto-tracké

```typescript
createEffect(() => {
  console.log("count =", count())
})
// s'exécute une première fois au setup, puis à chaque changement de count
```

Équivalent de `useEffect`, mais là encore **sans tableau de dépendances**.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/signal-memo-effect-sont-les-trois-primitives-reactives-de-solidjs" data-wiki-title="Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS" data-wiki-preview="SolidJS expose **trois primitives réactives** qui suffisent à tout exprimer : `createSignal` (état modifiable), `createMemo` (valeur dérivée mémoïsée), `createEffect` (effet de bord auto-tracké) — les autres APIs (`createResource`, `createS…">Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS</a>

---

## 3. Syntaxe — JSX, mais traître

Visuellement c'est React. En réalité, plusieurs **pièges** quand on vient de React.

### 3.1 — La destructuration tue la réactivité

```typescript
// ❌ MAUVAIS — `count` n'est plus le signal, c'est sa valeur figée au montage
function Bad({ count }) {
  return <div>{count}</div> // ne se met plus jamais à jour
}

// ✅ BON — on garde la prop comme accesseur
function Good(props) {
  return <div>{props.count()}</div>
}
```

Les props Solid sont un **objet réactif (proxy)**. Destructurer le casse.

### 3.2 — Les conditionnelles passent par `<Show>`

```typescript
// ❌ MAUVAIS pour la perf — ré-évalue tout l'arbre
{loggedIn() ? <Dashboard /> : <Login />}

// ✅ BON — Solid optimise spécifiquement
<Show when={loggedIn()} fallback={<Login />}>
  <Dashboard />
</Show>
```

### 3.3 — Les listes via `<For>`

```typescript
// ❌ MAUVAIS — re-crée tous les nœuds DOM si la liste change
{items().map(item => <li>{item.name}</li>)}

// ✅ BON — réconciliation par identité, ne touche que les nœuds modifiés
<For each={items()}>
  {item => <li>{item.name}</li>}
</For>
```

C'est l'équivalent du `key` de React, mais **construit dans le langage** plutôt que prop ad-hoc.

---

## 4. Les performances en chiffres (2026)

Source : [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/), Lighthouse, comparatifs 2026.

| Métrique | SolidJS | React 19 | Vue 4 | Svelte 5 |
|---|---|---|---|---|
| Bundle core (min+gzip) | **~7.6 KB** | ~45 KB | ~38 KB | ~5 KB |
| js-framework-benchmark (ops/s, plus = mieux) | **42.8** | 28.4 | ~38 | ~40 |
| Lighthouse score (app moyenne) | **98** | ~88 | ~92 | ~95 |
| Cold start (app SPA moyenne) | très rapide | moyen | rapide | très rapide |
| Update DOM gros tableau (1000 items, partial update) | **~70% plus rapide** que React | baseline | ~30% plus rapide | similaire à Solid |

**Lecture honnête** : la différence de **bundle** (7.6 KB vs 45 KB) est massive et palpable au cold start, surtout sur mobile 4G. La différence sur les **micro-perfs** (ops/s du benchmark) est réelle mais peu sensible sur des apps "normales" — c'est sur les UIs très réactives (dashboards trading, animations, listes énormes) qu'elle se voit.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/signals-contre-virtual-dom-deux-modeles-opposes-de-mise-a-jour-ui" data-wiki-title="Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI" data-wiki-preview="**Virtual DOM** (React) et **signals** (Solid, Vue, Angular) sont deux stratégies opposées pour répondre à &quot;comment mettre à jour le DOM quand l'état change&quot; : le VDOM ré-exécute et diffe, les signals trackent et patchent directement — chaq…">Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI</a>

---

## 5. SolidJS vs React vs Vue — tableau de synthèse

| | SolidJS | React 19 | Vue 4 |
|---|---|---|---|
| Modèle réactif | **Signals fine-grained** | Virtual DOM (+ Compiler en option) | Proxies réactifs + signals |
| Composant ré-exécuté à chaque update | ❌ (1 fois total) | ✅ (à chaque render) | ⚠️ (dépend — selon SFC + `<script setup>`) |
| Virtual DOM | ❌ | ✅ | ✅ (en interne) |
| Tracking deps automatique | ✅ (lecture du signal) | ❌ (deps array manuel) | ✅ (proxies) |
| Bundle core | ~7.6 KB | ~45 KB | ~38 KB |
| Apprentissage si tu viens de React | 🟢 trompeusement facile (mais pièges) | — | 🟡 |
| Écosystème (UI libs, formulaires, routers) | 🟡 (croissant, SolidStart pour le SSR) | 🟢🟢 | 🟢 |
| Adoption en prod 2026 | 🟡 (niche grandissante) | 🟢🟢 (dominante) | 🟢 (forte en Asie/Europe) |
| Mainteneur | Ryan Carniato (1 personne, sponsor open source) | Meta | Evan You |

**Verdict pragmatique** :
- **Tu démarres un projet from scratch et la perf compte** (animations, dashboards, mobile faible bande passante) → SolidJS est un excellent choix.
- **Tu as déjà l'écosystème React** (RN, Next, libs métier) → reste sur React 19 + le Compiler. L'écart se réduit.
- **Tu veux un compromis maturité/perf** → Vue 4 a très bien adopté les signals tout en gardant son écosystème.
- **Tu veux comprendre les signals à fond** → écris du Solid pendant 2 semaines. C'est l'implémentation la plus pure du paradigme.

---

## 6. SolidStart — le meta-framework

Comme **Next.js** est à React, **SolidStart** est à Solid : SSR, file-based routing, Server Functions, streaming. Sortie 1.0 fin 2024, mature en 2026. Beaucoup plus léger que Next, mais écosystème plus restreint.

```typescript
// routes/users/[id].tsx — file-based routing
export default function UserPage() {
  const params = useParams()
  const user = createAsync(() => getUser(params.id)) // server fn
  return <Show when={user()}>{u => <h1>{u().name}</h1>}</Show>
}
```

---

## Citations brutes

> *"Solid components run once. Forever. No re-renders. No reconciler. Just fine-grained reactivity."* — Ryan Carniato, talk JSConf.

> *"Signals won."* — réflexion communautaire 2026 sur l'adoption transversale du modèle (Angular, Vue, Preact, Qwik).

---

## À explorer ensuite

- **Stores Solid** (`createStore`, `produce`) : équivalent de Zustand mais branché sur les signals
- **`createResource`** : gestion du data fetching avec Suspense
- **SolidStart Server Functions** : équivalent des Server Actions Next/RSC
- **Signal-based React** : comment le React Compiler arrive au même résultat depuis l'autre direction
- **Pourquoi ni Solid ni Vue ne battent Svelte 5** sur le bundle final (Svelte = compile-only, Solid garde un mini runtime)

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

## Sources web

- [The state of Solid.js in 2026 — listiak.dev](https://listiak.dev/blog/the-state-of-solid-js-in-2026-signals-performance-and-growing-influence)
- [SolidJS vs React (2026) Performance Benchmarks — boundev.com](https://www.boundev.com/blog/solidjs-vs-react-2026-performance-guide)
- [2026 Frontend Framework War — dev.to](https://dev.to/linou518/2026-frontend-framework-war-signals-won-react-is-living-off-its-ecosystem-2dki)
- [React vs Solid.js in 2026 — pkgpulse.com](https://www.pkgpulse.com/blog/react-vs-solidjs-2026)

