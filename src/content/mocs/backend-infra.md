---
domain: backend
tags:
  - type/moc
  - domain/backend
  - domain/infra
title: MOC - Backend & Infra
slug: backend-infra
excerpt: >-
  - Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé
  end-to-end - Concept - HttpApiBuilder lie un handler Effect à chaque endpoint
  déclaré - Concept - Le runtime Effect-TS injecte les Layers dans le pipeline
  du serveur HTTP
related:
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
  - effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees
backlinks:
  - 2026-04-26-5-packages-node-a-inclure-dans-tout-projet-2026
  - 2026-04-26-effect-ts-premier-serveur-http-avec-effect-platform
  - 2026-04-26-exception-handling-patterns-en-typescript
  - 2026-04-27-reduire-la-memoire-nodejs-de-40-sans-toucher-au-code
  - 2026-04-27-typescript-70-beta-le-compilateur-go-natif
  - max-old-space-size-limite-la-heap-v8-et-force-un-comportement-oom-controle
  - optimize-for-size-bascule-v8-du-jit-speed-first-au-jit-memory-first
  - >-
    clinicjs-et-0x-diagnostiquent-les-leaks-et-les-hot-paths-node-sans-modifier-le-code
  - >-
    consola-remplace-console-log-par-un-logger-dev-friendly-avec-niveaux-et-icones
  - >-
    custom-exception-classes-nomment-les-erreurs-metier-pour-discrimination-typee
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare
  - >-
    le-centralized-handling-concentre-la-traduction-erreur-transport-en-un-seul-endroit
  - >-
    le-pattern-result-encode-l-erreur-dans-le-type-de-retour-pour-forcer-la-gestion
  - le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http
  - le-speedup-10x-de-ts-70-vient-de-go-multi-threading-type-checker-reecrit
  - pino-est-le-logger-node-le-plus-rapide-via-json-structure-asynchrone
  - try-catch-impose-un-narrow-manuel-et-ne-documente-rien-dans-la-signature
  - tsx-execute-typescript-directement-via-esbuild-10x-plus-rapide-que-ts-node
  - >-
    validate-first-place-toutes-les-verifications-en-debut-de-fonction-pour-un-code-happy-path-plat
  - vitest-remplace-jest-avec-api-compatible-et-demarrage-10x-plus-rapide
  - zod-unifie-validation-runtime-et-types-compile-time-depuis-un-seul-schema
topics:
  - backend
  - devops
---
## Vue d'ensemble

> APIs, bases de données, observabilité, conteneurs, cloud. Le "comment ça tient en prod".

## Concepts clés

### Effect-TS HTTP server
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end" data-wiki-title="Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end" data-wiki-preview="`HttpApi` est une **description déclarative** de la surface d'une API : pour chaque endpoint, tu déclares la méthode, le path, les schémas (path, query, body, response, erreurs) — cette spec devient une **source unique de vérité** dont sont…">Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare" data-wiki-title="Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré" data-wiki-preview="`HttpApiBuilder` est le pont entre la **spec** (`HttpApi`) et l'**implémentation** : pour chaque endpoint déclaré dans le schéma, tu fournis un **handler Effect typé** dont le compilateur vérifie que l'input et l'output matchent la spec — i…">Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http" data-wiki-title="Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP" data-wiki-preview="Quand un serveur Effect-TS démarre via `NodeHttpServer.layer` + `NodeRuntime.runMain`, le runtime construit **un graphe de Layers** (DB, logger, services, HttpServer) puis **rend chaque service disponible aux handlers** : tu n'écris jamais…">Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP</a>

## Sous-domaines

### API design (REST, GraphQL, gRPC)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end" data-wiki-title="Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end" data-wiki-preview="`HttpApi` est une **description déclarative** de la surface d'une API : pour chaque endpoint, tu déclares la méthode, le path, les schémas (path, query, body, response, erreurs) — cette spec devient une **source unique de vérité** dont sont…">Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapibuilder-lie-un-handler-effect-a-chaque-endpoint-declare" data-wiki-title="Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré" data-wiki-preview="`HttpApiBuilder` est le pont entre la **spec** (`HttpApi`) et l'**implémentation** : pour chaque endpoint déclaré dans le schéma, tu fournis un **handler Effect typé** dont le compilateur vérifie que l'input et l'output matchent la spec — i…">Concept - HttpApiBuilder lie un handler Effect à chaque endpoint déclaré</a>

### Bases de données (relationnel, NoSQL, vector)
- 

### Conteneurs & orchestration (Docker, K8s)
- 

### Observabilité (logs, metrics, traces)
- 

### Cloud (AWS, GCP, Cloudflare)
- 

### Sécurité & auth
- 

### Patterns distribués (queues, event-driven, CQRS)
- 

### Frameworks & DI
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-runtime-effect-ts-injecte-les-layers-dans-le-pipeline-du-serveur-http" data-wiki-title="Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP" data-wiki-preview="Quand un serveur Effect-TS démarre via `NodeHttpServer.layer` + `NodeRuntime.runMain`, le runtime construit **un graphe de Layers** (DB, logger, services, HttpServer) puis **rend chaque service disponible aux handlers** : tu n'écris jamais…">Concept - Le runtime Effect-TS injecte les Layers dans le pipeline du serveur HTTP</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/effect-ts-fait-la-di-via-des-layers-composables-au-lieu-de-classes-annotees" data-wiki-title="Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées" data-wiki-preview="Là où NestJS résout les dépendances **au runtime** via des décorateurs (`@Injectable`) et un container, Effect-TS les résout **au compile-time** via des `Layer&lt;RIn, E, ROut&gt;` qui décrivent comment construire un service à partir d'autres ser…">Concept - Effect-TS fait la DI via des Layers composables au lieu de classes annotées</a>

## Sources de référence

- [High Scalability](http://highscalability.com/)
- [Martin Kleppmann — DDIA](https://dataintensive.net/)
- [The Pragmatic Engineer](https://newsletter.pragmaticengineer.com/)
- [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/)

## Questions ouvertes

- 

