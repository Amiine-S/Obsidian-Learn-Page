---
title: Nouveautés PWA en 2026
url: 'https://progressier.com/pwa-capabilities'
author: synthèse Claude (sources web)
digested: 2026-04-26T00:00:00.000Z
format: doc
domain: frontend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/frontend
  - format/doc
  - level/intermediate
slug: 2026-04-26-nouveautes-pwa-en-2026
excerpt: >-
  1. Les PWA 2026 ont **fermé une grande partie de l'écart fonctionnel** avec
  les apps natives : accès au système de fichiers réel, control de la barre de
  titre, push sur iOS, biométrie via WebAuthn, USB/Bluetooth, paiement. 2.
  **File System Access API** : tu peux ouvrir, modifier
related:
  - les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives
  - file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux
  - >-
    window-controls-overlay-donne-aux-pwa-desktop-le-controle-de-la-barre-de-titre
  - frontend
backlinks:
  - file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux
  - les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives
  - >-
    window-controls-overlay-donne-aux-pwa-desktop-le-controle-de-la-barre-de-titre
topics:
  - backend
  - devops
  - effect-ts
  - frontend
  - mobile
  - typescript
---

# Nouveautés PWA en 2026

## Pourquoi cette source

> Faire le point sur **où en sont les PWA en 2026**. Beaucoup ont été déçus par les PWA en 2018-2020 (limitations iOS, install awkward, capacités limitées). En 2026, **le tableau a beaucoup changé** : File System Access API stable, Window Controls Overlay, Web Push sur iOS, biometric auth, et un usage en hausse côté entreprise et terrain.

## Résumé en 5 lignes

1. Les PWA 2026 ont **fermé une grande partie de l'écart fonctionnel** avec les apps natives : accès au système de fichiers réel, control de la barre de titre, push sur iOS, biométrie via WebAuthn, USB/Bluetooth, paiement.
2. **File System Access API** : tu peux ouvrir, modifier et sauvegarder de vrais fichiers locaux (drag & drop, métadonnées, file handlers). Plus seulement un blob temporaire.
3. **Window Controls Overlay** : pour les PWA installées en desktop, tu reprends la barre de titre — comme une vraie app native (déjà visible sur Microsoft Edge, Twitter PWA, etc.).
4. **iOS rattrape** (mais lentement) : Web Push depuis iOS 16.4 (2023), Apple Pay JS, et amélioration du support PWA dans Safari (toujours en retard sur Chrome côté FS, USB, Bluetooth).
5. **Cas d'usage qui décollent en 2026** : workforce mobile (logistique, santé, retail), apps internes B2B, alternatives aux app stores. Les PWA grand public consumer restent moins fréquentes — c'est le territoire B2B et internal tools.

---

## 1. Pourquoi le retour des PWA

Les arguments restent les mêmes qu'en 2018, mais **les blocages techniques** ont reculé :

| | 2018 | 2026 |
|---|---|---|
| File system | ❌ blob/IndexedDB | ✅ File System Access API |
| Push notifications | ⚠️ Android only | ✅ iOS 16.4+ aussi |
| Barre de titre | ❌ | ✅ Window Controls Overlay |
| USB/Bluetooth/Serial | ❌ | ✅ (Chromium) |
| Auth biométrique | ⚠️ partiel | ✅ WebAuthn passkeys |
| Installation desktop | ⚠️ | ✅ standardisée Win/Mac/Linux |
| Background sync | ⚠️ basique | ✅ Periodic Background Sync |
| Paiement natif | ❌ | ✅ Web Payments + Payment Handler |

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-pwa-2026-ferment-l-ecart-fonctionnel-avec-les-apps-natives" data-wiki-title="Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives" data-wiki-preview="En 2026, l'**écart de capacités** entre PWA et apps natives s'est massivement réduit grâce aux APIs nouvelles ou stabilisées (File System Access, Window Controls Overlay, Web Push iOS, WebAuthn, USB/Bluetooth/Serial, Web Payment) — au point…">Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives</a>

---

## 2. File System Access API — le game changer

C'est probablement le plus gros saut depuis 2020. Avant : ton "PWA d'édition" devait tout stocker dans IndexedDB (sandbox), exporter/importer via download/upload. Maintenant :

```typescript
// Ouvrir un fichier local
const [handle] = await window.showOpenFilePicker({
  types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }]
})
const file = await handle.getFile()
const text = await file.text()

// Le modifier et SAUVER À LA MÊME PLACE
const writable = await handle.createWritable()
await writable.write(text + "\n\nadded")
await writable.close()

// Ou demander un dossier entier (avec récursion)
const dirHandle = await window.showDirectoryPicker()
for await (const [name, h] of dirHandle.entries()) {
  console.log(name, h.kind) // "file" | "directory"
}
```

Use cases qui se débloquent :
- **Éditeurs locaux** (Markdown, code, design) — VS Code Web l'utilise, Photopea, etc.
- **Apps de traitement de fichiers** (compression, conversion, signature)
- **Outils workforce** : caméras qui sauvent en local, exports de feuilles de tournée

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/file-system-access-api-donne-aux-pwa-un-vrai-acces-aux-fichiers-locaux" data-wiki-title="Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux" data-wiki-preview="La **File System Access API** permet à une page web (et donc à une PWA) d'**ouvrir, lire, modifier et sauvegarder** des fichiers sur le système de fichiers réel de l'utilisateur — et non plus seulement de blobs sandboxés — moyennant **une p…">Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux</a>

**Limites actuelles** :
- Chromium seulement (Safari et Firefox derrière, FS limité aux origines privées sur Firefox)
- `showOpenFilePicker` nécessite un user gesture
- Sécurité : l'utilisateur reconfirme à chaque session pour la lecture
- Pas tout-puissant : `\Windows\System32` reste interdit, et l'utilisateur peut refuser

### File Handling — l'app qui ouvre les fichiers

```json
// manifest.json
"file_handlers": [
  { "action": "/open", "accept": { "text/markdown": [".md"] } }
]
```

L'OS sait que **ton app peut ouvrir les .md**. Double-clic dans Finder/Explorer → ton app PWA s'ouvre avec le fichier passé en handle.

```typescript
// dans ton app
window.launchQueue.setConsumer(async (launchParams) => {
  const handle = launchParams.files[0]
  const file = await handle.getFile()
  // ouvrir le contenu
})
```

C'est l'équivalent fonctionnel de "Open With Photoshop" — mais pour le web.

---

## 3. Window Controls Overlay (WCO)

Un détail visuel qui change l'UX : sur une PWA installée desktop, normalement tu as une barre de titre OS qui te bouffe ~30px en haut. Avec WCO, tu **récupères cet espace** et tu y dessines ton propre header.

```json
// manifest.json
"display_override": ["window-controls-overlay", "standalone"]
```

```css
/* CSS */
.title-bar {
  position: fixed;
  top: 0;
  left: env(titlebar-area-x);
  width: env(titlebar-area-width);
  height: env(titlebar-area-height);
  -webkit-app-region: drag; /* draggable comme un titlebar natif */
}
```

```typescript
// JS : tu peux savoir si WCO est actif
if (navigator.windowControlsOverlay?.visible) {
  // afficher le titlebar custom
}
navigator.windowControlsOverlay.addEventListener("geometrychange", ...)
```

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/window-controls-overlay-donne-aux-pwa-desktop-le-controle-de-la-barre-de-titre" data-wiki-title="Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la barre de titre" data-wiki-preview="**Window Controls Overlay (WCO)** est une feature PWA qui permet à l'app installée en desktop de **dessiner ses propres éléments dans la zone de la barre de titre** — l'OS conserve uniquement les contrôles de fenêtre (min/max/close), tout l…">Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la barre de titre</a>

**Apps qui l'utilisent** : Microsoft Edge (lui-même PWA pour certains modes), Twitter/X PWA, Outlook web, plein de B2B internes.

**Limites** :
- Chromium / Edge / Safari Tech Preview ; pas Firefox encore
- Désactivé si l'utilisateur le refuse au moment de l'install

---

## 4. iOS rattrape (péniblement)

Le caillou historique : Safari/iOS bloquait beaucoup de fonctionnalités PWA. En 2026 :

| API | iOS support 2026 |
|---|---|
| Add to Home Screen | ✅ depuis toujours |
| Standalone display | ✅ |
| Service Worker | ✅ |
| Web Push | ✅ depuis iOS 16.4 (2023) — **enfin** |
| Notifications + Badging | ✅ partiel |
| File System Access | ⚠️ partiel (download/upload OK, FS Access API ❌) |
| Window Controls Overlay | ⚠️ Tech Preview |
| WebAuthn + Passkeys | ✅ depuis iOS 16 |
| Apple Pay JS | ✅ |
| WebUSB / WebBluetooth | ❌ |
| Background Sync | ⚠️ partiel |

**Conclusion pratique** : si ton app cible **uniquement Chrome / Edge / Android**, tu peux faire à peu près tout ce qu'une app native fait. Si tu cibles **iOS aussi**, tu fais avec ce qui passe (push, notifications, install, auth).

---

## 5. Stack typique d'une PWA 2026

| Couche | Outil |
|---|---|
| Build | Vite + `vite-plugin-pwa` (gère le manifest et le service worker) |
| Service Worker | **Workbox** (par Google), routing offline + cache |
| Storage | IndexedDB via `idb` ou `dexie.js`, ou OPFS (Origin Private File System) pour les gros volumes |
| State | Selon framework (Zustand, signals, Effect Atom) |
| Push backend | Web Push via VAPID, Firebase Cloud Messaging optionnel |
| Auth | WebAuthn / passkeys directement, ou OAuth + biométrie |

### Service Worker minimal avec Workbox

```typescript
// sw.ts
import { precacheAndRoute } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { CacheFirst, NetworkFirst } from "workbox-strategies"

precacheAndRoute(self.__WB_MANIFEST) // assets buildés

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: "api", networkTimeoutSeconds: 3 })
)

registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({ cacheName: "images" })
)
```

Workbox abstrait les caches, les stratégies, le précaching, l'invalidation. Quasiment standard de fait.

---

## 6. Quand choisir une PWA en 2026

### ✅ Bons cas

- **Outil interne B2B** : utilisateurs sur Chrome/Edge, pas besoin de l'App Store
- **App workforce** (logistique, terrain, retail) : offline-first, install via QR code, MDM friendly
- **Outil productivité** (éditeur, dashboard, viewer) : surtout desktop installé
- **Alternative économique aux apps natives** (équipe petite, budget contraint)
- **Apps "compagnon" web** quand tu veux que l'expérience installée soit améliorée mais pas réinventée

### ❌ Mauvais cas

- **App grand public consumer mobile** : les utilisateurs vont à l'App Store, pas sur ton site
- **Capabilities heavy bas niveau iOS** (USB, Bluetooth, FS) : iOS bloque
- **Performance native critique** (jeux 3D, vidéo lourde) : possible, mais difficile
- **Découvrabilité essentielle** (App Store SEO) : la PWA n'est pas dans le store

---

## 7. Le futur proche (2026-2027)

À surveiller :
- **WebGPU** stable partout : enable jeux/3D/IA locale
- **Local LLMs in browser** : `chrome.ai`, MediaPipe LLM Inference — relancer l'argument PWA "intelligent"
- **Background Periodic Sync** étendu (sync data quand le user n'est pas dans l'app)
- **Standardisation iOS** sur certaines APIs (FS, WebUSB ?) — pression communautaire forte
- **Origin trials → stable** : Compute Pressure, EyeDropper, Local Font Access

---

## Citations brutes

> *"Modern browser engines now provide deep hardware integration that allows web-based applications to access file systems, biometric authentication, and local processing power via WebAssembly with near-native efficiency."* — synthèse 2026.

---

## À explorer ensuite

- **OPFS (Origin Private File System)** : stockage sandboxé performant, complément à FS Access
- **Push API + Notification Triggers** : déclenchements offline (ex : alerte basée sur géoloc)
- **Web Bluetooth + USB + Serial** pour des cas embedded/IoT
- **Trusted Web Activity** : embarquer une PWA dans une app Android (alternative à React Native pour Android)
- **Bouncer / Capacitor** : si jamais tu dois quand même publier sur l'App Store, l'enrobage natif léger d'une PWA
- **`vite-plugin-pwa`** : la lib Vite la plus utilisée pour démarrer

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/frontend" data-wiki-title="MOC - Frontend" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Frontend</a>

## Sources web

- [PWA Capabilities in 2026 — progressier.com](https://progressier.com/pwa-capabilities)
- [What PWA Can Do Today — whatpwacando.today](https://whatpwacando.today/)
- [Window Controls Overlay API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API)
- [Window Controls Overlay — web.dev](https://web.dev/articles/window-controls-overlay)
- [Handle files in a PWA — learn.microsoft.com](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/how-to/handle-files)
- [Why PWAs Dominate the 2026 Digital Strategy — medium](https://medium.com/codetodeploy/why-pwas-dominate-the-2026-digital-strategy-e0c2c4f740c9)

