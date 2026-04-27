---
created: 2026-04-27T00:00:00.000Z
domain: ai
level: beginner
tags:
  - type/concept
  - domain/ai
  - level/beginner
title: >-
  Concept - L'attention permet au modèle de regarder certains mots plus que
  d'autres pour prédire le suivant
slug: >-
  l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
excerpt: >-
  Avant l'attention (papier *Attention Is All You Need*, Vaswani et al., 2017),
  les architectures de NLP (RNN, LSTM) lisaient les phrases **séquentiellement**
  et avaient un problème de **mémoire courte** : difficile de relier un pronom
  au début d'une phrase à son antécédent quelque
oneLiner: >-
  L'**attention** est le mécanisme qui, à chaque mot prédit, calcule **combien
  de poids accorder** à chacun des mots du contexte précédent — comme un
  projecteur qui éclaire les mots pertinents pour la prédiction et atténue les
  autres — c'est l'innovation centrale des Transformers, l'architecture de tous
  les LLM modernes.
related:
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
  - >-
    les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
  - >-
    les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - ia-llms
backlinks:
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - >-
    apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
  - >-
    les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
  - >-
    les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
topics:
  - ai
---
## Idée en une phrase

> L'**attention** est le mécanisme qui, à chaque mot prédit, calcule **combien de poids accorder** à chacun des mots du contexte précédent — comme un projecteur qui éclaire les mots pertinents pour la prédiction et atténue les autres — c'est l'innovation centrale des Transformers, l'architecture de tous les LLM modernes.

## Contexte / pourquoi ça compte

Avant l'attention (papier *Attention Is All You Need*, Vaswani et al., 2017), les architectures de NLP (RNN, LSTM) lisaient les phrases **séquentiellement** et avaient un problème de **mémoire courte** : difficile de relier un pronom au début d'une phrase à son antécédent quelques phrases avant. L'attention règle ce problème en permettant à chaque mot de **regarder directement** n'importe quel autre mot du contexte, peu importe la distance.

Sans attention, pas de Claude, pas de GPT, pas de Gemini. C'est l'innovation algorithmique des LLM.

## Détails / mécanisme

### L'idée intuitive

Pour deviner le mot suivant dans :

> *"Le chat de ma sœur, qui revient d'un long voyage en Asie, dort sur le canapé. Il est…"*

Le modèle doit comprendre que **"Il"** réfère à **"chat"** (pas à "ma sœur" ni à "Asie"). Pour ça, il doit donner du poids à *"chat"* élevé, à *"dort"* moyen, à *"Asie"* faible.

L'attention est ce mécanisme qui, pour chaque token à prédire, calcule un **score de pertinence** vis-à-vis de tous les autres tokens du contexte.

### Mécanique : Query, Key, Value

Pour chaque mot, le modèle calcule trois vecteurs :
- **Query (Q)** : "qu'est-ce que je cherche ?"
- **Key (K)** : "qu'est-ce que je suis ?"
- **Value (V)** : "qu'est-ce que j'apporte ?"

L'attention de mot A vers mot B se calcule :

```
score(A, B) = Q_A · K_B  (produit scalaire)
```

On normalise sur tout le contexte via **softmax** :
```
attention(A, B) = softmax(score(A, B) / √d) sur tous les B
```

Puis on construit la représentation enrichie :
```
output_A = Σ attention(A, B) * V_B  pour tous B
```

Donc chaque mot devient une **moyenne pondérée** de tous les mots du contexte, pondérée par leur pertinence.

### Multi-Head Attention

Une seule attention ne suffit pas. Le modèle apprend à **regarder plusieurs choses en parallèle** :
- Une "tête" suit les références (pronoms → antécédents)
- Une autre suit la grammaire (sujet → verbe)
- Une autre suit le contexte temporel
- ... etc.

Un Transformer typique a **8 à 64 têtes** d'attention par couche. Et il y a typiquement 30-100 couches. Ça fait beaucoup de projecteurs.

### Self-attention vs cross-attention

- **Self-attention** : un mot regarde les autres mots **de la même séquence** (le cas standard pour générer du texte)
- **Cross-attention** : un mot d'une séquence A regarde les mots d'une autre séquence B (utile en traduction, ou en multimodal text→image)

### La complexité quadratique

Calculer l'attention de chaque mot vers chaque autre coûte **O(n²)** où n = longueur de la séquence. Avec n=100 000 tokens (long documents), ça devient prohibitif.

C'est pour ça que des optimisations existent :
- **Flash Attention** : ré-arrange les calculs pour mieux utiliser le cache GPU
- **Sparse Attention** : ne regarde que certains tokens (sliding window, etc.)
- **Linear Attention** : approximation O(n)
- **State Space Models (Mamba)** : alternative non-quadratique à l'attention, en pleine émergence en 2026

### Multi-head en image

Imagine 8 personnes lisant la même phrase. Chacune souligne avec son surligneur les mots qu'elle juge importants pour le sens — différemment :
- L'un surligne les noms propres
- L'autre surligne les verbes
- L'autre surligne les adjectifs descriptifs
- ...

À la fin, on **combine** les 8 surlignages pour obtenir une compréhension riche. C'est le multi-head attention.

## Exemple concret

Phrase :
> "The animal didn't cross the street because it was too tired."

Pour le mot **"it"**, à quoi il réfère ? À "the animal" ou "the street" ?

Une analyse d'attention typique d'un Transformer :

| Mot vu par "it" | Score |
|---|---|
| The | 0.05 |
| **animal** | **0.62** ← gros score, "it" → animal |
| didn't | 0.03 |
| cross | 0.12 |
| the | 0.02 |
| street | 0.10 |
| because | 0.02 |
| was | 0.02 |
| too | 0.01 |
| tired | 0.01 |

Le modèle a "compris" que `it` réfère à `animal` parce que la combinaison "tired" (qui qualifie un être animé) + "animal" se score plus haut que "tired" + "street".

Si on change la fin pour "it was too wide" :

| Mot vu par "it" | Score |
|---|---|
| animal | 0.10 |
| **street** | **0.55** ← maintenant "it" → street |

L'attention se déplace dynamiquement selon le contexte. C'est ça la magie : **résolution dynamique de la coréférence**.

### En pratique pour ton ressenti d'utilisateur

Quand tu vois un LLM "comprendre" un long contexte (lire un PDF, suivre une conversation), c'est l'attention qui fait le boulot. Quand le LLM perd le fil après 50 messages, c'est que l'attention sur les premiers tokens devient trop faible (limitation de la "context window") ou que la complexité O(n²) le pousse à oublier.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste" data-wiki-title="Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste" data-wiki-preview="L'objectif d'entraînement d'un LLM est trivialement simple : étant donné un texte, prédire le **token suivant**. Tout ce qui ressemble à de la &quot;compréhension&quot;, de la &quot;raison&quot;, du &quot;code&quot;, de la &quot;traduction&quot; émerge **comme effet de bord** de…">Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique" data-wiki-title="Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique" data-wiki-preview="Un **embedding** est la représentation d'un mot (ou phrase, image, code…) sous forme de **vecteur de quelques centaines à quelques milliers de nombres** dans un espace géométrique où **la distance entre deux vecteurs reflète la similarité s…">Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent" data-wiki-title="Concept - Les LLM génèrent token par token chacun conditionné sur le contexte précédent" data-wiki-preview="Quand un LLM &quot;écrit&quot;, il **n'a pas planifié sa réponse à l'avance** — il génère **un token à la fois**, chaque token étant la suite la plus probable étant donné **tout ce qui précède** (prompt + tokens déjà générés) — le modèle est rigoureu…">Concept - Les LLM génèrent token par token chacun conditionné sur le contexte précédent</a>

**Prérequis** :
- Notion de vecteur, dot product (intuition)
- Embeddings (concept précédent)

**S'oppose à / à comparer avec** :
- **RNN / LSTM** : architectures précédentes, lecture séquentielle, mémoire courte
- **CNN** : traite les voisins immédiats, pas longue distance
- **State Space Models (Mamba)** : alternative non-attention, prometteuse pour très long contexte

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples" data-wiki-title="Comment l'IA pense — une histoire en analogies simples" data-wiki-preview="1. Imagine une **immense bibliothèque mentale** où chaque mot, chaque idée, chaque tournure de phrase est rangée à un emplacement précis dans un espace à des milliers de dimensions. Plus deux idées sont proches, plus elles sont voisines de…">Comment l'IA pense — une histoire en analogies simples</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/ia-llms" data-wiki-title="MOC - IA &amp; LLMs" data-wiki-preview="- *(à peupler)*">MOC - IA &amp; LLMs</a>

