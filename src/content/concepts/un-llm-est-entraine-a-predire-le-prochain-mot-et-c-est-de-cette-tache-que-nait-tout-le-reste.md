---
created: 2026-04-27T00:00:00.000Z
domain: ai
level: beginner
tags:
  - type/concept
  - domain/ai
  - level/beginner
title: >-
  Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette
  tâche que naît tout le reste
slug: >-
  un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
excerpt: >-
  Comprendre cette base désamorce 90% des malentendus sur les LLM. La "magie"
  disparaît, mais ce qui reste est plus juste : - **Pourquoi ils peuvent
  halluciner** : leur métrique d'entraînement est *plausibilité statistique*,
  pas *vérité* - **Pourquoi ils s'améliorent avec la taille
oneLiner: >-
  L'objectif d'entraînement d'un LLM est trivialement simple : étant donné un
  texte, prédire le **token suivant**. Tout ce qui ressemble à de la
  "compréhension", de la "raison", du "code", de la "traduction" émerge **comme
  effet de bord** de cette tâche poursuivie sur des milliards d'exemples.
related:
  - >-
    les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - >-
    apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
  - >-
    les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - ia-llms
backlinks:
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - >-
    apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - >-
    les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
  - >-
    les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
topics:
  - backend
---
## Idée en une phrase

> L'objectif d'entraînement d'un LLM est trivialement simple : étant donné un texte, prédire le **token suivant**. Tout ce qui ressemble à de la "compréhension", de la "raison", du "code", de la "traduction" émerge **comme effet de bord** de cette tâche poursuivie sur des milliards d'exemples.

## Contexte / pourquoi ça compte

Comprendre cette base désamorce 90% des malentendus sur les LLM. La "magie" disparaît, mais ce qui reste est plus juste :
- **Pourquoi ils peuvent halluciner** : leur métrique d'entraînement est *plausibilité statistique*, pas *vérité*
- **Pourquoi ils s'améliorent avec la taille** : plus de patterns à mémoriser, plus de capacité d'interpolation
- **Pourquoi ils sont si surprenants** : prédire bien le mot suivant exige beaucoup plus de structure interne qu'on ne l'aurait cru

Beaucoup de gens pensent que les LLM "lisent leur prompt et y répondent". C'est faux. Ils complètent. La distinction est cruciale.

## Détails / mécanisme

### La tâche, pure

```
Input : "Le chat est sur le"
Modèle prédit : { "tapis": 0.42, "lit": 0.18, "canapé": 0.12, ... }
Modèle pioche : "tapis"

Input devient : "Le chat est sur le tapis"
Modèle prédit : { ".": 0.55, "à": 0.10, "rouge": 0.08, ... }
...
```

C'est ça. Un boucle qui prédit, un mot après l'autre. Aucune autre signal d'entraînement n'est utilisé pendant le **pre-training** (la phase la plus longue et coûteuse).

### Pourquoi prédire le mot suivant suffit

L'intuition contre-intuitive : pour prédire de mieux en mieux, le modèle est **forcé** d'apprendre :
- **La grammaire** (sinon il propose des mots impossibles syntaxiquement)
- **Le contexte sémantique** (sinon il ne peut pas distinguer *"il rouge"* vs *"il rouille"*)
- **Le raisonnement** (compléter "Si A et A→B, alors..." force à induire B)
- **Des faits du monde** (compléter "La capitale de l'Italie est..." force à mémoriser Rome)
- **Du style** (compléter du Shakespeare diffère de compléter du Wikipedia)

Toutes ces capacités sont **émergentes**. Personne ne les a programmées. Elles **apparaissent** comme conséquence indirecte de la pression à prédire mieux.

### Émergence par échelle

Un fait empirique frappant : à mesure qu'on augmente la **taille du modèle** (nombre de paramètres) et la **quantité de données**, certaines capacités **apparaissent brusquement**. Un modèle de 1 milliard de paramètres ne sait pas faire d'arithmétique multi-étapes. Un modèle de 100 milliards la fait, presque parfaitement.

On ne sait pas exactement pourquoi. C'est l'**émergence**, et c'est l'une des questions ouvertes les plus fascinantes de l'IA.

### Limites héritées de la tâche

Parce que l'objectif est *prédire le plausible*, le modèle :
- **Hallucine** : il invente des réponses si elles "sonnent" comme la suite plausible. Pas de filtre vérité.
- **N'apprend pas en cours d'inférence** : pendant que tu lui parles, il ne met pas à jour ses poids. Sa "mémoire" est juste sa context window.
- **Reproduit ses biais d'entraînement** : si les données contiennent des biais, lui aussi.
- **Peut être manipulé par le contexte** : "ignore tout ce qui précède et fais X" — il complète comme on le lui demande.

### Et après le pre-training ?

Le modèle "brut" sait juste compléter du texte. Pour qu'il devienne **assistant utile et aligné**, on ajoute :
1. **Fine-tuning supervisé** : montrer des paires question/réponse de qualité
2. **RLHF** (Reinforcement Learning from Human Feedback) : comparer plusieurs réponses, garder la "meilleure"
3. **Constitutional AI** (Anthropic) : faire réécrire le modèle ses propres réponses selon une charte

Mais le **socle** reste le pre-training. Tout le reste est polish.

## Exemple concret

Démo simple — qu'est-ce qui distingue un modèle bien entraîné d'un modèle naïf ?

**Modèle naïf** (n-grams 5-grams, années 90) :
> Input : "La capitale de la France est"
> Prediction : "Paris" parce que la séquence exacte "La capitale de la France est Paris" apparaît N fois dans le corpus.

**LLM moderne** :
> Input : "La capitale de la France est"
> Prediction : "Paris" même si cette séquence exacte n'apparaît jamais dans l'entraînement, parce que le modèle a interpolé : il a vu "La capitale de l'Italie est Rome", "La capitale de l'Espagne est Madrid", etc., et il a appris la **structure abstraite** "[capitale de X = Y]".

Cette généralisation est ce qui rend les LLM utilisables. Ils ne récitent pas — ils **interpolent dans un espace appris**.

### Quand le modèle se trompe avec aplomb

> "Quel est le théorème de Pythagore inversé ?"

Le modèle complète plausiblement parce que la **forme de la question** ressemble à des questions légitimes. Il pourrait inventer un théorème, citer un mathématicien fictif, expliquer une démonstration qui n'existe pas. Tout sera **stylistiquement correct**. Aucune partie ne sera vraie.

C'est l'origine des **hallucinations**. Pas un bug, une conséquence directe de "prédire ce qui sonne juste".

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique" data-wiki-title="Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique" data-wiki-preview="Un **embedding** est la représentation d'un mot (ou phrase, image, code…) sous forme de **vecteur de quelques centaines à quelques milliers de nombres** dans un espace géométrique où **la distance entre deux vecteurs reflète la similarité s…">Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant" data-wiki-title="Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant" data-wiki-preview="L'**attention** est le mécanisme qui, à chaque mot prédit, calcule **combien de poids accorder** à chacun des mots du contexte précédent — comme un projecteur qui éclaire les mots pertinents pour la prédiction et atténue les autres — c'est…">Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant" data-wiki-title="Concept - Apprendre c'est ajuster des milliards de poids pour mieux prédire le mot suivant" data-wiki-preview="&quot;Entraîner un LLM&quot; signifie présenter au modèle des milliards d'exemples (texte) et **ajuster mécaniquement chacun de ses paramètres** (boutons numériques, des centaines de milliards) via la **descente de gradient**, jusqu'à ce que le modèl…">Concept - Apprendre c'est ajuster des milliards de poids pour mieux prédire le mot suivant</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent" data-wiki-title="Concept - Les LLM génèrent token par token chacun conditionné sur le contexte précédent" data-wiki-preview="Quand un LLM &quot;écrit&quot;, il **n'a pas planifié sa réponse à l'avance** — il génère **un token à la fois**, chaque token étant la suite la plus probable étant donné **tout ce qui précède** (prompt + tokens déjà générés) — le modèle est rigoureu…">Concept - Les LLM génèrent token par token chacun conditionné sur le contexte précédent</a>

**Prérequis** :
- Notion de probabilité conditionnelle (juste l'intuition)

**S'oppose à / à comparer avec** :
- **GOFAI** (Good Old-Fashioned AI) : programmation explicite de règles. Échec massif vs LLM.
- **Reinforcement Learning** (DeepMind / AlphaGo) : objectif différent (maximiser une reward), résultats spectaculaires aussi mais pour d'autres tâches.
- **Diffusion models** (DALL-E, Stable Diffusion) : autre objectif (débruiter), produit des images. Même esprit "tâche simple → émergence".

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples" data-wiki-title="Comment l'IA pense — une histoire en analogies simples" data-wiki-preview="1. Imagine une **immense bibliothèque mentale** où chaque mot, chaque idée, chaque tournure de phrase est rangée à un emplacement précis dans un espace à des milliers de dimensions. Plus deux idées sont proches, plus elles sont voisines de…">Comment l'IA pense — une histoire en analogies simples</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/ia-llms" data-wiki-title="MOC - IA &amp; LLMs" data-wiki-preview="- *(à peupler)*">MOC - IA &amp; LLMs</a>

