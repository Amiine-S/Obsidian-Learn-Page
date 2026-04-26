---
created: 2026-04-26
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - La réactivité fine-grained met à jour seulement le DOM affecté

## Idée en une phrase

> La **réactivité fine-grained** consiste à attacher chaque morceau du DOM à ses dépendances réactives précises, de sorte qu'un changement d'état ne déclenche que la mise à jour des nœuds DOM qui dépendent réellement de cette donnée — pas du composant entier, pas d'un sous-arbre, **juste le nœud**.

## Contexte / pourquoi ça compte

C'est l'idée centrale qui sépare les frameworks dits "à signals" (Solid, Angular ≥17, Vue 3+, Preact Signals, Qwik) du modèle Virtual DOM "coarse-grained" (React classique).

Pourquoi c'est important :
- **Perf** : éviter le travail inutile (re-render + diff + patch) quand seule une valeur a changé
- **Mental model** : tu n'as plus à mémoïser pour des raisons de perf — la granularité est correcte par défaut
- **Bundle size** : pas besoin de Virtual DOM en runtime → core ~5-8 KB au lieu de ~45 KB

## Détails / mécanisme

### Granularité — le mot clé

| Granularité | Quoi est ré-exécuté quand X change | Exemples |
|---|---|---|
| **App entière** | Tout l'app | jQuery `.html()` brutal |
| **Composant racine** | Tout l'arbre depuis la racine | React 0.x sans `shouldComponentUpdate` |
| **Composant** | Le composant + ses enfants | React moderne (avec memo, sinon depuis le composant qui set state jusqu'à toutes les feuilles) |
| **Sous-expression JSX** | Juste les bindings DOM concernés | **SolidJS, Vue avec `setup`, Angular signals** |

Solid pousse la granularité au minimum théorique : **un effet réactif par binding DOM**.

### Mécanique sous-jacente

À chaque **lecture** d'un signal pendant l'exécution d'un effet (interne ou via `createEffect`), le runtime enregistre **une dépendance signal → effet**. Quand le signal change, il rappelle tous les effets qui le lisent.

```typescript
const [a, setA] = createSignal(1)
const [b, setB] = createSignal(2)

createEffect(() => console.log("A changé:", a()))     // dépend de A seulement
createEffect(() => console.log("Somme:", a() + b()))  // dépend de A et B

setA(10) // → log "A changé: 10" + "Somme: 12"
setB(20) // → log "Somme: 30" UNIQUEMENT (le 1er effet n'écoute pas B)
```

Pas de tableau de deps. Le runtime construit un graphe de dépendances **dynamique**, basé sur les lectures effectives à chaque tick.

### Au niveau du DOM

```jsx
<div>
  <h1>{title()}</h1>      {/* binding effet : title → textContent */}
  <span>{count()}</span>  {/* binding effet : count → textContent */}
  <ul>
    <For each={items()}>  {/* binding effet : items → réconciliation de liste */}
      {item => <li>{item.name}</li>}
    </For>
  </ul>
</div>
```

Si tu changes `title`, **seul** le `textContent` du `<h1>` est touché. Le `<span>` n'est pas inspecté, le `<For>` n'est pas réconcilié, rien d'autre n'est fait.

## Exemple concret

Cas d'école : 1000 lignes dans un tableau, on update une seule.

```typescript
const [rows, setRows] = createSignal([
  { id: 1, name: "Alice", lastSeen: "now" },
  // ... 999 autres
])

// On modifie UNE ligne
setRows(rs => rs.map(r => r.id === 42 ? { ...r, name: "Bob" } : r))
```

| Framework | Travail effectué |
|---|---|
| React (sans memo) | 1000 composants ré-exécutés, 1000 nœuds VDOM diffés, 1 nœud DOM patché |
| React (avec `key` + memo) | 1 composant ré-exécuté, 1 diff, 1 patch |
| **SolidJS (`<For>` + signal)** | 1 effet déclenché, **1 patch DOM**, zéro composant ré-exécuté |

Sur un dataset normal, la différence est imperceptible. Sur 100 000 nœuds avec mises à jour fréquentes (dashboards trading, jeux, simulations), c'est l'écart entre fluide et saccadé.

## Connexions

**Concepts liés** :
- [[Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux]]
- [[Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS]]
- [[Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI]]

**Prérequis** :
- Notion de signal (getter/setter réactif)

**S'oppose à / à comparer avec** :
- **Virtual DOM React** : granularité au composant, diff comme heuristique pour ne pas tout patcher
- **Direct DOM (jQuery)** : zéro granularité, c'est toi qui choisis quoi patcher

## Sources

- [[2026-04-26 - SolidJS - réactivité fine-grained vs React et Vue]]

## MOC

[[MOC - Frontend]]
