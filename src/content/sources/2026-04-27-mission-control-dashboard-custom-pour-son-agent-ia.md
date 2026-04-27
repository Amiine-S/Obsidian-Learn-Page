---
title: 'Mission Control : dashboard custom pour son agent IA'
author: Alex Finn (vidéo YouTube) — synthèse Claude
digested: '2026-04-27T20:54:23.977Z'
format: video
domain: ai
level: intermediate
topics:
  - ai
tags:
  - type/source
  - status/done
  - domain/ai
  - format/video
  - level/intermediate
slug: 2026-04-27-mission-control-dashboard-custom-pour-son-agent-ia
excerpt: >-
  Un agent IA autonome accumule rapidement des **artefacts** : tâches en cours,
  docs générés, prompts sauvegardés, mémoires partielles, fichiers de config,
  scripts custom, logs. Sans organisation explicite, ça devient un fouillis dans
  `~/Documents/` ou `~/.config/agent/`.
---
## Le problème

Un agent IA autonome accumule rapidement des **artefacts** : tâches en cours, docs générés, prompts sauvegardés, mémoires partielles, fichiers de config, scripts custom, logs. Sans organisation explicite, ça devient un fouillis dans `~/Documents/` ou `~/.config/agent/`.

Tu finis par redemander à l'agent les mêmes choses parce que tu ne retrouves plus ce qu'il avait fait la semaine dernière.

## Le concept

Une **interface visuelle custom** que tu construis toi-même, où l'agent expose :

- Sa **roadmap** (tâches à faire, en cours, terminées).
- Ses **tools custom** (les utilitaires qu'il a appris à utiliser pour toi).
- Sa **mémoire** consultable (ce qu'il sait sur toi et tes projets).
- Ses **logs** d'exécution récents.
- Tout ce qui te semble utile à exposer.

C'est ton tableau de bord pour un employé virtuel.

## Pourquoi ce n'est pas un produit standardisé

Le créateur de la vidéo refuse de l'open-sourcer, et il a raison : **un Mission Control utile est par nature personnel**. Le tien ne ressemblera pas au sien parce que :

- Tes workflows sont différents.
- Tes outils sont différents.
- Tes priorités visuelles sont différentes.
- Ce que tu veux voir d'un coup d'œil n'est pas ce que veut voir un autre.

Importer le Mission Control de quelqu'un d'autre = importer son cerveau organisationnel, ce qui ne marche jamais.

## Pattern de construction itératif

Tu ne pré-construis **pas** un Mission Control complet en mode big-design-up-front. Tu le grossis par incréments, déclenchés par des frictions réelles.

### Le déclencheur

Tu rencontres une friction — par exemple :

> *« L'agent a généré 12 fichiers MD ces 2 dernières semaines, je ne retrouve plus ce qu'il a écrit sur le projet X. »*

### La réaction

Tu dis à l'agent :

> *« Construis dans la mission control une vue qui liste tous les docs que tu as générés, groupés par projet, avec date et résumé en une ligne. »*

L'agent ajoute la fonctionnalité, et **utilise cette nouvelle capacité moving forward** — il sait qu'à chaque génération de doc, il doit l'enregistrer dans cette vue.

### Le compounding

Au fil des semaines, ta Mission Control accumule des outils : kanban des tâches, vue des prompts récurrents, indicateurs de coût des appels API, archive des conversations importantes, lanceurs de scripts. Chaque outil naît d'une vraie friction, donc chacun est utilisé.

## Tech stack possible

Pas de prescription dure. Quelques options selon ton niveau :

- **Markdown structuré** dans un dossier dédié, parcouru par un viewer (Obsidian, VS Code).
- **Page Notion** pilotée par l'API.
- **App web simple** (Next.js, Astro, ou même HTML statique) que l'agent met à jour en écrivant des fichiers JSON.
- **Custom mission control fully app** comme dans la vidéo — kanban, vue agent, animations, etc.

Plus le stack est lourd, plus tu paies en maintenance. Commence simple : **un dossier Markdown peut suffire** pour 80% de la valeur.

## Outils typiques à exposer

Liste indicative, à adapter à tes vraies frictions :

| Outil | Pourquoi |
|---|---|
| **Kanban des tâches** | Visualiser ce que l'agent a en cours, ce qui attend |
| **Index des docs générés** | Retrouver ce qui a été produit |
| **Mémoire long-terme structurée** | Voir ce que l'agent croit savoir sur toi (et corriger) |
| **Suivi de coût** | Tokens consommés par jour/semaine, par modèle |
| **Catalog de prompts** | Prompts récurrents accessibles en 1 clic |
| **Lanceurs de scripts** | Workflows déclenchables par bouton plutôt que retapés |
| **Logs d'incidents** | Ce qui a cassé et comment ça a été réparé |

## Le pattern de croissance "outil manquant → l'ajouter"

Le pattern central, à adopter comme réflexe :

> *Quand tu remarques que l'agent fait mal quelque chose ou perd du contexte, demande-lui de construire l'outil manquant dans la Mission Control.*

Exemples concrets cités :

- *« L'agent oubliait des trucs entre les sessions. »* → Construit un système de mémoire structuré dans la mission control.
- *« L'agent générait des docs et je ne les retrouvais pas. »* → Ajout d'une section docs avec index.
- *« Je voulais savoir ce qu'il faisait en arrière-plan. »* → Ajout d'une vue "agents au travail" en temps réel.

Chaque outil est une réponse à un manque ressenti, pas une feature spéculative.

## Anti-pattern : importer celle d'un autre

La demande #1 sous une démo de Mission Control : *« Open source ta mission control, donne-la nous. »* Mauvaise idée, pour les raisons mentionnées plus haut.

Si tu veux t'inspirer, regarde la **structure** (quelles vues exposer), pas le **code**. Et reconstruis sur ton stack avec tes vrais besoins.

## TL;DR

Une Mission Control = **dashboard personnel** où ton agent expose son travail et ses outils. Tu la construis **par incréments**, chaque outil ajouté résolvant une friction réelle. C'est le pattern qui transforme un agent qui accomplit des tâches en agent qui **se gère lui-même** dans ton flux de travail. Ne copie pas celle des autres, construis la tienne — et laisse ton agent t'aider à le faire.

