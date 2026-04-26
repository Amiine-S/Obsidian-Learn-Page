---
created: 2026-04-27T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - --max-old-space-size limite la heap V8 et force un comportement OOM
  contrôlé
slug: max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
excerpt: >-
  Par défaut, V8 alloue jusqu'à ~1.5 GB sur une machine 64-bit, peu importe la
  mémoire disponible. **V8 ne lit pas les cgroups** : si tu as un container
  Kubernetes limit à 512 MB, V8 va quand même essayer d'allouer 1.5 GB, et ce
  sera le noyau qui tuera le process — sans message JS,
oneLiner: >-
  Le flag `--max-old-space-size=N` (en MB) impose à V8 un **plafond pour la old
  generation** de la heap : au-delà, V8 lance des GC agressifs et finit par
  crasher le process avec une erreur explicite (`JavaScript heap out of memory`)
  — ce qui est **préférable** à un OOM-kill du noyau qui terminerait le process
  sans message en container.
related:
  - optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
  - >-
    clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - backend-infra
backlinks:
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
  - >-
    clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
topics:
  - backend
  - frontend
---
## Idée en une phrase

> Le flag `--max-old-space-size=N` (en MB) impose à V8 un **plafond pour la old generation** de la heap : au-delà, V8 lance des GC agressifs et finit par crasher le process avec une erreur explicite (`JavaScript heap out of memory`) — ce qui est **préférable** à un OOM-kill du noyau qui terminerait le process sans message en container.

## Contexte / pourquoi ça compte

Par défaut, V8 alloue jusqu'à ~1.5 GB sur une machine 64-bit, peu importe la mémoire disponible. **V8 ne lit pas les cgroups** : si tu as un container Kubernetes limit à 512 MB, V8 va quand même essayer d'allouer 1.5 GB, et ce sera le noyau qui tuera le process — sans message JS, sans stack trace, juste un `Killed` sec dans les logs.

`--max-old-space-size` règle ce problème en alignant V8 sur la réalité du container.

## Détails / mécanisme

### La heap V8 en deux générations

V8 sépare ses objets :
- **New generation** (Scavenger, semi-space) : objets fraîchement alloués, GC très rapide
- **Old generation** (Mark-Sweep-Compact) : objets survivants après quelques GCs jeunes, GC plus lent mais plus rare

`--max-old-space-size` contrôle la **vieille génération**. C'est là que vit le gros de la mémoire applicative en steady state (caches, structures persistantes, modules chargés).

### Usage

```bash
# Limite à 256 MB (chiffre en MB)
node --max-old-space-size=256 server.js

# Via env var (utile en Docker / Kubernetes)
NODE_OPTIONS="--max-old-space-size=256" node server.js
```

```dockerfile
# Dockerfile
ENV NODE_OPTIONS="--max-old-space-size=256"
CMD ["node", "server.js"]
```

```yaml
# Kubernetes deployment
env:
  - name: NODE_OPTIONS
    value: "--max-old-space-size=256"
resources:
  limits:
    memory: "384Mi"
```

### Règle de pouce

Si ton container a une **memory limit** de N MB, mets `--max-old-space-size` à **~75% de N** :

| Container limit | --max-old-space-size |
|---|---|
| 256 MB | 192 |
| 512 MB | 384 |
| 1 GB (1024 MB) | 768 |
| 2 GB | 1536 |

Le reste (25%) couvre :
- Buffers natifs (réseau, FS)
- Stack des threads libuv (~2 MB chacun, default 4 threads)
- Code JIT compilé par V8
- Mémoire du runtime Node (modules chargés non-JS)

### Comportement à la limite

Quand la heap approche du plafond :

1. **GC majeur déclenché** plus fréquemment → tente de libérer
2. Si pas suffisant, **GC intensif** → bloque le process plusieurs centaines de ms
3. Si toujours pas suffisant, **process crash** :
   ```
   FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
   ```

Avec un message explicite + stack trace, contrairement à un OOM-kill silencieux.

### Conséquence pour les leaks

Sans `--max-old-space-size`, un leak progressif fait grossir la heap jusqu'au limite container → kill cgroup → tu perds le contexte.

Avec `--max-old-space-size`, le leak est **borné** et le crash se produit à un point prévisible. Tu vois plus vite que tu as un problème.

### Effet annexe : meilleure latence

Une heap **plus petite** = des GC majeurs plus **rapides** (proportionnel à la taille de la heap). Sur un service avec SLO de latence p99, un plafond agressif peut réduire les pauses GC longues.

## Exemple concret

Avant la mise en place sur un service Express en prod :

```
Container limit: 512 MB
Memory usage moyenne: 380 MB
Memory usage pic: 720 MB → OOM-kill
Crash rate: 2-3 par jour
```

Logs Kubernetes :
```
Pod: api-server-7d8f9b
Container: api
Reason: OOMKilled
Exit code: 137
```

Pas de stack trace, pas d'info sur quoi a fait grossir.

Après `--max-old-space-size=384` (75% de 512) :

```
Memory usage moyenne: 320 MB (légèrement plus bas, GC plus actif)
Memory usage pic: 415 MB
Crashes: 0 par semaine
Quand un test charge en mode stress: stack trace claire pointant le code en cause
```

Plus de OOM-kill silencieux. Quand la mémoire dérapait, le service crashait avec un message JS et redémarrait.

### Tuning fin

Pour un service très optimisé :

```bash
NODE_OPTIONS="--max-old-space-size=384 --max-semi-space-size=64 --optimize-for-size"
```

- old space : 384 MB (heap durable)
- semi-space : 64 MB (objets jeunes, plus de room pour éviter les promotions)
- optimize-for-size : mode JIT plus compact

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first" data-wiki-title="Concept - --optimize-for-size bascule V8 du JIT speed-first au JIT memory-first" data-wiki-preview="`--optimize-for-size` indique à V8 d'**optimiser le code JIT compilé pour la taille mémoire** plutôt que pour la vitesse — moins d'inlining, moins de spécialisations, code natif plus compact, ce qui réduit l'empreinte heap de **10 à 25%** a…">Concept - --optimize-for-size bascule V8 du JIT speed-first au JIT memory-first</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code" data-wiki-title="Concept - clinic.js et 0x diagnostiquent les leaks et les hot paths Node sans modifier le code" data-wiki-preview="**`clinic.js`** (suite avec `doctor`, `flame`, `bubbleprof`, `heapdoctor`) et **`0x`** sont les deux outils canoniques pour **profiler un process Node existant sans modifier son code** — ils observent depuis l'extérieur, capturent CPU / hea…">Concept - clinic.js et 0x diagnostiquent les leaks et les hot paths Node sans modifier le code</a>

**Prérequis** :
- Notion de heap, GC
- Containers / Kubernetes resources

**S'oppose à / à comparer avec** :
- **Pas de limite (default)** : V8 grossit jusqu'à ~1.5 GB, OOM-kill silencieux du cgroup
- **Limite trop serrée** : crashes constants même en idle
- **Limite trop large** : équivalent à pas de limite

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code" data-wiki-title="Réduire la mémoire Node.js de 40% sans toucher au code" data-wiki-preview="1. **`--max-old-space-size`** : la base. Limiter la heap V8 force le GC à se déclencher plus tôt et évite la dérive en prod. 2. **`--optimize-for-size`** : bascule l'optimiseur V8 du mode &quot;speed&quot; au mode &quot;memory&quot;. Petite perte de perf, gros…">Réduire la mémoire Node.js de 40% sans toucher au code</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

