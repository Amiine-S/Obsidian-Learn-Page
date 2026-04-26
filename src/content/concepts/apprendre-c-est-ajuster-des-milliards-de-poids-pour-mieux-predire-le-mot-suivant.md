---
created: 2026-04-27T00:00:00.000Z
domain: ai
level: beginner
tags:
  - type/concept
  - domain/ai
  - level/beginner
title: >-
  Concept - Apprendre c'est ajuster des milliards de poids pour mieux prédire le
  mot suivant
slug: >-
  apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
excerpt: >-
  Beaucoup imaginent que les LLM "ont lu et mémorisé" Wikipedia et tout
  l'Internet. C'est imprécis. Ils ont **traversé** ces textes des dizaines de
  fois pendant l'entraînement, et chaque fois, ils ont **ajusté
  infinitésimalement leurs poids** pour mieux prédire la suite.
oneLiner: >-
  "Entraîner un LLM" signifie présenter au modèle des milliards d'exemples
  (texte) et **ajuster mécaniquement chacun de ses paramètres** (boutons
  numériques, des centaines de milliards) via la **descente de gradient**,
  jusqu'à ce que le modèle prédise le bon mot suivant avec la meilleure
  probabilité possible — la "connaissance" est ainsi distillée dans la
  **disposition** des poids, pas stockée comme une base de données.
related:
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
  - >-
    les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - ia-llms
backlinks:
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - >-
    les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
topics:
  - backend
---
## Idée en une phrase

> "Entraîner un LLM" signifie présenter au modèle des milliards d'exemples (texte) et **ajuster mécaniquement chacun de ses paramètres** (boutons numériques, des centaines de milliards) via la **descente de gradient**, jusqu'à ce que le modèle prédise le bon mot suivant avec la meilleure probabilité possible — la "connaissance" est ainsi distillée dans la **disposition** des poids, pas stockée comme une base de données.

## Contexte / pourquoi ça compte

Beaucoup imaginent que les LLM "ont lu et mémorisé" Wikipedia et tout l'Internet. C'est imprécis. Ils ont **traversé** ces textes des dizaines de fois pendant l'entraînement, et chaque fois, ils ont **ajusté infinitésimalement leurs poids** pour mieux prédire la suite.

Ce qui en résulte n'est pas une copie compressée du corpus, c'est un **système d'engendrement** des phrases plausibles. Différence cruciale : tu peux demander à un LLM de te répondre sur un sujet jamais vu pendant l'entraînement, et il interpolera. Une vraie base de données ne le ferait pas.

## Détails / mécanisme

### Combien de paramètres ?

| Modèle | Année | Paramètres |
|---|---|---|
| GPT-2 | 2019 | 1,5 milliard |
| GPT-3 | 2020 | 175 milliards |
| GPT-4 | 2023 | ~1 700 milliards (mixture of experts) |
| Llama 3 405B | 2024 | 405 milliards |
| Claude 4.6 Sonnet | 2025 | non publié, estimé ~500 G |
| Frontier 2026 | 2026 | trillions (mixture-of-experts) |

Chaque "paramètre" est un nombre flottant (float16, float8 typiquement). Donc un modèle 175B occupe ~350 GB de RAM (en float16).

### La descente de gradient — l'optimisation

Pour ajuster ces milliards de boutons, on utilise la **rétropropagation** + **descente de gradient stochastique** :

1. **Forward pass** : on donne une phrase incomplète au modèle, il prédit le prochain mot
2. **Calculer la loss** : différence entre la prédiction et le vrai mot (cross-entropy)
3. **Backward pass** : calcul du gradient — pour chaque poids, quelle direction diminuerait la loss ?
4. **Update** : ajuster chaque poids d'une petite fraction (`learning rate`) dans la direction du gradient
5. Répéter sur des milliards d'exemples

Mathématiquement :
```
W_new = W_old - learning_rate × ∂loss/∂W
```

C'est tout. Le miracle : appliqué 10¹⁹ fois, ça produit Claude.

### La phase de pre-training

C'est la phase la plus longue et coûteuse :
- **Données** : 10-15 trillions de tokens (≈ tout l'internet utilisable + livres + code)
- **Compute** : milliers de GPUs H100 ou équivalent, plusieurs mois
- **Coût** : 50M$ - 500M$ pour un frontier model 2025-2026
- **Énergie** : équivalent à plusieurs jours de consommation d'une ville moyenne

Pendant cette phase, le modèle "voit" le corpus une à plusieurs fois. À la fin, ses poids sont stabilisés dans un état de bonne prédiction.

### Le post-training (fine-tuning + RLHF)

Le modèle pre-trained est utilisable mais pas très "humain" — il continue à compléter, ne répond pas comme un assistant. On rajoute :

1. **Supervised Fine-Tuning (SFT)** : on lui montre 10k-100k paires (prompt humain, bonne réponse). Il apprend le format question/réponse.
2. **RLHF (Reinforcement Learning from Human Feedback)** :
   - Le modèle génère plusieurs réponses à une question
   - Des humains classent : "celle-ci est meilleure que celle-là"
   - On entraîne un **reward model** sur ces préférences
   - On entraîne le LLM à maximiser cette reward

3. **Constitutional AI** (Anthropic) : on demande au modèle de critiquer et réécrire ses propres réponses selon une charte éthique. Plus scalable que RLHF.

Le post-training est plus court (jours, pas mois) et moins cher, mais c'est ce qui rend Claude "Claude" plutôt qu'un autocomplete bête.

### La connaissance comme disposition

Quand tu demandes "Quelle est la capitale de la France ?", il n'y a pas de table {France: Paris} dans le modèle. Il y a une **configuration de milliards de poids** qui, en réponse à ces tokens d'entrée, font émerger la prédiction "Paris" comme étant la plus probable.

C'est comme demander : "où dans Beethoven est stockée la 9e symphonie ?" Pas dans une cellule de son cerveau. Dans la **disposition globale** de ses neurones et habitudes. Si tu enlèves un neurone, il joue toujours la 9e (avec un peu moins de précision peut-être).

Cette propriété s'appelle la **représentation distribuée**. Elle rend les LLM robustes mais aussi opaques (interprétabilité difficile).

## Exemple concret

Une intuition de l'échelle.

**1 paramètre** : un seul bouton, capable d'apprendre une relation linéaire simple (`y = ax + b`).
**1000 paramètres** : un petit MLP, peut classifier des images MNIST (chiffres manuscrits).
**1 million** : un CNN qui lit des images, ImageNet.
**100 millions** : BERT (2018), comprend bien le langage pour des tâches simples.
**1 milliard** : GPT-2, génère du texte cohérent sur un paragraphe.
**100 milliards** : GPT-3, qui a ouvert l'ère des LLM modernes — peut coder, traduire, raisonner basiquement.
**Mille milliards** : frontier 2025-2026 — code presque comme un dev senior, raisonne sur des problèmes complexes.

À chaque ordre de grandeur, des **capacités émergentes** apparaissent. C'est ce qu'on appelle les **scaling laws** : performance ~ log(paramètres × données × compute).

### Le fine-tuning communautaire

Si tu n'as pas 50M$, tu peux quand même **fine-tuner** un modèle open-weights (Llama, Mistral) avec :
- LoRA / QLoRA : ne touche qu'une fraction des paramètres, faisable sur 1 GPU consumer
- Quelques milliers d'exemples spécifiques à ton domaine
- Coût : 50-500$, quelques heures

C'est l'écosystème HuggingFace : modèles ouverts, fine-tunes, datasets. Une démocratisation surprenante.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste" data-wiki-title="Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste" data-wiki-preview="L'objectif d'entraînement d'un LLM est trivialement simple : étant donné un texte, prédire le **token suivant**. Tout ce qui ressemble à de la &quot;compréhension&quot;, de la &quot;raison&quot;, du &quot;code&quot;, de la &quot;traduction&quot; émerge **comme effet de bord** de…">Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique" data-wiki-title="Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique" data-wiki-preview="Un **embedding** est la représentation d'un mot (ou phrase, image, code…) sous forme de **vecteur de quelques centaines à quelques milliers de nombres** dans un espace géométrique où **la distance entre deux vecteurs reflète la similarité s…">Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant" data-wiki-title="Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant" data-wiki-preview="L'**attention** est le mécanisme qui, à chaque mot prédit, calcule **combien de poids accorder** à chacun des mots du contexte précédent — comme un projecteur qui éclaire les mots pertinents pour la prédiction et atténue les autres — c'est…">Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant</a>

**Prérequis** :
- Notion de fonction et de dérivée (juste l'intuition d'une pente)
- Comprendre que prédire le mot suivant est l'objectif

**S'oppose à / à comparer avec** :
- **Système expert / GOFAI** : règles écrites à la main par des humains. Ne s'adapte pas.
- **Recherche dans une base** : pas d'apprentissage, pas d'interpolation.
- **Reinforcement Learning pur** : autre objectif (maximiser reward), entraînement par l'expérience plutôt que par démonstration.

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples" data-wiki-title="Comment l'IA pense — une histoire en analogies simples" data-wiki-preview="1. Imagine une **immense bibliothèque mentale** où chaque mot, chaque idée, chaque tournure de phrase est rangée à un emplacement précis dans un espace à des milliers de dimensions. Plus deux idées sont proches, plus elles sont voisines de…">Comment l'IA pense — une histoire en analogies simples</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/ia-llms" data-wiki-title="MOC - IA &amp; LLMs" data-wiki-preview="- *(à peupler)*">MOC - IA &amp; LLMs</a>

