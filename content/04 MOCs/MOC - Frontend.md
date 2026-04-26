---
domain: frontend
tags:
  - type/moc
  - domain/frontend
---

# MOC - Frontend

## Vue d'ensemble

> Frameworks JS/TS modernes, rendering, perfs, design systems, UX.

## Concepts clés

### Fondamentaux JS/TS
- [[Concept - Une closure capture son environnement lexical à la création]]
- [[Concept - Un thunk est une fonction qui retarde l'évaluation]]

### Écosystème TS — Effect-TS
- [[Concept - Le type Effect rend les dépendances et erreurs explicites dans la signature]]
- [[Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées]]

### State management React — Effect Atom
- [[Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect]]
- [[Concept - Atom.runtime branche les Layers Effect-TS dans le state management React]]
- [[Concept - Les atoms d'Effect Atom se libèrent automatiquement avec keepAlive comme opt-out]]

### Tooling moderne (Rust/Go)
- [[Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf]]
- [[Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse]]
- [[Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse]]

### Réactivité fine-grained / signals (SolidJS)
- [[Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux]]
- [[Concept - La réactivité fine-grained met à jour seulement le DOM affecté]]
- [[Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS]]
- [[Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI]]

### JavaScript en profondeur
- [[Concept - L'event loop traite les microtasks avant chaque rendu et entre macrotasks]]
- [[Concept - this en JavaScript dépend du site d'appel pas de la définition]]
- [[Concept - Le hoisting déplace les déclarations en haut du scope mais pas leurs valeurs]]
- [[Concept - Les coercitions implicites de JavaScript suivent des règles précises mais piégeuses]]
- [[Concept - La chaîne de prototypes structure l'héritage en JavaScript]]

### PWA (Progressive Web Apps)
- [[Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives]]
- [[Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux]]
- [[Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la barre de titre]]

## Sous-domaines à explorer

### Frameworks (React, Vue, Svelte, Solid…)
- [[Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux]]
- [[Concept - Signals contre Virtual DOM deux modèles opposés de mise à jour UI]]

### Rendering (SSR, RSC, streaming, hydration)
- *(à venir)*

### State management
- [[Concept - Effect Atom unifie state client serveur et DI dans des atomes basés sur Effect]]
- [[Concept - Atom.runtime branche les Layers Effect-TS dans le state management React]]
- [[Concept - Signal Memo Effect sont les trois primitives réactives de SolidJS]]

### CSS & design systems
- *(à venir)*

### Performance (Core Web Vitals, bundling)
- [[Concept - La réactivité fine-grained met à jour seulement le DOM affecté]]

### Tooling (Vite, esbuild, Turbopack, oxc, Biome)
- [[Concept - L'écosystème JS migre vers des outils en Rust et Go pour la perf]]
- [[Concept - tsgo est le portage Go de TypeScript par Microsoft pour 10x la vitesse]]
- [[Concept - oxlint et oxfmt portent ESLint et Prettier en Rust pour 50-100x la vitesse]]

## Sources de référence

- [web.dev](https://web.dev/)
- [Josh W. Comeau](https://www.joshwcomeau.com/)
- [Lee Robinson](https://leerob.io/blog)
- [Kent C. Dodds](https://kentcdodds.com/blog)

## Questions ouvertes

- React Compiler vs signals : qui gagne sur le long terme ?
- Quand SolidJS justifie-t-il vraiment d'être adopté en prod (cas concrets) ?
- iOS rattrapera-t-il vraiment Chrome sur les APIs PWA bas-niveau ?
- Records & Tuples + Pattern matching : adoptés en pratique d'ici 2027 ?
