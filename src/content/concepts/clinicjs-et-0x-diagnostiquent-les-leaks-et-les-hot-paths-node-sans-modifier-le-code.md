---
created: 2026-04-27T00:00:00.000Z
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: >-
  Concept - clinic.js et 0x diagnostiquent les leaks et les hot paths Node sans
  modifier le code
slug: >-
  clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
excerpt: >-
  Avant d'optimiser, il faut **mesurer**. Beaucoup d'optimisations mémoire ou
  CPU sont faites "à l'aveugle" : - "On a baissé la heap, ça consomme moins" →
  mais peut-être qu'un module charge encore 50MB de JSON inutile - "On a tweaké
  le GC" → mais peut-être que la fuite est dans un
oneLiner: >-
  **`clinic.js`** (suite avec `doctor`, `flame`, `bubbleprof`, `heapdoctor`) et
  **`0x`** sont les deux outils canoniques pour **profiler un process Node
  existant sans modifier son code** — ils observent depuis l'extérieur,
  capturent CPU / heap / event loop, et produisent des rapports HTML interactifs
  pour identifier la source de lenteurs ou de leaks.
related:
  - max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
  - optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - backend-infra
backlinks:
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
  - optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
topics:
  - backend
---
## Idée en une phrase

> **`clinic.js`** (suite avec `doctor`, `flame`, `bubbleprof`, `heapdoctor`) et **`0x`** sont les deux outils canoniques pour **profiler un process Node existant sans modifier son code** — ils observent depuis l'extérieur, capturent CPU / heap / event loop, et produisent des rapports HTML interactifs pour identifier la source de lenteurs ou de leaks.

## Contexte / pourquoi ça compte

Avant d'optimiser, il faut **mesurer**. Beaucoup d'optimisations mémoire ou CPU sont faites "à l'aveugle" :
- "On a baissé la heap, ça consomme moins" → mais peut-être qu'un module charge encore 50MB de JSON inutile
- "On a tweaké le GC" → mais peut-être que la fuite est dans un cache jamais expiré

Avec `clinic` ou `0x`, tu profiles **avant** et **après** une charge représentative, et tu vois exactement où va la mémoire / le CPU. Pas d'instrumentation à ajouter au code, juste lancer ton serveur via le wrapper.

## Détails / mécanisme

### Suite `clinic.js`

```bash
pnpm add -g clinic
# ou pnpm exec clinic
```

Quatre outils dans la suite :

#### `clinic doctor` — vue d'ensemble

```bash
clinic doctor -- node server.js
# pendant que ça tourne, charge le serveur (autocannon, curl, etc.)
# Ctrl+C pour arrêter, génère un rapport HTML
```

Affiche **simultanément** : CPU usage, heap, event loop delay, active handles. **Diagnostic automatique** : "Tu as un I/O issue", "Tu as un CPU bottleneck", "Ton event loop souffre".

C'est le premier outil à lancer pour savoir **quel autre outil utiliser ensuite**.

#### `clinic flame` — flame graph CPU

```bash
clinic flame -- node server.js
```

Génère un **flame graph** : visualisation des piles d'appels où chaque rectangle a une largeur proportionnelle au temps CPU. Tu vois en un coup d'œil les fonctions qui consomment le plus de CPU.

Utile pour : identifier les fonctions hot, les regex lentes, les calculs inutilement répétés.

#### `clinic bubbleprof` — async ops

```bash
clinic bubbleprof -- node server.js
```

Visualise les **opérations asynchrones** : combien de temps passé à attendre la DB, le réseau, le disque. Bulles concentriques où chaque bulle = une opération async.

Utile pour : trouver les requêtes DB lentes, les await mal optimisés.

#### `clinic heapdoctor` — leak detection

```bash
clinic heapdoctor -- node server.js
```

Capture des **heap snapshots** régulièrement, compare au cours du temps, identifie les objets dont le nombre **croît systématiquement** sans jamais être GC'd → suspects de leak.

Utile pour : leaks mémoire long-lived, identification d'objets retenus.

### `0x` — flame graph CPU léger

```bash
pnpm add -g 0x
0x server.js  # lance et capture jusqu'à Ctrl+C
```

Plus léger que `clinic flame` mais avec une UI plus rugueuse. Génère un flame graph SVG interactif. Idéal en CI ou en sessions courtes.

### Méthode : diagnostiquer un service en prod

Pipeline standard pour un audit :

```bash
# 1. Doctor pour identifier la nature du problème
clinic doctor -- node server.js
# Charge avec autocannon, observe le rapport

# 2. Selon ce que dit doctor :
# Si CPU :
clinic flame -- node server.js
# Si mémoire :
clinic heapdoctor -- node server.js
# Si async / latence :
clinic bubbleprof -- node server.js

# 3. Identifier le coupable, fixer (ou tweaker config), re-profiler
```

### Sans clinic — outils built-in V8

Pour des cas plus rugueux, V8/Node exposent :

```bash
# Heap snapshot via inspector (ouvre Chrome DevTools)
node --inspect server.js
# Aller à chrome://inspect, "Inspect", onglet Memory, "Take heap snapshot"

# Heap profiler V8 from CLI
node --heapsnapshot-near-heap-limit=3 server.js
# Génère un heapdump si on approche de la limite

# CPU profiler
node --prof server.js
# Tourne, Ctrl+C
node --prof-process isolate-*.log > prof.txt
# Texte verbeux, mais zéro dep
```

### Profiling continu en prod

Pour de la prod, les outils ad-hoc ne suffisent pas. Solutions modernes :

- **Datadog Continuous Profiler** : profile en continu un % de tes requêtes
- **Pyroscope** (open-source) : flame graphs continus, déployable soi-même
- **Sentry Profiling** : intégré aux releases, lien crash → profile
- **OpenTelemetry**: standard de telemetry, supporte le profiling depuis 2024

## Exemple concret

Cas réel sur un service Express qui leakait :

**Symptômes** :
- Memory grossit linéairement de 50 MB par jour
- OOM-kill au bout de 6-7 jours
- Restart résout temporairement

**Hypothèses** : "C'est du caching qui n'expire pas", "C'est les sessions Redis", "C'est V8 qui ne libère pas". Sans data, **aucune hypothèse n'est testable**.

**Action** :
```bash
clinic heapdoctor -- node server.js
# Charge avec un script qui simule des requêtes
# Laisse tourner 10 min
# Ctrl+C, ouvre le rapport
```

**Résultat** : le rapport identifie une croissance suspecte sur des objets `EventEmitter` retenus. Stack trace de leur création → un middleware ajoute un listener à un EventEmitter global à chaque requête, sans le retirer.

**Fix** : 1 ligne (`emitter.removeListener` après la requête). 50 MB/jour évités.

Sans `heapdoctor`, ça aurait été des semaines de "essayer des trucs au hasard".

### Démo : flame graph en local

```bash
# Crée un script avec une fonction lente artificielle
cat > slow.js <<EOF
function slow(n) {
  let sum = 0
  for (let i = 0; i < n; i++) sum += Math.sqrt(i)
  return sum
}
function fast(n) { return n * 2 }
function api() {
  setInterval(() => {
    slow(1e7)  // 10 millions
    fast(100)
  }, 100)
}
api()
EOF

0x slow.js
# Laisse tourner 10s, Ctrl+C
# Ouvre le SVG : "slow" prend 99% du temps, "fast" est invisible
```

C'est immédiatement visuel, on voit où optimiser.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle" data-wiki-title="Concept - --max-old-space-size limite la heap V8 et force un comportement OOM contrôlé" data-wiki-preview="Le flag `--max-old-space-size=N` (en MB) impose à V8 un **plafond pour la old generation** de la heap : au-delà, V8 lance des GC agressifs et finit par crasher le process avec une erreur explicite (`JavaScript heap out of memory`) — ce qui…">Concept - --max-old-space-size limite la heap V8 et force un comportement OOM contrôlé</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first" data-wiki-title="Concept - --optimize-for-size bascule V8 du JIT speed-first au JIT memory-first" data-wiki-preview="`--optimize-for-size` indique à V8 d'**optimiser le code JIT compilé pour la taille mémoire** plutôt que pour la vitesse — moins d'inlining, moins de spécialisations, code natif plus compact, ce qui réduit l'empreinte heap de **10 à 25%** a…">Concept - --optimize-for-size bascule V8 du JIT speed-first au JIT memory-first</a>

**Prérequis** :
- Bases de Node + npm/pnpm
- Notion de heap / GC / event loop

**S'oppose à / à comparer avec** :
- **Logging à la main / `console.log` perf timing** : approximatif, ajoute de l'overhead, rate les leaks
- **Datadog APM** : profiling continu en prod, plus complet mais payant et plus intrusif
- **Java VisualVM, Python py-spy** : équivalents pour autres langages

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code" data-wiki-title="Réduire la mémoire Node.js de 40% sans toucher au code" data-wiki-preview="1. **`--max-old-space-size`** : la base. Limiter la heap V8 force le GC à se déclencher plus tôt et évite la dérive en prod. 2. **`--optimize-for-size`** : bascule l'optimiseur V8 du mode &quot;speed&quot; au mode &quot;memory&quot;. Petite perte de perf, gros…">Réduire la mémoire Node.js de 40% sans toucher au code</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

