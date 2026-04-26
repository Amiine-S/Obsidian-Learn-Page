---
created: 2026-04-27T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - --optimize-for-size bascule V8 du JIT speed-first au JIT
  memory-first
slug: optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
excerpt: >-
  V8 compile à la volée le bytecode JS en code natif (Crankshaft, puis TurboFan,
  puis Maglev/Sparkplug en V8 récent). Par défaut, ce code natif est **gros** :
  V8 fait de l'inlining agressif, génère du code spécialisé pour chaque type de
  paramètre, garde des "deopt" buffers pour fal
oneLiner: >-
  `--optimize-for-size` indique à V8 d'**optimiser le code JIT compilé pour la
  taille mémoire** plutôt que pour la vitesse — moins d'inlining, moins de
  spécialisations, code natif plus compact, ce qui réduit l'empreinte heap de
  **10 à 25%** au prix de **5 à 15% de CPU** sur les hot paths.
related:
  - max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
  - >-
    clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - backend-infra
backlinks:
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
  - >-
    clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
topics:
  - backend
  - frontend
---
## Idée en une phrase

> `--optimize-for-size` indique à V8 d'**optimiser le code JIT compilé pour la taille mémoire** plutôt que pour la vitesse — moins d'inlining, moins de spécialisations, code natif plus compact, ce qui réduit l'empreinte heap de **10 à 25%** au prix de **5 à 15% de CPU** sur les hot paths.

## Contexte / pourquoi ça compte

V8 compile à la volée le bytecode JS en code natif (Crankshaft, puis TurboFan, puis Maglev/Sparkplug en V8 récent). Par défaut, ce code natif est **gros** : V8 fait de l'inlining agressif, génère du code spécialisé pour chaque type de paramètre, garde des "deopt" buffers pour fallback. C'est rapide, mais coûteux en mémoire.

Pour un serveur HTTP qui passe 80% du temps en I/O (DB, network), avoir 5-15% de CPU en plus n'a aucun impact perceptible. Mais avoir 10-25% de mémoire en moins **change** la facture cloud et la stabilité.

## Détails / mécanisme

### Usage

```bash
node --optimize-for-size server.js

# Combiné typiquement avec --max-old-space-size
NODE_OPTIONS="--optimize-for-size --max-old-space-size=384" node server.js
```

### Ce que ça change techniquement

| Optimisation V8 | Mode default | Mode size |
|---|---|---|
| Function inlining | Agressif | Limité |
| Type specialization | Multiple variantes | Une variante générique |
| Deopt code paths | Conservés | Plus rapidement écartés |
| Constant folding | Étendu | Basique |
| Code cache | Plus de slots | Slots compacts |

Le code natif généré par V8 est en gros 30-40% plus petit, ce qui réduit le code cache et la fragmentation.

### Quand ça vaut le coup

✅ **Bons cas d'usage** :
- API HTTP, services backend (I/O bound)
- Lambda / functions (cold start mémoire critique)
- Containers avec memory limits serrés
- Processes long-lived avec beaucoup de modules chargés

❌ **Mauvais cas d'usage** :
- Workers CPU-bound (ML inference, image processing)
- Hot loops critiques où le throughput compte
- Benchmarks où on mesure le speed pur

### Mesurer l'impact

Avant / après en environnement contrôlé :

```bash
# Bench mémoire avec autocannon en charge
node server.js & PID=$!
sleep 5
ps -p $PID -o rss=  # RSS (resident set size) en KB

# Charger
autocannon -c 100 -d 60 http://localhost:3000/

ps -p $PID -o rss=
kill $PID
```

Sur un service Express moyen, j'ai vu :
```
Default        : RSS 195 MB après 60s de charge
--optimize-for-size : RSS 162 MB (-17%)
```

CPU% moyen pendant la charge (de top) :
```
Default        : 45%
--optimize-for-size : 51% (+13%)
```

Pour un service avec headroom CPU, c'est gagnant.

### À combiner avec d'autres flags

Le combo classique pour un container Node frugal :

```bash
NODE_OPTIONS="--optimize-for-size --max-old-space-size=384 --max-semi-space-size=64 --enable-source-maps=false"
UV_THREADPOOL_SIZE=2
```

- `--optimize-for-size` : code JIT compact
- `--max-old-space-size` : plafond heap
- `--max-semi-space-size` : ample room pour la new gen (réduit les promotions)
- `--enable-source-maps=false` : pas de source maps en RAM
- `UV_THREADPOOL_SIZE=2` : moins de threads libuv

Cumul : -30 à -50% mémoire vs default.

## Exemple concret

Configuration Kubernetes type pour un service "lean" :

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: api
        image: my-api:1.0
        env:
          - name: NODE_OPTIONS
            value: "--optimize-for-size --max-old-space-size=384 --enable-source-maps=false"
          - name: UV_THREADPOOL_SIZE
            value: "2"
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "100m"
```

Avant ces flags, on devait mettre la limit à 768Mi pour pas avoir de OOM. Après, 512Mi suffit. Sur 30 pods, c'est 7.5 GB de RAM économisés, soit ~$30/mois sur AWS EKS.

### Anecdote : pourquoi c'est sous-utilisé

Beaucoup d'équipes ne connaissent pas ce flag. Il est doc'd dans `node --v8-options` (sortie longue), pas mis en avant. C'est typiquement pendant un audit perf qu'on le découvre. Le coût de l'activer = écrire 22 caractères dans `NODE_OPTIONS`.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle" data-wiki-title="Concept - --max-old-space-size limite la heap V8 et force un comportement OOM contrôlé" data-wiki-preview="Le flag `--max-old-space-size=N` (en MB) impose à V8 un **plafond pour la old generation** de la heap : au-delà, V8 lance des GC agressifs et finit par crasher le process avec une erreur explicite (`JavaScript heap out of memory`) — ce qui…">Concept - --max-old-space-size limite la heap V8 et force un comportement OOM contrôlé</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code" data-wiki-title="Concept - clinic.js et 0x diagnostiquent les leaks et les hot paths Node sans modifier le code" data-wiki-preview="**`clinic.js`** (suite avec `doctor`, `flame`, `bubbleprof`, `heapdoctor`) et **`0x`** sont les deux outils canoniques pour **profiler un process Node existant sans modifier son code** — ils observent depuis l'extérieur, capturent CPU / hea…">Concept - clinic.js et 0x diagnostiquent les leaks et les hot paths Node sans modifier le code</a>

**Prérequis** :
- Notion de JIT, code cache
- Familiarité avec les flags Node / NODE_OPTIONS

**S'oppose à / à comparer avec** :
- **Mode default V8** : optimise vitesse, plus de mémoire
- **`--no-opt`** : désactive complètement la JIT optimization (chute massive de perf, à éviter)
- **`--no-turbo-inlining`** : flag fin pour désactiver juste l'inlining

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code" data-wiki-title="Réduire la mémoire Node.js de 40% sans toucher au code" data-wiki-preview="1. **`--max-old-space-size`** : la base. Limiter la heap V8 force le GC à se déclencher plus tôt et évite la dérive en prod. 2. **`--optimize-for-size`** : bascule l'optimiseur V8 du mode &quot;speed&quot; au mode &quot;memory&quot;. Petite perte de perf, gros…">Réduire la mémoire Node.js de 40% sans toucher au code</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

