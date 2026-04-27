---
created: '2026-04-26T22:00:18.221Z'
domain: backend
level: intermediate
tags:
  - type/concept
  - domain/backend
  - level/intermediate
title: Concept - pino est le logger Node le plus rapide via JSON structuré asynchrone
slug: pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone
excerpt: >-
  En production, tu ne lis plus tes logs au terminal : ils partent dans Datadog,
  Loki, CloudWatch, Splunk, Elastic… Ces backends ont besoin de **JSON
  structuré** pour parser, filtrer, agréger. Du texte plat (`[INFO] User abc
  logged in`) demande des regex fragiles côté ingest.
oneLiner: >-
  **pino** est un logger Node optimisé pour la production : il écrit du **JSON
  structuré** ligne par ligne sur stdout (plutôt que du texte formaté), de façon
  **asynchrone** via un worker thread, et atteint un débit ~5× supérieur à
  `console.log` et ~3× supérieur à `winston` — il est devenu le standard pour
  les apps backend qui logent à grande échelle.
related:
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - backend-infra
backlinks:
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - >-
    consola-remplace-console-log-par-un-logger-dev-friendly-avec-niveaux-et-icones
topics:
  - backend
---
## Idée en une phrase

> **pino** est un logger Node optimisé pour la production : il écrit du **JSON structuré** ligne par ligne sur stdout (plutôt que du texte formaté), de façon **asynchrone** via un worker thread, et atteint un débit ~5× supérieur à `console.log` et ~3× supérieur à `winston` — il est devenu le standard pour les apps backend qui logent à grande échelle.

## Contexte / pourquoi ça compte

En production, tu ne lis plus tes logs au terminal : ils partent dans Datadog, Loki, CloudWatch, Splunk, Elastic… Ces backends ont besoin de **JSON structuré** pour parser, filtrer, agréger. Du texte plat (`[INFO] User abc logged in`) demande des regex fragiles côté ingest.

`pino` produit nativement :
```json
{"level":30,"time":1714138472384,"msg":"User logged in","userId":"abc","requestId":"req-123","pid":12345,"hostname":"web-01"}
```

Une ligne par log, parseable directement. Plus l'aspect critique en prod : **c'est rapide**. Logger ne doit jamais être le goulot.

## Détails / mécanisme

### Setup

```bash
pnpm add pino
pnpm add -D pino-pretty  # pour le dev
```

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // En dev, on veut du joli ; en prod, du JSON brut.
  transport: process.env.NODE_ENV === 'production'
    ? undefined // JSON brut sur stdout
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
})

logger.info('Hello')
logger.info({ userId: 'abc', action: 'login' }, 'User logged in')
logger.error({ err, requestId: req.id }, 'Failed to process request')
```

Output JSON brut :
```json
{"level":30,"time":1714138472384,"msg":"Hello","pid":12345,"hostname":"web-01"}
{"level":30,"time":1714138472385,"userId":"abc","action":"login","msg":"User logged in"}
{"level":50,"time":1714138472386,"err":{"type":"Error","message":"...","stack":"..."},"requestId":"req-123","msg":"Failed"}
```

Output pretty (dev) :
```
[14:54:32] INFO: Hello
[14:54:32] INFO (userId="abc" action="login"): User logged in
[14:54:32] ERROR (requestId="req-123"): Failed
    err: Error: ...
```

### Niveaux

| Numérique | Méthode | Usage |
|---|---|---|
| 10 | `trace` | Très verbeux, tout |
| 20 | `debug` | Détails de logique |
| 30 | `info` | Évènements normaux (défaut) |
| 40 | `warn` | Anomalies |
| 50 | `error` | Erreurs gérées |
| 60 | `fatal` | Crash imminent |

```typescript
const logger = pino({ level: 'info' }) // ignore trace + debug
```

### Child loggers — contexte par requête

```typescript
// Express middleware
app.use((req, res, next) => {
  req.log = logger.child({ requestId: req.id, userId: req.user?.id })
  next()
})

app.get('/users/:id', async (req, res) => {
  req.log.info({ params: req.params }, 'Fetching user')
  // → JSON inclut automatiquement requestId et userId
})
```

C'est plus efficace que de passer le contexte à chaque appel : les child loggers **mergent** les bindings sans rebuild de l'objet à chaque log.

### Sérialisation custom

```typescript
const logger = pino({
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req, // strip headers sensibles, etc.
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.body.password'],
    censor: '[REDACTED]',
  },
})
```

Le `redact` est critique en prod — ne JAMAIS logger les passwords ou tokens.

### Transport en prod

`pino` écrit sur `stdout`. La rotation, l'archivage, l'expédition est délégué :
- **Docker / Kubernetes** : stdout est récupéré par le container engine, envoyé à fluentd / promtail / vector
- **PM2** : `pm2 logrotate` pour la rotation
- **Pipe vers un service** : `node app.js | pino-elasticsearch`, `node app.js | pino-loki`

### Performance

Bench standard sur 100k logs (Node 22) :

| Logger | Temps | Logs/sec |
|---|---|---|
| `console.log` | 720 ms | 139k |
| `winston` | 1100 ms | 91k |
| `bunyan` | 850 ms | 118k |
| **`pino`** | **210 ms** | **476k** |

Pourquoi pino est si rapide :
- **Évite le format string** : sérialise directement en JSON via un fast-path
- **Asynchrone** : écrit sur un buffer, flush périodique (mode `extreme` même)
- **Pas de couleurs / formatting** : le formatting est fait hors process par `pino-pretty` ou un autre transport

### Combinaison avec consola

```typescript
// dev → consola pour les scripts CLI / build
import consola from 'consola'
consola.success('Build complete')

// prod → pino pour les logs serveur
import pino from 'pino'
const logger = pino()
logger.info({ port: 3000 }, 'Server listening')
```

C'est OK d'utiliser les deux dans le même projet : consola pour les scripts/builds (DX), pino pour le runtime serveur (perf + structuration).

## Exemple concret

Backend Express avec pino + middleware :

```typescript
import express from 'express'
import pino from 'pino'
import pinoHttp from 'pino-http'

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.body.password'],
})

const app = express()
app.use(pinoHttp({ logger })) // log auto chaque request

app.get('/users/:id', async (req, res) => {
  req.log.info({ id: req.params.id }, 'Fetching user')
  const user = await getUser(req.params.id)
  res.json(user)
})
```

Output prod (JSON, 1 ligne par log) :
```json
{"level":30,"time":1714138472,"requestId":"abc","method":"GET","url":"/users/42","msg":"request received"}
{"level":30,"time":1714138472,"requestId":"abc","id":"42","msg":"Fetching user"}
{"level":30,"time":1714138472,"requestId":"abc","statusCode":200,"responseTime":45,"msg":"request completed"}
```

Ces 3 lignes JSON, parsées par Loki / Datadog, te donnent des dashboards filtrables par `requestId`, `method`, `responseTime`, etc. Sans une ligne de regex.

## Connexions

**Concepts liés** :
- <span class="wikilink-broken" title="Référence non trouvée : Concept - consola remplace console.log par un logger dev-friendly avec niveaux et icônes">Concept - consola remplace console.log par un logger dev-friendly avec niveaux et icônes</span> *(le pendant dev)*

**Prérequis** :
- Node + middleware Express/Fastify
- Notion de structured logging

**S'oppose à / à comparer avec** :
- **`winston`** : autre logger structuré, plus configurable mais plus lent
- **`bunyan`** : ancien standard JSON logging, perfs intermédiaires
- **`console.log`** : ne devrait pas exister en prod
- **`debug`** : namespace-based, OK pour libs mais pas pour app

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026" data-wiki-title="5 packages Node à inclure dans tout projet 2026" data-wiki-preview="1. **`consola`** — un logger 100× plus agréable que `console.log`. Niveaux, couleurs, formats, intégré aux process Node. 2. **`zod`** (ou `@effect/schema`) — validation runtime + typage compile-time depuis un seul schéma. La fin des `if (!i…">5 packages Node à inclure dans tout projet 2026</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/backend-infra" data-wiki-title="MOC - Backend &amp; Infra" data-wiki-preview="- Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP">MOC - Backend &amp; Infra</a>

