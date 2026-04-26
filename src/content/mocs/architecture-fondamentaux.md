---
domain: architecture
tags:
  - type/moc
  - domain/architecture
title: MOC - Architecture & Fondamentaux
slug: architecture-fondamentaux
excerpt: >-
  - Concept - Une closure capture son environnement lexical à la création -
  Concept - Un thunk est une fonction qui retarde l'évaluation
related:
  - une-closure-capture-son-environnement-lexical-a-la-creation
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi
  - le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent
  - clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
  - l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
backlinks:
  - 2026-04-25-closure-et-thunk-en-javascript
  - 2026-04-26-clean-architecture-hybride-sans-over-engineering
  - 2026-04-26-javascript-en-profondeur-concepts-mal-connus
  - 2026-04-26-programmation-imperative-vs-declarative
  - 2026-04-27-algos-data-structures-essentiels-en-typescript
  - big-o-analyse-le-comportement-asymptotique-d-un-algo-en-temps-et-espace
  - clean-architecture-inverse-les-dependances-pour-isoler-le-domaine
  - dfs-explore-en-profondeur-via-stack-bfs-en-largeur-via-queue
  - l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie
  - le-bon-choix-de-structure-de-donnees-depend-des-operations-dominantes
  - le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent
  - programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi
  - quicksort-est-on-log-n-en-moyenne-mais-mergesort-le-garantit-en-pire-cas
  - recursion-cas-de-base-appel-recursif-sur-sous-probleme-plus-petit
  - un-thunk-est-une-fonction-qui-retarde-l-evaluation
  - une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin
  - une-closure-capture-son-environnement-lexical-a-la-creation
topics:
  - architecture
---
## Vue d'ensemble

> Concepts cross-langages : design patterns, architecture logicielle, perf, systèmes, théorie. Ce qui ne périme pas vite.

## Concepts clés

### Concepts FP / fonctionnels
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-closure-capture-son-environnement-lexical-a-la-creation" data-wiki-title="Concept - Une closure capture son environnement lexical à la création" data-wiki-preview="Une closure est une fonction qui **se souvient** des variables de son scope englobant **au moment où elle a été définie** — et continue d'y accéder même quand le scope parent a fini son exécution.">Concept - Une closure capture son environnement lexical à la création</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-thunk-est-une-fonction-qui-retarde-l-evaluation" data-wiki-title="Concept - Un thunk est une fonction qui retarde l'évaluation" data-wiki-preview="Un thunk est **une fonction sans argument** dont le seul rôle est d'**emballer un calcul ou un effet pour qu'il soit exécuté plus tard** — pas maintenant, à la demande de l'appelant.">Concept - Un thunk est une fonction qui retarde l'évaluation</a>

### Paradigmes — impératif vs déclaratif
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi" data-wiki-title="Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi" data-wiki-preview="La distinction **impératif vs déclaratif** est une question de **niveau d'abstraction** : un programme impératif décrit **les étapes** à exécuter (mutations, séquence, contrôle de flux), un programme déclaratif décrit **le résultat voulu**…">Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent" data-wiki-title="Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent" data-wiki-preview="Programmer en déclaratif ne fait pas disparaître la complexité de l'exécution — ça **la déplace** vers le moteur (compilateur, runtime, query planner) — donc plus le moteur est puissant, plus le déclaratif est utilisable, et plus son **abst…">Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent</a>

### Architecture logicielle
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/clean-architecture-inverse-les-dependances-pour-isoler-le-domaine" data-wiki-title="Concept - Clean Architecture inverse les dépendances pour isoler le domaine" data-wiki-preview="La Clean Architecture (Uncle Bob) repose sur **une seule règle structurante** — la **règle de dépendance** : les couches externes (frameworks, DB, UI) **dépendent** des couches internes (logique métier, entités), **jamais l'inverse** — ce q…">Concept - Clean Architecture inverse les dépendances pour isoler le domaine</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie" data-wiki-title="Concept - L'over-engineering vient de couches sans valeur métier qui les justifie" data-wiki-preview="L'**over-engineering architectural** se reconnaît à un signe : une couche, une interface, un DTO, un mapper qui **n'isole rien de réel** parce qu'il n'y a qu'une seule implémentation, jamais de variation, et que personne ne traverse cette f…">Concept - L'over-engineering vient de couches sans valeur métier qui les justifie</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin" data-wiki-title="Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin" data-wiki-preview="Une approche pragmatique de la Clean Architecture commence par **2 couches** (`domain` / `infrastructure`) et n'introduit une 3e ou 4e couche **que face à un signe concret de douleur** — et non par anticipation — ce qui maximise la valeur t…">Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin</a>

## Sous-domaines

### Design patterns & idioms
- 

### Architecture logicielle (clean, hexagonal, DDD)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/clean-architecture-inverse-les-dependances-pour-isoler-le-domaine" data-wiki-title="Concept - Clean Architecture inverse les dépendances pour isoler le domaine" data-wiki-preview="La Clean Architecture (Uncle Bob) repose sur **une seule règle structurante** — la **règle de dépendance** : les couches externes (frameworks, DB, UI) **dépendent** des couches internes (logique métier, entités), **jamais l'inverse** — ce q…">Concept - Clean Architecture inverse les dépendances pour isoler le domaine</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-over-engineering-vient-de-couches-sans-valeur-metier-qui-les-justifie" data-wiki-title="Concept - L'over-engineering vient de couches sans valeur métier qui les justifie" data-wiki-preview="L'**over-engineering architectural** se reconnaît à un signe : une couche, une interface, un DTO, un mapper qui **n'isole rien de réel** parce qu'il n'y a qu'une seule implémentation, jamais de variation, et que personne ne traverse cette f…">Concept - L'over-engineering vient de couches sans valeur métier qui les justifie</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/une-archi-pragmatique-commence-par-2-couches-et-n-en-ajoute-qu-au-besoin" data-wiki-title="Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin" data-wiki-preview="Une approche pragmatique de la Clean Architecture commence par **2 couches** (`domain` / `infrastructure`) et n'introduit une 3e ou 4e couche **que face à un signe concret de douleur** — et non par anticipation — ce qui maximise la valeur t…">Concept - Une archi pragmatique commence par 2 couches et n'en ajoute qu'au besoin</a>

### Systèmes (mémoire, OS, réseau)
- 

### Algorithmes & structures de données
- 

### Théorie (types, concurrence, distribué)
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi" data-wiki-title="Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi" data-wiki-preview="La distinction **impératif vs déclaratif** est une question de **niveau d'abstraction** : un programme impératif décrit **les étapes** à exécuter (mutations, séquence, contrôle de flux), un programme déclaratif décrit **le résultat voulu**…">Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent" data-wiki-title="Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent" data-wiki-preview="Programmer en déclaratif ne fait pas disparaître la complexité de l'exécution — ça **la déplace** vers le moteur (compilateur, runtime, query planner) — donc plus le moteur est puissant, plus le déclaratif est utilisable, et plus son **abst…">Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent</a>

### Performance (profiling, optimisation)
- 

### Pratiques (testing, code review, doc)
- 

## Sources de référence

- [Martin Fowler](https://martinfowler.com/)
- [Hillel Wayne](https://www.hillelwayne.com/)
- [Brendan Gregg (perf)](https://www.brendangregg.com/)
- [LLOGS — distributed systems reading list](https://dancres.github.io/Pages/)

## Questions ouvertes

- 

