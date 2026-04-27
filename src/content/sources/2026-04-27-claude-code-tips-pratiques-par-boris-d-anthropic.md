---
date: 2026-04-27T00:00:00.000Z
type: source
source: Talk Anthropic - Boris (créateur de Claude Code)
domain: ai
topics:
  - ai
tags:
  - claude-code
  - ai-coding
  - agentic
  - tooling
  - anthropic
title: 'Claude Code : tips pratiques par Boris (Anthropic)'
slug: 2026-04-27-claude-code-tips-pratiques-par-boris-d-anthropic
excerpt: >-
  Boris, membre du staff technique chez Anthropic et créateur de Claude Code, a
  livré un talk dense en conseils pratiques sur la manière d'utiliser
  efficacement l'outil. Pas d'historique, pas de théorie : du concret, des
  prompts, des workflows. Voici la synthèse.
---
Boris, membre du staff technique chez Anthropic et créateur de Claude Code, a livré un talk dense en conseils pratiques sur la manière d'utiliser efficacement l'outil. Pas d'historique, pas de théorie : du concret, des prompts, des workflows. Voici la synthèse.

## Ce qu'est (et n'est pas) Claude Code

Claude Code n'est pas un autocomplete amélioré. Là où les générations précédentes d'assistants se contentaient de compléter quelques lignes, Claude Code est **pleinement agentique** : il construit des features entières, écrit des fichiers complets, corrige des bugs de bout en bout.

Sa force : il s'intègre dans **n'importe quel environnement** sans demander de changer de workflow. VS Code, JetBrains, Xcode, Vim, Emacs, terminal en local ou via SSH/tmux — peu importe. C'est précisément pourquoi Anthropic a choisi le terminal comme dénominateur commun, et aussi parce que Boris pense qu'avec la vitesse à laquelle les modèles progressent, **l'IDE classique pourrait ne plus être pertinent d'ici la fin de l'année**.

## Setup initial recommandé

Quelques commandes à passer dès la première utilisation :

- `/terminal-setup` : active `Shift+Enter` pour les retours à la ligne (plus besoin de backslashes).
- `/theme` : choix du thème (clair, sombre, daltonien).
- `/install-github-app` : installe l'app GitHub permettant de mentionner Claude dans les issues et PRs.
- Personnaliser la liste des outils auto-autorisés pour éviter les prompts répétitifs.

**Astuce dictée** (macOS) : activer la dictée système dans les réglages d'accessibilité, double-tap sur la touche dédiée, et parler ses prompts comme à un autre ingénieur. Ça change le rapport au prompt — moins de friction, plus de spécificité.

## Tip n°1 : commencer par du Q&A sur le codebase

Le conseil le plus important pour quiconque débute : **ne pas commencer par éditer du code**. Commencer par poser des questions au codebase.

Chez Anthropic, c'est ce qu'on apprend aux nouveaux le premier jour. Résultat : l'onboarding technique est passé de **deux à trois semaines à deux à trois jours**.

Pas d'indexation à faire, pas de base de données distante, pas d'upload : le code reste local, Anthropic n'entraîne pas ses modèles dessus. On installe, on lance, on demande.

Exemples de prompts utiles :

- « Comment ce morceau de code est-il utilisé ? »
- « Comment instancier cette classe ? » → Claude va chercher de vrais exemples d'usage, pas un simple grep.
- « Pourquoi cette fonction a 15 arguments avec des noms aussi bizarres ? » → Claude fouille l'historique git, retrouve les commits responsables, suit les issues liées, et résume.
- « Qu'est-ce que j'ai shippé cette semaine ? » → Boris fait ça chaque lundi en standup.

Fait notable : rien dans le system prompt ne dit à Claude d'utiliser git. **Le modèle sait simplement le faire**, parce qu'il est bon.

## Tip n°2 : planifier avant d'écrire

Une fois à l'aise avec le Q&A, on passe à l'édition. Claude Code dispose d'une boîte à outils volontairement minimale (édition de fichiers, exécution bash, recherche), qu'il enchaîne intelligemment sans qu'on ait à le micro-manager.

Le piège classique : balancer une feature de 30 000 lignes en un prompt et espérer un one-shot parfait. Parfois ça marche, parfois on récupère quelque chose qui n'a rien à voir avec ce qu'on voulait.

La solution la plus simple : **demander à Claude de réfléchir d'abord**. Pas besoin de plan mode ou de tooling spécial :

> *« Brainstorme des idées, fais un plan, soumets-le moi, demande mon approbation avant d'écrire du code. »*

Autre incantation utile que Boris utilise tout le temps : `commit push PR`. Trois mots. Claude commit, push sur une branche, ouvre la PR, en respectant le format de commit du repo (qu'il déduit lui-même de l'historique).

## Tip n°3 : brancher les outils de l'équipe

Là, Claude Code commence à briller. Deux types d'outils principaux :

- **Outils CLI** : on dit simplement à Claude qu'un binaire existe et de lancer `--help` pour comprendre. Si on l'utilise souvent, on documente dans `CLAUDE.md`.
- **Serveurs MCP** : Claude les utilise nativement. On les déclare, on explique leur usage, il s'en sert.

Le vrai pouvoir vient de là : sur un nouveau codebase, on donne à Claude **tous les outils que l'équipe utilise déjà**, et il les manipule en notre nom.

## Tip n°4 : donner du contexte avec CLAUDE.md

Plus Claude a de contexte, meilleures sont ses décisions. Le fichier `CLAUDE.md` à la racine du projet est lu automatiquement à chaque session.

Hiérarchie :

- `CLAUDE.md` projet (commité, partagé avec l'équipe)
- `CLAUDE.local.md` (personnel, non commité)
- `CLAUDE.md` dans des sous-dossiers (chargés à la demande quand Claude travaille dedans)
- Fichier d'entreprise pour les configs globales sur tout le parc

Ce qu'on y met : commandes bash courantes, outils MCP, décisions architecturales, fichiers importants. **Garder court** : un CLAUDE.md trop long mange du contexte sans bénéfice.

Autres mécanismes pour injecter du contexte :

- **Slash commands** dans `.claude/commands/` (workflow réutilisable, ex : labelliser des issues GitHub via une GitHub Action).
- **@mention de fichiers** pour les pull explicitement dans le contexte.

## Tip n°5 : workflows efficaces

Trois patterns qui marchent particulièrement bien :

1. **Explore → plan → confirm → code** (le plus sûr).
2. **Boucle d'itération avec feedback** : si Claude peut vérifier son travail (tests unitaires, screenshots Puppeteer, simulateur iOS), il itère seul et le résultat devient excellent. Donner un mock de UI à Claude + un moyen de screenshoter → après 2-3 itérations, le résultat est presque parfait.
3. **Donner systématiquement un signal de feedback** quel que soit le domaine.

## Configuration partagée à l'échelle de l'équipe

Si on hésite, le conseil de Boris : **commencer par du contexte projet partagé**. Effet réseau immédiat — une personne configure, toute l'équipe en bénéficie.

Exemple chez Anthropic : dans le repo apps, un serveur MCP Puppeteer est commité dans le `.mcp.json`. N'importe quel ingénieur travaillant dessus est invité à l'installer, sans avoir à découvrir et configurer Puppeteer lui-même.

Outils built-in pour gérer ça :

- `/memory` : voit tous les fichiers de mémoire actifs, permet de les éditer.
- `#` (dièse) : pour faire mémoriser quelque chose à Claude (il choisit où le ranger).

## Pro tips : keybindings du terminal

Le terminal est minimaliste, donc beaucoup de raccourcis sont peu découvrables :

- `Shift+Tab` : bascule en mode auto-accept des édits (les commandes bash restent confirmées). Utile quand Claude itère sur des tests et qu'on ne veut pas valider chaque diff.
- `#` : mémoriser quelque chose, intégré automatiquement à `CLAUDE.md`.
- `!` : passer en mode bash pour exécuter une commande locale qui rentre dans le contexte (Claude verra commande + output au prochain tour).
- `@` : mentionner fichiers et dossiers.
- `Esc` : interrompre Claude **à n'importe quel moment** sans corrompre la session. Idéal pour rectifier en plein milieu d'une édition.
- `Esc Esc` : remonter dans l'historique de la session.
- `Ctrl+R` : voir l'output complet, exactement ce que Claude voit dans son contexte.
- `claude --resume` ou `claude --continue` : reprendre une session.

Multimodal, au passage : Claude Code accepte les images depuis le départ. Drag & drop, copier-coller, ou chemin de fichier — tout fonctionne. Boris l'utilise souvent en glissant un mockup et en demandant l'implémentation.

## Le SDK Claude Code

Le flag `-p` expose Claude Code comme un **utilitaire Unix surpuissant**. On lui passe un prompt, des outils autorisés, un format de sortie (JSON, streaming JSON), et on l'utilise comme n'importe quelle commande.

```
claude -p "<prompt>" --allowed-tools <...> --output-format json
```

Les usages chez Anthropic : CI, réponse à incident, pipelines variés. On peut piper depuis `git status`, depuis un bucket GCP, depuis le CLI Sentry, et laisser Claude analyser. Boris pense qu'on **ne fait qu'effleurer** ce que ce pattern rend possible.

## Workflows avancés : parallélisation

Les power users d'Anthropic ne tournent jamais une seule session. Ils ont :

- Plusieurs sessions SSH avec tunnels tmux.
- Plusieurs checkouts du même repo pour faire tourner plusieurs Claude en parallèle.
- Des **git worktrees** pour isoler les sessions.

Anthropic travaille à rendre tout ça plus simple, mais on peut déjà lancer autant de sessions qu'on veut.

## Points clés du Q&A

- **La partie la plus difficile à coder** ? Rendre les commandes bash sûres tout en restant productif. Solution : commandes read-only auto-acceptées, analyse statique pour combiner les commandes sûres, système de permissions à plusieurs niveaux (allow-list, block-list).
- **Pourquoi un CLI plutôt qu'un IDE ?** Compatibilité universelle + pari sur l'évolution rapide des modèles, qui pourrait rendre les surcouches IDE rapidement obsolètes.
- **Adoption en interne** : ~80 % des personnes techniques chez Anthropic utilisent Claude Code chaque jour, y compris les chercheurs ML qui s'en servent pour éditer et exécuter des notebooks.

## TL;DR — la séquence d'apprentissage

1. Setup : `/terminal-setup`, `/install-github-app`, allowed tools.
2. **Q&A sur le codebase** avant tout.
3. Édition avec **plan d'abord, code ensuite**.
4. Brancher les outils CLI et MCP de l'équipe.
5. Configurer un `CLAUDE.md` partagé.
6. Construire des workflows avec feedback loops (tests, screenshots).
7. Découvrir les keybindings et le mode auto-accept.
8. Explorer le SDK pour automatiser au-delà de la session interactive.
9. Paralléliser via worktrees / sessions multiples.

Le fil rouge du talk : **Claude Code est volontairement free-form**. Pas de workflow imposé, parce que chaque ingénieur, chaque équipe, chaque codebase a ses propres patterns. À chacun de tailler son setup — et de le partager.

