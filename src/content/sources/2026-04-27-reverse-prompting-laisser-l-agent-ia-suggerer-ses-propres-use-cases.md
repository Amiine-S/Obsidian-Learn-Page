---
title: 'Reverse prompting : laisser l''agent IA suggérer ses propres use cases'
author: Alex Finn (vidéo YouTube) — synthèse Claude
digested: '2026-04-27T20:53:37.885Z'
format: video
domain: ai
level: beginner
topics:
  - ai
tags:
  - type/source
  - status/done
  - domain/ai
  - format/video
  - level/beginner
slug: 2026-04-27-reverse-prompting-laisser-l-agent-ia-suggerer-ses-propres-use-cases
excerpt: >-
  Tu installes un agent IA autonome (OpenCode, Hermes, Claude Code). Tu ouvres
  le prompt. Tu te retrouves face à un curseur clignotant. **Que fais-tu ?**
---
## Le problème de l'onboarding

Tu installes un agent IA autonome (OpenCode, Hermes, Claude Code). Tu ouvres le prompt. Tu te retrouves face à un curseur clignotant. **Que fais-tu ?**

Le piège classique : copier les use cases d'un YouTubeur. Ses workflows sont taillés pour ses business, sa vie, ses contraintes. Importer ses prompts dans ton contexte ne donne presque jamais de la valeur durable.

## L'inversion

Plutôt que **toi** qui devines comment utiliser l'agent, **l'agent** devine comment t'aider. Pour ça, il a besoin de **te connaître**. C'est le mouvement appelé *reverse prompting*.

## Procédure en 4 étapes

### 1. Brain dump complet sur toi

Ouvre une session avec l'agent et déverse tout ce qui définit ton activité :

- Identité pro : poste, rôle, stack technique principale.
- Business / projets : ce sur quoi tu travailles, métriques, deadlines.
- Outils que tu utilises : IDE, communication, gestion de projet, hosting, comptabilité.
- Goals court et moyen terme.
- Contraintes : budget, temps disponible, niveau technique.

L'agent stocke ça dans sa mémoire long-terme. Cette mémoire devient le **contexte de base** pour toutes les décisions suivantes.

### 2. Trace papier d'une journée de travail manuel

Pendant **un jour entier**, prends un papier et un stylo (ou un fichier `.md`). Note **chaque action manuelle répétitive** que tu fais sur ton ordi :

- Lire et trier 30 emails le matin.
- Rédiger un brief Notion pour chaque tâche.
- Récupérer les chiffres de la veille dans 3 dashboards.
- Faire les screenshots et les uploader sur Slack.
- Écrire le compte-rendu de la réunion.
- Vérifier 5 sites de news.
- ...

L'objectif n'est pas l'exhaustivité parfaite, c'est de **rendre visible** la masse de micro-tâches manuelles que tu fais sans y penser.

### 3. Inject la trace dans la mémoire de l'agent

Colle la liste dans une nouvelle conversation, demande à l'agent de la stocker en mémoire long-terme.

À ce stade, l'agent a deux choses :

- Qui tu es (étape 1).
- Ce que tu fais concrètement (étape 2).

### 4. Reverse prompt

Demande à l'agent ce qu'il devrait faire pour toi :

> *« Sur la base de ce que tu sais de moi (qui je suis, mes goals, mes outils, et la liste des tâches manuelles que je fais quotidiennement), quels workflows et use cases dois-je implémenter avec toi ? Classe-les par ROI estimé (gain de temps × fréquence). »*

Tu reçois un backlog **personnalisé** de 10–20 workflows à automatiser, hiérarchisés. Tu choisis 1–2 et tu les implémentes.

## Pourquoi c'est plus efficace que copier les autres

Le créateur de la vidéo donne l'analogie : *« Tu n'irais pas demander au CEO d'une autre boîte ce que ses employés font, pour ensuite assigner les mêmes tâches à tes employés. »* Les workflows sont **personnels**.

Trois raisons techniques pour lesquelles ça marche mieux :

1. **L'agent voit des patterns que toi tu ne vois plus** : les actions que tu fais en pilote automatique chaque jour sont invisibles pour toi mais flagrantes dans une liste.
2. **L'agent priorise** : il évalue volume × fréquence × difficulté technique, mieux que toi sous le coup d'enthousiasme.
3. **L'agent connaît ses propres capacités** : il sait ce qu'il peut faire de façon fiable et propose des workflows réalistes pour son niveau.

## Aller plus loin : reverse prompt continu

Le pattern marche aussi en cours d'usage :

- *« Quels nouveaux outils dois-je ajouter à ma mission control ? »*
- *« Quels modèles locaux peut tourner mon device, et pour quels use cases ? »*
- *« Quelles parties de mon workflow actuel sont mal automatisées ? »*

Plus l'agent te connaît (mémoire qui s'enrichit), meilleures sont ses suggestions.

## Limites

- **Sycophantie** : l'agent peut te proposer des workflows qui te flattent plus qu'ils ne te servent. Garde un œil critique.
- **Hallucination de capabilities** : il peut suggérer des automatisations qu'il ne sait pas vraiment faire. Tester avant d'investir.
- **Mémoire imparfaite** : si tu travailles sur 5 projets et que ta mémoire est mal structurée, ses suggestions vont mélanger les contextes. Investis dans une bonne organisation de mémoire (par projet, par domaine).

## TL;DR

Ne copie pas les use cases des autres. **Brain dump qui tu es, trace ce que tu fais, demande à l'agent ce qu'il doit automatiser**. C'est la procédure d'onboarding qui transforme un agent générique en assistant personnel pertinent. Le reverse prompting est aussi utile en cours d'usage : laisse l'agent piloter sa propre montée en compétence sur tes workflows.

