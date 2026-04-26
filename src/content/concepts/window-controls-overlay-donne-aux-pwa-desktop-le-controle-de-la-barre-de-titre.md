---
created: 2026-04-26T00:00:00.000Z
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
title: >-
  Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la
  barre de titre
slug: window-controls-overlay-donne-aux-pwa-desktop-le-controle-de-la-barre-de-titre
excerpt: >-
  Visuellement, c'est ce qui sépare une "PWA installée" d'une "vraie app native"
  : la PWA classique a une barre de titre OS générique en haut (qui dit le nom
  de l'app et c'est tout). Une app native (Slack, Discord, VS Code) utilise
  toute la fenêtre — la barre de titre intègre le lo
oneLiner: >-
  **Window Controls Overlay (WCO)** est une feature PWA qui permet à l'app
  installée en desktop de **dessiner ses propres éléments dans la zone de la
  barre de titre** — l'OS conserve uniquement les contrôles de fenêtre
  (min/max/close), tout le reste devient ton header personnalisé.
related:
  - file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux
  - les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives
  - 2026-04-26-nouveautes-pwa-en-2026
  - frontend
backlinks:
  - 2026-04-26-nouveautes-pwa-en-2026
  - file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux
  - les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives
  - frontend
topics:
  - frontend
  - typescript
---

# Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la barre de titre

## Idée en une phrase

> **Window Controls Overlay (WCO)** est une feature PWA qui permet à l'app installée en desktop de **dessiner ses propres éléments dans la zone de la barre de titre** — l'OS conserve uniquement les contrôles de fenêtre (min/max/close), tout le reste devient ton header personnalisé.

## Contexte / pourquoi ça compte

Visuellement, c'est ce qui sépare une "PWA installée" d'une "vraie app native" : la PWA classique a une barre de titre OS générique en haut (qui dit le nom de l'app et c'est tout). Une app native (Slack, Discord, VS Code) utilise toute la fenêtre — la barre de titre intègre le logo, le menu, le search, etc.

WCO te donne ce **dernier 5%** d'intégration visuelle. C'est un détail, mais c'est un signal fort de qualité, et c'est ce qui rend les PWA installées **convaincantes** comme replacement d'apps natives en 2026.

## Détails / mécanisme

### Activation côté manifest

```json
{
  "name": "MyApp",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"]
}
```

`display_override` est une liste prioritaire. Le navigateur prend le premier mode qu'il supporte. Si WCO n'est pas supporté, fallback sur `standalone`.

### Récupérer la zone via CSS

La barre de titre a 4 variables d'environnement CSS :
- `env(titlebar-area-x)` — position X (0 normalement)
- `env(titlebar-area-y)` — position Y (0)
- `env(titlebar-area-width)` — largeur disponible (= largeur fenêtre - boutons OS)
- `env(titlebar-area-height)` — hauteur (~30-40 px)

```css
.app-title-bar {
  position: fixed;
  top: env(titlebar-area-y, 0);
  left: env(titlebar-area-x, 0);
  width: env(titlebar-area-width, 100%);
  height: env(titlebar-area-height, 40px);
  background: var(--brand);
  
  /* Permet de drag la fenêtre comme un titlebar natif */
  -webkit-app-region: drag;
  app-region: drag;
}

.app-title-bar button {
  /* Boutons interactifs : opt-out du drag */
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
```

### Détection JS et événement

```typescript
if (navigator.windowControlsOverlay?.visible) {
  document.body.classList.add("wco-active")
}

navigator.windowControlsOverlay?.addEventListener("geometrychange", (e) => {
  // Ré-adapter le layout si la fenêtre est resized
  const rect = navigator.windowControlsOverlay.getTitlebarAreaRect()
  console.log("titlebar:", rect.width, rect.height)
})
```

### Comportement utilisateur

- À l'installation, le browser peut demander confirmation pour activer WCO
- L'utilisateur peut désactiver WCO **après l'install** (settings de l'app)
- Si désactivé, fallback gracieux vers `standalone` — d'où l'importance de garder un design **dégradable**

### Patterns courants

**Pattern 1 — Header avec branding + actions** :
```jsx
<div className="title-bar">
  <img src="/logo.svg" alt="Logo" />
  <h1>MyApp</h1>
  <button onClick={...}>Settings</button>
</div>
```

**Pattern 2 — Tabs en haut (style VS Code / Slack)** :
```jsx
<div className="title-bar">
  <Tabs>
    <Tab>Channel #1</Tab>
    <Tab>Channel #2</Tab>
  </Tabs>
</div>
```

**Pattern 3 — Search bar globale** :
```jsx
<div className="title-bar">
  <input className="global-search" placeholder="Search..." />
</div>
```

## Exemple concret

Composant React minimal :

```typescript
import { useEffect, useState } from "react"

function useWCO() {
  const [visible, setVisible] = useState(
    !!navigator.windowControlsOverlay?.visible
  )
  useEffect(() => {
    const onChange = () => setVisible(!!navigator.windowControlsOverlay?.visible)
    navigator.windowControlsOverlay?.addEventListener("geometrychange", onChange)
    return () => navigator.windowControlsOverlay?.removeEventListener("geometrychange", onChange)
  }, [])
  return visible
}

function AppHeader() {
  const wco = useWCO()
  return (
    <header className={wco ? "wco-titlebar" : "normal-titlebar"}>
      <Logo />
      <Search />
      <UserMenu />
    </header>
  )
}
```

```css
.wco-titlebar {
  position: fixed;
  top: 0;
  left: env(titlebar-area-x);
  width: env(titlebar-area-width);
  height: env(titlebar-area-height);
  -webkit-app-region: drag;
}
.normal-titlebar {
  /* layout normal hors WCO */
}
```

### Apps publiques qui l'utilisent

- **Microsoft Edge** lui-même (en mode app)
- **Twitter/X PWA**
- **Outlook web installé**
- Beaucoup d'apps internes B2B (peu visibles, mais nombreuses)

### Compat 2026

| Navigateur / OS | WCO |
|---|---|
| Chrome / Edge desktop (Win, Mac, Linux) | ✅ |
| Safari (Mac) | ⚠️ Tech Preview |
| Firefox | ❌ |
| Mobile (toutes) | ❌ (pas pertinent) |

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux" data-wiki-title="Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux" data-wiki-preview="La **File System Access API** permet à une page web (et donc à une PWA) d'**ouvrir, lire, modifier et sauvegarder** des fichiers sur le système de fichiers réel de l'utilisateur — et non plus seulement de blobs sandboxés — moyennant **une p…">Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives" data-wiki-title="Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives" data-wiki-preview="En 2026, l'**écart de capacités** entre PWA et apps natives s'est massivement réduit grâce aux APIs nouvelles ou stabilisées (File System Access, Window Controls Overlay, Web Push iOS, WebAuthn, USB/Bluetooth/Serial, Web Payment) — au point…">Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives</a>

**Prérequis** :
- PWA installée (manifest + service worker)
- CSS env() variables

**S'oppose à / à comparer avec** :
- **Standalone display** classique : pas de WCO, barre de titre OS classique
- **Electron / Tauri** : équivalent en app native, où tu as toujours eu ce contrôle
- **Browser tab classique** : zéro contrôle de chrome navigateur

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-nouveautes-pwa-en-2026" data-wiki-title="Nouveautés PWA en 2026" data-wiki-preview="1. Les PWA 2026 ont **fermé une grande partie de l'écart fonctionnel** avec les apps natives : accès au système de fichiers réel, control de la barre de titre, push sur iOS, biométrie via WebAuthn, USB/Bluetooth, paiement. 2. **File System…">Nouveautés PWA en 2026</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

