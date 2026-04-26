---
created: 2026-04-27T00:00:00.000Z
domain: ai
level: beginner
tags:
  - type/concept
  - domain/ai
  - level/beginner
title: >-
  Concept - Les LLM génèrent token par token chacun conditionné sur le contexte
  précédent
slug: les-llm-generent-token-par-token-chacun-conditionne-sur-le-contexte-precedent
excerpt: >-
  Comprendre la génération token-par-token désamorce plusieurs malentendus : -
  Pourquoi on parle de **streaming** : les tokens sortent au fur et à mesure,
  ils peuvent être affichés au fur et à mesure - Pourquoi un LLM peut "se
  contredire" en cours de phrase : il prédit localement,
oneLiner: >-
  Quand un LLM "écrit", il **n'a pas planifié sa réponse à l'avance** — il
  génère **un token à la fois**, chaque token étant la suite la plus probable
  étant donné **tout ce qui précède** (prompt + tokens déjà générés) — le modèle
  est rigoureusement **autorégressif**.
related:
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - >-
    apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - ia-llms
backlinks:
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
topics:
  - backend
---
## Idée en une phrase

> Quand un LLM "écrit", il **n'a pas planifié sa réponse à l'avance** — il génère **un token à la fois**, chaque token étant la suite la plus probable étant donné **tout ce qui précède** (prompt + tokens déjà générés) — le modèle est rigoureusement **autorégressif**.

## Contexte / pourquoi ça compte

Comprendre la génération token-par-token désamorce plusieurs malentendus :
- Pourquoi on parle de **streaming** : les tokens sortent au fur et à mesure, ils peuvent être affichés au fur et à mesure
- Pourquoi un LLM peut "se contredire" en cours de phrase : il prédit localement, sans vue d'ensemble
- Pourquoi le **prompt initial** influence tout : tout token après est conditionné par lui
- Pourquoi des techniques comme **chain-of-thought** marchent : forcer le modèle à écrire son raisonnement avant la réponse améliore la réponse

C'est aussi la base mécanique pour comprendre les **token limits** (context window) et les **costs** (souvent par token).

## Détails / mécanisme

### Le boucle de génération

```
prompt: "La capitale de la France est"

Étape 1 :
  Input : "La capitale de la France est"
  Modèle calcule : { "Paris": 0.85, "la": 0.08, "Rome": 0.01, ... }
  Modèle pioche : "Paris"
  Output partiel : "La capitale de la France est Paris"

Étape 2 :
  Input : "La capitale de la France est Paris"
  Modèle calcule : { ".": 0.62, ",": 0.18, " et": 0.05, ... }
  Modèle pioche : "."
  Output partiel : "La capitale de la France est Paris."

Étape 3 :
  Input : "La capitale de la France est Paris."
  Modèle calcule : { "<eos>": 0.40, "Cette": 0.15, ... }
  Modèle pioche : "<eos>"
  STOP
```

### Token, pas mot

Important : le modèle ne génère pas des **mots** mais des **tokens**. Un token peut être :
- Un mot court : `the`
- Une partie de mot : `gener`, `ation`, `s`
- Un caractère seul (rare) : `é`
- Un signe de ponctuation : `.`, `,`

La tokenization se fait via **BPE** (Byte-Pair Encoding) ou variantes. Pour Claude / GPT, ~1 token ≈ 0.75 mot anglais. Pour le français, c'est moins efficient (~1 token = 0.5 mot) à cause des accents.

### Sampling : comment piocher

À chaque étape, le modèle a une **distribution de probabilité** sur tous les tokens du vocabulaire (~100 000 - 200 000 tokens). Comment piocher ?

| Stratégie | Description | Effet |
|---|---|---|
| **Greedy** | Toujours le plus probable | Déterministe, mais répétitif |
| **Temperature** | Échelle la distribution avant softmax | T=0 → greedy ; T=1 → naturel ; T>1 → créatif/chaotique |
| **Top-k** | Pioche parmi les k tokens les + probables | Limite le nonsense |
| **Top-p (nucleus)** | Pioche parmi les tokens dont la masse cumulée ≥ p | Adaptatif |
| **Min-p** | Garde tous les tokens > min_p × max_p | Variante moderne |

L'API Claude / OpenAI expose ces paramètres. `temperature: 0` pour des réponses déterministes (code, faits). `temperature: 0.7-1.0` pour des réponses naturelles / créatives.

### Conséquence : pas de "plan global"

Le modèle ne **planifie pas** sa réponse au début. Il s'engage token par token. C'est pourquoi :

- **Quand tu lui demandes "fais-moi un poème en 4 vers qui rime"**, il peut très bien rater la rime du dernier vers parce qu'il a peint au coin avec les 3 premiers vers
- Les **techniques de prompting** comme **Chain-of-Thought** ("réfléchis étape par étape") fonctionnent parce qu'elles forcent le modèle à expliciter le raisonnement → chaque token futur est conditionné par les étapes intermédiaires
- Les modèles avec **reasoning** explicite (o1, Claude with extended thinking) raisonnent dans un buffer caché avant de produire la réponse → meilleure cohérence

### Streaming

Comme les tokens sont générés un par un, l'API peut les **streamer** au client :

```typescript
const stream = await anthropic.messages.create({
  model: 'claude-opus-4-7',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
})

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write(event.delta.text) // affiche au fur et à mesure
  }
}
```

C'est ce qui te donne la sensation que Claude "écrit" devant tes yeux. C'est un effet visuel honnête : il **génère vraiment** au fur et à mesure.

### Le coût en tokens

Comme la génération est par token, **la facturation l'est aussi** :

- **Input tokens** (ton prompt) : $1-15 / million selon le modèle
- **Output tokens** (ce que le modèle génère) : 3-5× plus cher que l'input

C'est pourquoi des techniques comme **prompt caching** (Anthropic, OpenAI) sont importantes : si ton prompt système est long et récurrent, le cacher économise.

### Le KV cache — pourquoi c'est rapide

Naïvement, à chaque token généré, tu devrais re-traiter tout le prompt. C'est O(n²). En réalité, on cache les **K** et **V** (Key, Value) de l'attention déjà calculés pour les tokens passés. Au prochain token, on n'a qu'à calculer **un nouveau pas**, pas tout reprendre. Ça rend la génération O(n) en pratique.

## Exemple concret

Voir le sampling en action :

```typescript
// Claude API en streaming
const stream = await anthropic.messages.stream({
  model: 'claude-opus-4-7',
  max_tokens: 1024,
  temperature: 0.7,
  messages: [{ role: 'user', content: 'Écris un haïku sur le printemps' }],
})

for await (const text of stream) {
  process.stdout.write(text) // tokens arrivent un par un
}

const final = await stream.finalMessage()
console.log('\n— usage:', final.usage)
// { input_tokens: 18, output_tokens: 24 }
```

À l'écran tu vois apparaître :

```
Cer  isi  er  s  blanc  s
Vent  ti  ède  qui  cares  se
Print  emps  rev  ient
```

(Avec les tokens BPE qu'on devine en arrière-plan.)

### Quand le modèle se "bloque"

Tu as peut-être vu un LLM s'engager dans une mauvaise direction et s'enfoncer :

> *"Le théorème de Pythagore, qui dit a² + b² = c²,...*

Si le modèle a, à un moment, prédit un mot un peu hors-sujet, **tous les tokens suivants** sont conditionnés sur ce mauvais mot. Il ne peut pas "revenir en arrière" pour corriger sans qu'on lui demande. D'où la stratégie de re-prompter en demandant une révision : on lui donne sa propre sortie + une demande de critique → il génère mieux.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste" data-wiki-title="Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste" data-wiki-preview="L'objectif d'entraînement d'un LLM est trivialement simple : étant donné un texte, prédire le **token suivant**. Tout ce qui ressemble à de la &quot;compréhension&quot;, de la &quot;raison&quot;, du &quot;code&quot;, de la &quot;traduction&quot; émerge **comme effet de bord** de…">Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant" data-wiki-title="Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant" data-wiki-preview="L'**attention** est le mécanisme qui, à chaque mot prédit, calcule **combien de poids accorder** à chacun des mots du contexte précédent — comme un projecteur qui éclaire les mots pertinents pour la prédiction et atténue les autres — c'est…">Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant" data-wiki-title="Concept - Apprendre c'est ajuster des milliards de poids pour mieux prédire le mot suivant" data-wiki-preview="&quot;Entraîner un LLM&quot; signifie présenter au modèle des milliards d'exemples (texte) et **ajuster mécaniquement chacun de ses paramètres** (boutons numériques, des centaines de milliards) via la **descente de gradient**, jusqu'à ce que le modèl…">Concept - Apprendre c'est ajuster des milliards de poids pour mieux prédire le mot suivant</a>

**Prérequis** :
- Notion de probabilité / distribution
- Embeddings (concept précédent)

**S'oppose à / à comparer avec** :
- **Image diffusion** (Stable Diffusion, DALL-E) : génère **toute l'image en parallèle** par dénoisage, pas autorégressif
- **Encoder-only models** (BERT) : ne génèrent pas de texte, font des classifications / embeddings
- **Mamba / SSM** : autorégressifs aussi, mais sans attention quadratique

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples" data-wiki-title="Comment l'IA pense — une histoire en analogies simples" data-wiki-preview="1. Imagine une **immense bibliothèque mentale** où chaque mot, chaque idée, chaque tournure de phrase est rangée à un emplacement précis dans un espace à des milliers de dimensions. Plus deux idées sont proches, plus elles sont voisines de…">Comment l'IA pense — une histoire en analogies simples</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/ia-llms" data-wiki-title="MOC - IA &amp; LLMs" data-wiki-preview="- *(à peupler)*">MOC - IA &amp; LLMs</a>

