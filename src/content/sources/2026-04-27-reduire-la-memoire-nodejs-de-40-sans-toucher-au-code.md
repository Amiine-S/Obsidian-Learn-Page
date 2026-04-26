---
title: Réduire la mémoire Node.js de 40% sans toucher au code
url: >-
  https://medium.com/stackademic/how-i-cut-node-js-memory-usage-by-40-without-touching-the-code-ecbc8083d8a9
author: Stackademic (article original) + synthèse Claude
published: 2026
digested: 2026-04-27T00:00:00.000Z
format: article
domain: backend
level: intermediate
tags:
  - type/source
  - status/done
  - domain/backend
  - format/article
  - level/intermediate
slug: 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
excerpt: >-
  1. **`--max-old-space-size`** : la base. Limiter la heap V8 force le GC à se
  déclencher plus tôt et évite la dérive en prod. 2. **`--optimize-for-size`** :
  bascule l'optimiseur V8 du mode "speed" au mode "memory". Petite perte de
  perf, gros gain mémoire. 3. **Désactiver les sourc
related:
  - max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
  - optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
  - >-
    clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
  - pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone
  - backend-infra
backlinks:
  - max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
  - optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
  - >-
    clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
topics:
  - backend
---
## Pourquoi cette source

> L'article original (paywallé sur Medium / Stackademic) raconte comment l'auteur a réduit l'empreinte mémoire d'un serveur Node de **40%** sans modifier une ligne de code applicatif — uniquement via des **flags V8**, des variables d'env, et une révision de la configuration de runtime. Cette note couvre les techniques canoniques de cette catégorie : ce que tu peux activer **demain matin en prod** sans refactor.

## Résumé en 5 lignes

1. **`--max-old-space-size`** : la base. Limiter la heap V8 force le GC à se déclencher plus tôt et évite la dérive en prod.
2. **`--optimize-for-size`** : bascule l'optimiseur V8 du mode "speed" au mode "memory". Petite perte de perf, gros gain mémoire.
3. **Désactiver les source maps en prod** (`--enable-source-maps=false` ou ne pas builder avec) — les source maps tiennent en mémoire et peuvent peser des dizaines de MB.
4. **Réduire le pool libuv** (`UV_THREADPOOL_SIZE`) — moins de threads = moins de mémoire fixe pour les opérations FS/DNS/crypto bloquantes.
5. **Profile-Guided Heap analysis** — `--inspect`, `clinic.js heapdoctor`, `0x` pour voir **où** la mémoire fuit ou stagne, et appliquer le bon levier (sans toucher au code applicatif quand c'est possible).

---

## 1. La situation typique

Un serveur Node Express/Fastify en prod consomme rarement la mémoire qu'on imagine :

- Heap V8 : objets JS, strings, fonctions
- Buffers natifs : I/O réseau, fichiers
- Code compilé JIT : V8 tient le bytecode + le code optimisé
- Source maps : si activées, peuvent peser 30-100 MB
- Modules require'd jamais déchargés
- Pool libuv : 4 threads par défaut, chacun avec stack

Sur un container Kubernetes avec une limite de **512 MB**, un Node "vide" peut prendre **150-200 MB** au démarrage. Un peu de leak mineur, et tu OOM-kill au bout de 24h.

## 2. `--max-old-space-size`

V8 alloue par défaut une heap qui peut grossir jusqu'à un plafond dépendant de la machine (souvent 1.5 GB sur 64-bit). En containers, ce plafond ne **respecte pas** les limits Kubernetes — V8 ne sait rien du cgroup.

```bash
# Limite la heap à 256 MB
NODE_OPTIONS="--max-old-space-size=256" node server.js
```

Ou via CLI direct :
```bash
node --max-old-space-size=256 server.js
```

Effets :
- Le GC se déclenche **plus agressivement** quand on approche de la limite
- Si dépassement, le process **crash proprement** (`OOM JavaScript heap`) — preferable à un OOM-kill du noyau qui tue salement
- Tu **vois** que tu as un leak (alors que sans limite, ça grossit silencieusement)

**Règle de pouce** : `--max-old-space-size` = 75% de la mémoire allouée au container. Le reste (25%) couvre buffers natifs, libuv, code JIT.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle" data-wiki-title="Concept - --max-old-space-size limite la heap V8 et force un comportement OOM contrôlé" data-wiki-preview="Le flag `--max-old-space-size=N` (en MB) impose à V8 un **plafond pour la old generation** de la heap : au-delà, V8 lance des GC agressifs et finit par crasher le process avec une erreur explicite (`JavaScript heap out of memory`) — ce qui…">Concept - --max-old-space-size limite la heap V8 et force un comportement OOM contrôlé</a>

## 3. `--optimize-for-size`

V8 a deux modes principaux :
- **Speed** (par défaut) : optimise pour la vitesse, peut gonfler le code JIT
- **Size** : optimise pour la mémoire, code JIT plus compact, moins d'inlining

```bash
NODE_OPTIONS="--optimize-for-size" node server.js
```

Gain typique : **10-25% de mémoire** en moins. Coût : **5-15% de CPU** en plus pour les hot paths. Sur un serveur web qui passe son temps en I/O (pas CPU-bound), c'est un trade-off très favorable.

À combiner avec `--max-old-space-size`.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first" data-wiki-title="Concept - --optimize-for-size bascule V8 du JIT speed-first au JIT memory-first" data-wiki-preview="`--optimize-for-size` indique à V8 d'**optimiser le code JIT compilé pour la taille mémoire** plutôt que pour la vitesse — moins d'inlining, moins de spécialisations, code natif plus compact, ce qui réduit l'empreinte heap de **10 à 25%** a…">Concept - --optimize-for-size bascule V8 du JIT speed-first au JIT memory-first</a>

## 4. `--gc-interval` et tuning du GC

V8 a deux générations dans la heap :
- **New generation** (Scavenger) : objets jeunes, GC fréquent et rapide
- **Old generation** (Mark-Sweep-Compact) : objets survivants, GC lent

Flags :
```bash
--max-semi-space-size=64        # taille de la new gen (default 16MB)
--max-old-space-size=256        # taille de la old gen
--gc-interval=100               # force un GC tous les N alloc
--expose-gc                     # exposer global.gc() pour appel manuel
```

Sur un workload avec beaucoup d'objets courts (typique d'API HTTP), augmenter `--max-semi-space-size` **réduit** le nombre de promotions vers la old gen → moins de full GC → moins de pause et moins de mémoire stagnante.

```bash
NODE_OPTIONS="--max-semi-space-size=64 --max-old-space-size=256" node server.js
```

## 5. Désactiver les source maps en prod

Les source maps sont **chargées en mémoire** quand `--enable-source-maps` est actif (souvent par défaut via le builder). Pour un bundle de 5MB, la source map peut peser **20-50MB** chargée.

```bash
NODE_OPTIONS="--enable-source-maps=false" node server.js
```

Ou ne pas les builder du tout pour la prod :
```ts
// tsconfig.production.json
"sourceMap": false
```

Compromis : sans source maps, les stack traces pointent vers le JS compilé. Tu peux les rendre lisibles à la demande via un service comme Sentry (qui upload les source maps **séparément**, pas avec le bundle).

## 6. `UV_THREADPOOL_SIZE`

libuv a un pool de threads pour les opérations bloquantes (fs, dns, crypto, zlib). Par défaut **4 threads**. Chaque thread :
- A sa propre stack (~2 MB)
- Peut maintenir des handles file/socket

Si ton workload **ne fait pas** de gros volume d'I/O sync, tu peux le réduire :
```bash
UV_THREADPOOL_SIZE=2 node server.js
```

Gain : ~4 MB de RAM. Symbolique mais nice. **Attention** : si ton app utilise crypto bcrypt en sync ou compression zlib, baisser le pool peut bloquer les requêtes.

## 7. Compression des modules / tree-shaking au build

Pas un flag runtime mais critique : si ton bundle inclut tout `lodash` au lieu de `lodash/get`, tu charges des MB de code inutile en mémoire.

```bash
# Audit : voir qui prend de la place
npx esbuild-visualizer

# Trim : utiliser des imports précis
import get from 'lodash/get'  # 5kb
# au lieu de
import { get } from 'lodash'  # 80kb
```

## 8. Outils de diagnostic — voir avant d'agir

Avant de tweaker, **mesure**. Sinon tu optimises dans le vide.

### Heap snapshot via `--inspect`

```bash
node --inspect server.js
# Ouvrir chrome://inspect, prendre une heap snapshot, comparer dans le temps
```

Tu vois les objets retenus, identifie les leaks (objets qui devraient être GC mais qui ne le sont pas).

### `clinic.js heapdoctor`

```bash
npx clinic heapdoctor -- node server.js
# Travail typique pendant 30s, puis rapport HTML
```

Te dit en clair : "Tu as une fuite probable sur les objets X, voici la backtrace de leur création".

### `0x` flame graph

```bash
npx 0x server.js
# Génère un flamegraph CPU
```

Pas pour la mémoire directement, mais utile pour identifier les hot paths qui allouent beaucoup.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code" data-wiki-title="Concept - clinic.js et 0x diagnostiquent les leaks et les hot paths Node sans modifier le code" data-wiki-preview="**`clinic.js`** (suite avec `doctor`, `flame`, `bubbleprof`, `heapdoctor`) et **`0x`** sont les deux outils canoniques pour **profiler un process Node existant sans modifier son code** — ils observent depuis l'extérieur, capturent CPU / hea…">Concept - clinic.js et 0x diagnostiquent les leaks et les hot paths Node sans modifier le code</a>

## 9. Bonus — runtimes alternatifs

Si **vraiment** tu veux moins de mémoire et que tu peux changer de runtime :

- **Bun** : plus efficient mémoire que Node sur bench équivalent (~30% de moins)
- **Deno** : équivalent à Node, perf mémoire similaire
- **Workerd** (Cloudflare) : pour edge functions, mémoire ~10× moindre car runtime allégé

Mais c'est plus que "sans toucher au code" — il faut tester la compat.

---

## Tableau récap des leviers

| Levier | Gain typique | Risque |
|---|---|---|
| `--max-old-space-size=256` | Pas direct mais cap | Crash proprement plutôt que de fuir |
| `--optimize-for-size` | -10 à -25% heap | -5 à -15% CPU |
| `--max-semi-space-size=64` | Moins de pauses GC | Légèrement + de heap startup |
| Désactiver source maps | -20 à -50 MB | Stack traces moins lisibles |
| `UV_THREADPOOL_SIZE=2` | -4 MB | I/O sync bloqué si trop bas |
| Tree-shaking strict | -5 à -50 MB selon code | Aucun (juste audit npm) |
| **Total cumulable** | **-30 à -50% RAM** | Faisable en 1 PR de config |

---

## Citations brutes

> *"In production, the cheapest performance gain is the one you get by not running your hot code at all."* — adage commun.

---

## À explorer ensuite

- **`pino` worker thread** : déporter le logging hors de l'event loop pour ne pas y accumuler de buffers. Cf. <a class="wikilink" href="/Obsidian-Learn-Page/concepts/pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone" data-wiki-title="Concept - pino est le logger Node le plus rapide via JSON structuré asynchrone" data-wiki-preview="**pino** est un logger Node optimisé pour la production : il écrit du **JSON structuré** ligne par ligne sur stdout (plutôt que du texte formaté), de façon **asynchrone** via un worker thread, et atteint un débit ~5× supérieur à `console.lo…">Concept - pino est le logger Node le plus rapide via JSON structuré asynchrone</a>
- **PM2 cluster mode** : multi-process au lieu de multi-thread, mais attention chaque worker a sa propre heap (multiplie la RAM)
- **`--use-largepages=on`** : huge pages Linux, peut réduire les TLB misses
- **Node 22 LTS GC improvements** : depuis Node 22, le GC est nettement plus efficace, mettre à jour si tu es sur Node 18
- **Memory profiling continu en prod** : OpenTelemetry + Datadog continuous profiler

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

## Source web

- [How I Cut Node.js Memory Usage by 40% Without Touching the Code — Stackademic (paywall)](https://medium.com/stackademic/how-i-cut-node-js-memory-usage-by-40-without-touching-the-code-ecbc8083d8a9)

