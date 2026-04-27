---
created: '2026-04-27T06:42:54.168Z'
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: Concept - Le Shadow DOM encapsule style et structure pour empêcher les fuites
slug: le-shadow-dom-encapsule-style-et-structure-pour-empecher-les-fuites
excerpt: >-
  Le DOM est globalement **promiscuous** : un `class="button"` peut entrer en
  conflit avec un autre, un `:root { color: red }` repeint tout, un
  `document.querySelector("input")` traverse tout. Pour des composants
  **réutilisables cross-projet** (design systems, embeds tiers, extensi
oneLiner: >-
  Le **Shadow DOM** est une API navigateur qui crée un **sous-arbre DOM isolé**
  attaché à un élément hôte — son CSS et son DOM **ne fuient pas** vers le
  document, et le CSS du document **ne pénètre pas** sauf via les variables CSS
  et les propriétés héritées — c'est l'**encapsulation native** des Web
  Components.
related:
  - les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - frontend
backlinks:
  - 2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime
  - frontend
topics:
  - frontend
---
## Idée en une phrase

> Le **Shadow DOM** est une API navigateur qui crée un **sous-arbre DOM isolé** attaché à un élément hôte — son CSS et son DOM **ne fuient pas** vers le document, et le CSS du document **ne pénètre pas** sauf via les variables CSS et les propriétés héritées — c'est l'**encapsulation native** des Web Components.

## Contexte / pourquoi ça compte

Le DOM est globalement **promiscuous** : un `class="button"` peut entrer en conflit avec un autre, un `:root { color: red }` repeint tout, un `document.querySelector("input")` traverse tout. Pour des composants **réutilisables cross-projet** (design systems, embeds tiers, extensions), il faut une vraie isolation.

Comprendre le Shadow DOM te permet :
- De savoir **quand** l'utiliser (Web Components, embeds, extensions) et **quand pas** (app React/Vue où tu contrôles tout)
- De saisir comment fonctionnent les libs comme **Lit**, **Adobe Spectrum Web Components**, **Material Web Components**
- De déboguer les "pourquoi mon CSS ne passe pas" sur un `<my-element>`
- De comprendre les `<slot>`, le styling cross-shadow (parts, custom properties)

## Détails / mécanisme

### Anatomie

```typescript
class MyButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" })
    shadow.innerHTML = `
      <style>
        button {
          background: blue;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
        }
      </style>
      <button><slot></slot></button>
    `
  }
}
customElements.define("my-button", MyButton)
```

```html
<my-button>Click me</my-button>
```

L'élément hôte (`<my-button>`) a deux arbres :
- Le **light DOM** : ce que tu écris en HTML (`Click me`)
- Le **shadow DOM** : l'arbre interne (`<style><button><slot></slot></button>`)

Le `<slot>` projette le light DOM dans le shadow tree.

### Encapsulation CSS

```html
<style>
  button { background: red; }   /* ← global, n'affecte PAS le button du shadow */
</style>

<my-button>Click me</my-button>  <!-- reste bleu -->
<button>Other</button>           <!-- devient rouge -->
```

Le CSS global ne traverse pas le shadow boundary. À l'inverse, le `<style>` à l'intérieur du shadow ne fuit pas non plus.

### Ce qui PASSE quand même

- **Propriétés héritées** : `color`, `font-family`, `line-height` — héritées sauf override interne
- **Variables CSS** : `--my-color` définies à l'extérieur sont lisibles dans le shadow
- **`::part`** : éléments marqués `part="..."` peuvent être stylés depuis l'extérieur

```typescript
// Composant
shadow.innerHTML = `
  <style>
    button { background: var(--btn-bg, blue); }
  </style>
  <button part="trigger"><slot></slot></button>
`
```

```css
/* Document parent */
my-button { --btn-bg: green; }            /* ✅ var CSS passe */
my-button::part(trigger) { font-weight: bold; }  /* ✅ part API */
```

C'est ce qui permet **theming** d'un design system sans casser l'encapsulation.

### `mode: "open"` vs `"closed"`

```typescript
const shadow = this.attachShadow({ mode: "open" })   // accessible via this.shadowRoot
const shadow = this.attachShadow({ mode: "closed" }) // shadowRoot reste null depuis l'extérieur
```

**`open` est la convention** pour 3 raisons :
1. `closed` n'est **pas un mécanisme de sécurité** (un attaquant peut intercepter `attachShadow` avant que ton code s'exécute)
2. `closed` bloque les outils de debug et les libs d'instrumentation
3. La plupart des frameworks (Lit, Stencil) imposent `open`

### Bonne pratique : Web Components réutilisables cross-framework

```typescript
// ✅ Composant publié comme lib UI — fonctionne dans React, Vue, vanilla
class CardModal extends HTMLElement {
  static observedAttributes = ["title"]

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" })
    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 16px; border: 1px solid #ccc; border-radius: 8px; }
        :host([hidden]) { display: none; }
        .title { font-weight: bold; margin-bottom: 8px; }
      </style>
      <div class="title">${this.getAttribute("title") ?? ""}</div>
      <slot></slot>
    `
  }
}
customElements.define("card-modal", CardModal)
```

```html
<!-- Marche dans n'importe quelle page -->
<card-modal title="Hello"><p>Body</p></card-modal>
```

Tu peux distribuer `<card-modal>` sur npm — un projet React peut l'utiliser via `<card-modal>`, un projet Vue idem, sans aucune adaptation.

### `:host` — styler l'élément hôte

```css
/* Depuis le shadow */
:host { display: block; }
:host([disabled]) { opacity: 0.5; }
:host(.primary) { background: blue; }
:host-context(.dark) { color: white; }   /* style basé sur l'ancêtre */
```

`:host` cible le **conteneur** (le `<my-button>` lui-même), pas son contenu shadow.

### Mauvaise pratique : Shadow DOM dans une app React/Vue/Svelte

```typescript
// ❌ Surcoût sans bénéfice
function ReactComponent() {
  // Tu n'as PAS besoin de Shadow DOM ici. Le scoping CSS de ton framework
  // (CSS Modules, Tailwind, styled-components, Vue scoped) suffit largement.
}
```

Inconvénients dans une app React :
- `document.querySelector` ne traverse pas le shadow → casse les libs qui scannent le DOM (form libs, accessibility tools, end-to-end tests)
- Les events `composedPath()` deviennent obligatoires
- Les portails React (`createPortal`) interagissent mal avec les shadow roots
- Les **focus management**, **selection ranges**, **drag & drop** sont plus complexes

Shadow DOM = **pour les composants distribués** (Web Components publiés en lib). Pas pour la modularisation interne d'une SPA où tu maîtrises tout.

### Bonne pratique : shadowRoot déclaratif (SSR Web Components)

```html
<!-- Compatible SSR, sans JS pour le styling initial -->
<card-modal>
  <template shadowrootmode="open">
    <style>:host { display: block; }</style>
    <slot></slot>
  </template>
  <p>Body content</p>
</card-modal>
```

Disponible depuis 2023. Permet aux Web Components d'être **rendus côté serveur** avec leur shadow tree, sans flash de contenu non-stylé.

### Mauvaise pratique : abuser de `mode: "closed"` pour "cacher" du code

```typescript
// ❌ Faux sens de sécurité
attachShadow({ mode: "closed" })  // ne protège de rien
```

Un attaquant qui contrôle la page peut :
- Override `Element.prototype.attachShadow` avant ton code
- Lire le shadow via `Event.composedPath()` à l'intérieur du shadow

Si tu as besoin d'isolation **sécurisée**, utilise un **iframe** (origine séparée).

### Slots — projection de contenu

```html
<my-card>
  <span slot="title">Title</span>
  <p>Body (default slot)</p>
  <button slot="actions">OK</button>
</my-card>
```

```typescript
// Dans le shadow
shadow.innerHTML = `
  <header><slot name="title"></slot></header>
  <main><slot></slot></main>           <!-- default slot -->
  <footer><slot name="actions"></slot></footer>
`
```

Permet de composer comme avec `children`/`<slot>` en React/Vue, mais **côté natif**.

## Exemple concret

### Cas réel : embedder un widget tiers

```typescript
// Un player vidéo distribué comme Web Component
class VideoPlayer extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" })
    shadow.innerHTML = `
      <style>
        /* Tout ce CSS reste isolé — le blog hôte ne peut pas le casser */
        :host { display: block; aspect-ratio: 16/9; }
        video { width: 100%; height: 100%; }
        .controls { position: absolute; bottom: 0; ... }
      </style>
      <video src="${this.getAttribute("src")}"></video>
      <div class="controls">...</div>
    `
  }
}
customElements.define("video-player", VideoPlayer)
```

Un blog qui embed `<video-player src="...">` est **garanti** que son CSS (`p { color: red }`, `.controls { display: none }`) ne va pas casser le widget. C'est l'argument N°1 des **libs UI distribuables**.

### Cas réel : extension navigateur

Une extension qui injecte une UI dans n'importe quelle page utilise quasi-toujours Shadow DOM :

```typescript
// content-script.ts
const host = document.createElement("div")
document.body.appendChild(host)
const shadow = host.attachShadow({ mode: "open" })
shadow.innerHTML = `
  <style>/* CSS isolé du site */</style>
  <div class="my-extension-ui">...</div>
`
```

Sans Shadow DOM, le CSS de Twitter, GitHub, ou n'importe quel site casserait l'UI de l'extension.

### Cas réel : Lit (la lib Web Components moderne)

```typescript
import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("my-counter")
class MyCounter extends LitElement {
  static styles = css`
    :host { display: block; padding: 16px; }
    button { font-size: 1.2rem; }
  `

  @property({ type: Number }) count = 0

  render() {
    return html`
      <button @click=${() => this.count++}>+</button>
      <span>${this.count}</span>
    `
  }
}
```

Lit gère le Shadow DOM automatiquement, te donne des templates avec interpolation et l'autocomplétion. C'est la voie **moderne** pour des Web Components custom.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives" data-wiki-title="Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives" data-wiki-preview="En 2026, l'**écart de capacités** entre PWA et apps natives s'est massivement réduit grâce aux APIs nouvelles ou stabilisées (File System Access, Window Controls Overlay, Web Push iOS, WebAuthn, USB/Bluetooth/Serial, Web Payment) — au point…">Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives</a> *(les PWA se composent souvent de Web Components à shadow DOM)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux" data-wiki-title="Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux" data-wiki-preview="En SolidJS, **le corps du composant est exécuté une seule fois** au montage : son rôle est de **construire le DOM** et d'**y attacher des bindings réactifs aux signals** — les mises à jour ultérieures contournent complètement le composant.">Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux</a> *(SolidJS peut générer des Web Components avec shadow)*

**Prérequis** :
- DOM API basique (querySelector, attributs, événements)
- `class extends HTMLElement` (Custom Elements)

**S'oppose à / à comparer avec** :
- **CSS Modules / Vue scoped / styled-components** : encapsulation **simulée** au build, scope via classes uniques générées
- **Iframes** : encapsulation forte (jusqu'à isolation d'origine) mais lourde et avec des limitations (pas de partage de fonts/cookies/state)
- **Web Components sans Shadow DOM** : on peut faire un Custom Element sans shadow, on perd l'isolation CSS

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-javascript-paradigmes-fonctionnels-et-mecanismes-runtime" data-wiki-title="JavaScript — paradigmes fonctionnels et mécanismes runtime" data-wiki-preview="1. **Currying** transforme `f(a, b, c)` en `f(a)(b)(c)` — utile en FP / pipeline, dangereux en code applicatif (illisible si abusé). 2. **Composition** chaîne des fonctions pures `g(f(x))` — la base du style &quot;data → pipeline&quot; (RxJS, Effect,…">JavaScript — paradigmes fonctionnels et mécanismes runtime</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

