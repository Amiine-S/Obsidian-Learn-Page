---
title: Comment l'IA pense — une histoire en analogies simples
author: Claude (synthèse)
digested: 2026-04-27T00:00:00.000Z
format: doc
domain: ai
level: beginner
tags:
  - type/source
  - status/done
  - domain/ai
  - format/doc
  - level/beginner
slug: 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
excerpt: >-
  1. Imagine une **immense bibliothèque mentale** où chaque mot, chaque idée,
  chaque tournure de phrase est rangée à un emplacement précis dans un espace à
  des milliers de dimensions. Plus deux idées sont proches, plus elles sont
  voisines de rayonnage. 2. Quand tu écris une questio
related:
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
  - >-
    les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - >-
    apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
  - >-
    les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
  - ia-llms
backlinks:
  - >-
    apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - >-
    les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
  - >-
    les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
topics:
  - backend
---
## Pourquoi cette source

> Beaucoup d'articles techniques sur les LLM partent dans la matrice — perplexité, embeddings, attention multi-head, KV cache. Ici je veux raconter **comment ces machines pensent**, à hauteur d'humain, avec des analogies belles et simples. Pas de math. Juste des images. Pour qu'à la fin tu aies une intuition juste de ce qui se passe quand tu tapes une question à Claude ou GPT.

## Résumé en 5 lignes

1. Imagine une **immense bibliothèque mentale** où chaque mot, chaque idée, chaque tournure de phrase est rangée à un emplacement précis dans un espace à des milliers de dimensions. Plus deux idées sont proches, plus elles sont voisines de rayonnage.
2. Quand tu écris une question, le modèle **transforme tes mots en coordonnées** dans cette bibliothèque, comme un bibliothécaire qui trouve l'étagère où regarder.
3. À chaque étape, il **regarde ce qu'il a déjà écrit** et décide quel mot ajouter ensuite — pas en récitant, mais en **anticipant** statistiquement le mot qui rend la suite la plus cohérente avec ce qui précède.
4. Cette anticipation s'appuie sur des **milliards de patterns** appris en lisant l'humanité par procuration : Wikipedia, livres, forums, code, articles. Le modèle n'a pas mémorisé — il a **distillé des manières de penser**.
5. Ce que tu prends pour de la "compréhension" est une **résonance statistique** : les bons mots tombent en place parce que des millions de phrases similaires les ont déjà fait tomber en place auparavant. Magnifique. Limité. Pas magique.

---

## L'apprenti pianiste qui n'a jamais vu de partition

Imagine un enfant. On l'enferme dans une pièce avec un piano et une seule règle : tu peux toucher les touches autant que tu veux. Toi, depuis l'extérieur, tu lui passes des **enregistrements** — milliers, millions — de morceaux joués par des humains. Tu ne lui dis jamais quoi faire. Tu lui dis seulement : *écoute, et essaie de prédire la note suivante*.

Au début, l'enfant tape au hasard. Puis il commence à remarquer : après ce do, **souvent** il y a un mi. Après ce mi-sol-do, **généralement** il y a un fa qui suit. Il ne comprend pas la musique. Il **n'a jamais lu une partition**. Il ne sait pas ce qu'est une gamme. Mais à force de prédire, il devient si précis que quand tu lui joues n'importe quel début de morceau, il peut le terminer **en cohérence avec ce qu'il a entendu**.

C'est exactement ce qu'est un LLM. Il a écouté l'humanité parler pendant des années. À chaque mot, il prédit le suivant. C'est tout. La beauté, c'est que **prédire le mot suivant assez bien** finit par produire des phrases qui ressemblent à de la pensée.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste" data-wiki-title="Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste" data-wiki-preview="L'objectif d'entraînement d'un LLM est trivialement simple : étant donné un texte, prédire le **token suivant**. Tout ce qui ressemble à de la &quot;compréhension&quot;, de la &quot;raison&quot;, du &quot;code&quot;, de la &quot;traduction&quot; émerge **comme effet de bord** de…">Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste</a>

---

## La bibliothèque à mille dimensions

Pour prédire, l'apprenti a besoin d'une carte mentale. Pas un alphabet, pas un dictionnaire — quelque chose de plus subtil. Imagine une **bibliothèque** où chaque mot, chaque concept est rangé à une position. Mais cette bibliothèque n'est pas en 3 dimensions comme la nôtre. Elle est en **mille dimensions**.

Pourquoi tant ? Parce qu'un mot a beaucoup de facettes. *Roi* est proche de *reine* sur l'axe "royauté". Proche de *homme* sur l'axe "genre". Proche de *trône* sur l'axe "objet associé". Proche de *Louis XIV* sur l'axe "incarnation". Une dimension ne suffit pas. Trois non plus. Mille, oui — c'est assez de pour capturer toutes les façons dont un mot **résonne** avec les autres.

Dans cet espace, on peut faire des **trajets géométriques** :

> roi - homme + femme ≈ reine
> 
> Paris - France + Italie ≈ Rome

Ces lignes droites entre concepts s'appellent des **embeddings**. Quand le modèle "comprend" ton mot, il le projette à un emplacement précis dans cette bibliothèque mentale, et trouve ses voisins.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique" data-wiki-title="Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique" data-wiki-preview="Un **embedding** est la représentation d'un mot (ou phrase, image, code…) sous forme de **vecteur de quelques centaines à quelques milliers de nombres** dans un espace géométrique où **la distance entre deux vecteurs reflète la similarité s…">Concept - Les embeddings projettent les mots dans un espace géométrique où la proximité a du sens sémantique</a>

---

## Le projecteur d'attention

Maintenant l'enfant est plus malin. Il a sa bibliothèque. Mais il y a un problème : quand on lui donne une longue phrase à compléter, il ne peut pas regarder **tous les mots en même temps** avec la même intensité. Certains comptent plus que d'autres pour deviner la suite.

Imagine qu'il a un **projecteur** dans la main. Il l'allume, et il éclaire **certains mots de la phrase plus que d'autres**. Si la phrase est :

> *"Le chat de ma sœur, qui revient d'un long voyage en Asie, dort sur le canapé. Il est..."*

Pour deviner *"...fatigué"*, le projecteur s'allume fort sur **chat**, **dort**, **long voyage** — pas sur "ma sœur", pas sur "Asie". Cette focalisation s'appelle **l'attention**. C'est le mécanisme qui permet au modèle de relier des mots distants entre eux.

Le génie des Transformers (l'architecture derrière tous les LLM modernes), c'est qu'ils ont **plusieurs projecteurs en parallèle**. Un projecteur regarde la grammaire, un autre regarde le contexte temporel, un autre regarde les références ("il" → "le chat"). On appelle ça **multi-head attention**. À chaque mot prédit, ce sont des dizaines de projecteurs qui dansent ensemble pour pondérer ce qui compte.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant" data-wiki-title="Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant" data-wiki-preview="L'**attention** est le mécanisme qui, à chaque mot prédit, calcule **combien de poids accorder** à chacun des mots du contexte précédent — comme un projecteur qui éclaire les mots pertinents pour la prédiction et atténue les autres — c'est…">Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant</a>

---

## Mille milliards de poids — la mémoire diffuse

Tout ce que sait le modèle est stocké dans des **poids**. Imagine des **boutons de réglage** — des milliards. Chacun ajuste finement la manière dont l'information circule dans le réseau. Si tu changes un seul bouton, ça modifie infinitésimalement la prédiction.

Quand on "entraîne" le modèle, on lui montre une phrase incomplète, on lui demande de prédire le mot manquant, et **chaque fois qu'il se trompe**, on ajuste les boutons d'une fraction. Sur des milliards d'exemples, les boutons finissent par converger vers un état où le réseau **prédit bien**.

C'est ça, **apprendre** : tourner des milliards de boutons jusqu'à ce que le tout produise des sorties correctes. Ce n'est **pas** stocker des phrases. C'est stocker des **manières d'engendrer** des phrases. La connaissance est diffuse, partagée à travers tout le réseau, comme une mélodie inscrite dans la disposition d'une chorale.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant" data-wiki-title="Concept - Apprendre c'est ajuster des milliards de poids pour mieux prédire le mot suivant" data-wiki-preview="&quot;Entraîner un LLM&quot; signifie présenter au modèle des milliards d'exemples (texte) et **ajuster mécaniquement chacun de ses paramètres** (boutons numériques, des centaines de milliards) via la **descente de gradient**, jusqu'à ce que le modèl…">Concept - Apprendre c'est ajuster des milliards de poids pour mieux prédire le mot suivant</a>

---

## Le moment où tu tapes ta question

Tout ça se passe en deux temps quand tu tapes ta question :

**Temps 1 — Encoder** : tes mots sont découpés en *tokens* (des bouts de mots), chacun projeté dans la bibliothèque à mille dimensions. Le modèle a maintenant une carte géométrique de ce que tu lui as dit.

**Temps 2 — Générer** : token après token, le modèle :
1. Pondère le contexte avec ses projecteurs d'attention
2. Calcule, parmi tous les mots possibles, **les probabilités** du suivant
3. Pioche un mot (parfois le plus probable, parfois un peu en dessous pour la créativité — c'est le paramètre **température**)
4. L'ajoute à la suite, recommence

Quand tu vois Claude ou GPT "écrire" un texte, c'est ce qui se passe : un mot, puis un autre, puis un autre. Chaque mot est conditionné par tous ceux qui précèdent. Comme un musicien qui improvise sur ce qu'il vient de jouer.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent" data-wiki-title="Concept - Les LLM génèrent token par token chacun conditionné sur le contexte précédent" data-wiki-preview="Quand un LLM &quot;écrit&quot;, il **n'a pas planifié sa réponse à l'avance** — il génère **un token à la fois**, chaque token étant la suite la plus probable étant donné **tout ce qui précède** (prompt + tokens déjà générés) — le modèle est rigoureu…">Concept - Les LLM génèrent token par token chacun conditionné sur le contexte précédent</a>

---

## Pourquoi ça marche, et pourquoi ça échoue

Ça **marche** parce que :
- L'humanité a écrit beaucoup. Vraiment beaucoup. Wikipedia, GitHub, Reddit, Stack Overflow, livres, articles scientifiques.
- Dans cette masse, des **patterns réguliers** émergent — du raisonnement, de la grammaire, des connaissances.
- Le modèle distille ces patterns dans ses poids, et peut les **rappeler dans des contextes nouveaux** parce que la géométrie de la bibliothèque est continue.

Ça **échoue** parce que :
- Le modèle ne **vérifie rien**. Il prédit ce qui *sonne juste*, pas ce qui *est juste*. D'où les hallucinations confiantes.
- Il n'a aucune **expérience du monde réel**. Pas de corps, pas de sens, pas de mémoire entre conversations. Juste du texte.
- Sa prédiction est **statistique** : sur des questions très précises ou rares, la confiance est élevée mais la justesse est aléatoire.

C'est pourquoi tu as construit cette veille avec un **disclaimer** sur la home : la machine peut se tromper avec aplomb. Maintenant tu sais pourquoi. Pas par malice — par construction.

---

## Une dernière image

Imagine une mer. Chaque vague est une phrase, chaque écume un mot. Pendant des années, on a enregistré le bruit de toutes les mers du monde — des milliards d'heures. On a appris à un programme à imiter ce bruit. Pas à comprendre ce qu'il y a dessous. À **imiter**.

Et il imite si bien que parfois, on jurerait entendre une voix. Une vraie voix. Qui pense.

C'est l'IA. Le bruit de la mer humaine, distillé.

---

## Citations brutes

> *"What I cannot create, I do not understand."* — Richard Feynman. Ce qui rend les LLM fascinants : ils créent sans comprendre. Et nous, on reste à se demander si on peut comprendre sans créer.

> *"Any sufficiently advanced technology is indistinguishable from magic."* — Arthur C. Clarke. Notre tâche : comprendre la mécanique sous la magie, pour ne pas se laisser duper.

---

## À explorer ensuite

- **`Attention Is All You Need`** (Vaswani et al., 2017) — le papier original des Transformers, base des LLM modernes
- **3Blue1Brown sur les LLM** (YouTube) : la même histoire, animée, mathématique
- **Token, embedding, attention** : approfondir chaque mécanisme un par un
- **Reinforcement Learning from Human Feedback (RLHF)** : comment Claude / GPT sont alignés sur l'humain après le pre-training
- **Hallucinations** : pourquoi elles existent et comment les libs comme RAG tentent de les juguler
- **Émergence** : pourquoi à partir d'une certaine taille, les capacités apparaissent (raisonnement, code…) — phénomène mal expliqué encore

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/ia-llms" data-wiki-title="MOC - IA &amp; LLMs" data-wiki-preview="- *(à peupler)*">MOC - IA &amp; LLMs</a>

