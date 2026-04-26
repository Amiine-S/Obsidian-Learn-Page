---
created: 2026-04-27T00:00:00.000Z
domain: ai
level: beginner
tags:
  - type/concept
  - domain/ai
  - level/beginner
title: >-
  Concept - Les embeddings projettent les mots dans un espace géométrique où la
  proximité a du sens sémantique
slug: >-
  les-embeddings-projettent-les-mots-dans-un-espace-geometrique-ou-la-proximite-a-du-sens-semantique
excerpt: >-
  C'est la première transformation qu'opère un LLM sur ton texte. Avant tout
  calcul d'attention ou de prédiction, chaque token de ta phrase est **projeté**
  dans cet espace de mille dimensions. Sans embeddings, le modèle ne pourrait
  pas généraliser : il verrait *roi* et *reine* comm
oneLiner: >-
  Un **embedding** est la représentation d'un mot (ou phrase, image, code…) sous
  forme de **vecteur de quelques centaines à quelques milliers de nombres** dans
  un espace géométrique où **la distance entre deux vecteurs reflète la
  similarité sémantique** — *roi* et *reine* sont voisins, *roi* et *banane*
  sont éloignés.
related:
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - ia-llms
backlinks:
  - 2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples
  - >-
    apprendre-c-est-ajuster-des-milliards-de-poids-pour-mieux-predire-le-mot-suivant
  - >-
    l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant
  - >-
    un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste
topics:
  - backend
---
## Idée en une phrase

> Un **embedding** est la représentation d'un mot (ou phrase, image, code…) sous forme de **vecteur de quelques centaines à quelques milliers de nombres** dans un espace géométrique où **la distance entre deux vecteurs reflète la similarité sémantique** — *roi* et *reine* sont voisins, *roi* et *banane* sont éloignés.

## Contexte / pourquoi ça compte

C'est la première transformation qu'opère un LLM sur ton texte. Avant tout calcul d'attention ou de prédiction, chaque token de ta phrase est **projeté** dans cet espace de mille dimensions. Sans embeddings, le modèle ne pourrait pas généraliser : il verrait *roi* et *reine* comme deux symboles sans rapport.

Comprendre les embeddings te permet aussi de comprendre :
- Pourquoi la **recherche sémantique** marche (cosinus similarité entre query et docs)
- Comment fonctionne **RAG** (Retrieval-Augmented Generation) : on cherche les docs proches sémantiquement de la question, on les fournit au LLM
- Pourquoi des modèles comme `text-embedding-3-small` (OpenAI) ou `voyage-3` existent comme produits indépendants des LLM

## Détails / mécanisme

### La géométrie de la signification

Imagine un espace à 1536 dimensions (taille typique d'un embedding 2026). Chaque mot a une coordonnée dans cet espace. Les mots de sens proche sont voisins :

```
[chat]    → [0.12, -0.34, 0.55, ..., 0.21]   (1536 valeurs)
[chien]   → [0.15, -0.32, 0.51, ..., 0.19]   ← proche de [chat]
[avion]   → [-0.42, 0.18, 0.05, ..., 0.78]  ← loin de [chat]
```

La **similarité cosinus** mesure cet angle entre vecteurs :

```python
similarity(chat, chien)  # 0.87 — proches
similarity(chat, avion)  # 0.12 — éloignés
```

### L'arithmétique des concepts

Dans cet espace géométrique, on peut faire des **opérations vectorielles** dont le résultat a du sens :

```
roi - homme + femme ≈ reine
Paris - France + Italie ≈ Rome
chien - cri + miaule ≈ chat
```

C'est le test fameux des embeddings (Word2Vec, 2013). Ça ne marche pas parfaitement à chaque fois, mais souvent assez pour être bluffant.

### Comment on entraîne ça

Pour Word2Vec (l'origine, 2013) : prendre un mot, masquer son contexte, demander au modèle de prédire les mots voisins. À force, les mots qui apparaissent dans des contextes similaires se retrouvent proches dans l'espace.

Pour les LLM modernes : les embeddings sont appris **conjointement** avec le reste du modèle pendant le pre-training (toujours via la tâche "prédire le mot suivant"). Ils sortent naturellement de l'optimisation.

### Pas seulement les mots

L'idée s'étend bien au-delà :
- **Phrases** : `text-embedding-3-large` te donne un vecteur par phrase entière
- **Images** : CLIP (OpenAI) embed images et textes dans le **même** espace → recherche d'image par texte
- **Code** : `voyage-code-3` embed du code, recherche de fonctions par description naturelle
- **Multimodal** : modèles récents (Gemini, Claude 3.5+) embed texte+image+audio dans un espace unifié

### Cas d'usage : recherche sémantique

```typescript
// 1. Pré-calculer les embeddings de tes documents
for (const doc of docs) {
  doc.embedding = await openai.embeddings.create({ input: doc.text, model: 'text-embedding-3-small' })
}
// Stocker dans une vector DB (Pinecone, Weaviate, pgvector, qdrant)

// 2. Au moment de la requête
const query = "comment gérer les erreurs en TypeScript ?"
const queryEmbedding = await openai.embeddings.create({ input: query })

// 3. Trouver les docs les plus proches (cosinus similarité)
const matches = vectorDb.search(queryEmbedding, { topK: 5 })

// 4. Fournir au LLM le contexte trouvé (RAG)
const answer = await claude.complete({
  prompt: `Contexte: ${matches.map(m => m.text).join('\n')}\n\nQuestion: ${query}`
})
```

C'est ainsi que fonctionnent les "chat with your docs" type Notion AI, Mendable, Vercel AI SDK chatbots.

## Exemple concret

Démo en TS :

```typescript
import OpenAI from 'openai'
const openai = new OpenAI()

async function similarity(a: string, b: string): Promise<number> {
  const [ea, eb] = await Promise.all([
    openai.embeddings.create({ input: a, model: 'text-embedding-3-small' }),
    openai.embeddings.create({ input: b, model: 'text-embedding-3-small' }),
  ])
  return cosineSim(ea.data[0].embedding, eb.data[0].embedding)
}

await similarity('chat', 'chien')          // ~0.85
await similarity('chat', 'avion')          // ~0.15
await similarity('king is to man', 'queen is to woman') // ~0.95
```

```typescript
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    ma += a[i] * a[i]
    mb += b[i] * b[i]
  }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb))
}
```

### Ce que les embeddings ne font pas

- Ils **ne comprennent pas** le sens. Ils encodent une **co-occurrence statistique**.
- Ils sont **biaisés** comme leurs données d'entraînement. *infirmier/infirmière* peut être lié au genre dans des proportions discutables.
- Ils ont une **fenêtre limitée** : `text-embedding-3-small` plafonne à ~8000 tokens d'input. Pour un long doc, on chunke et embed chaque morceau.

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/un-llm-est-entraine-a-predire-le-prochain-mot-et-c-est-de-cette-tache-que-nait-tout-le-reste" data-wiki-title="Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste" data-wiki-preview="L'objectif d'entraînement d'un LLM est trivialement simple : étant donné un texte, prédire le **token suivant**. Tout ce qui ressemble à de la &quot;compréhension&quot;, de la &quot;raison&quot;, du &quot;code&quot;, de la &quot;traduction&quot; émerge **comme effet de bord** de…">Concept - Un LLM est entraîné à prédire le prochain mot et c'est de cette tâche que naît tout le reste</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/l-attention-permet-au-modele-de-regarder-certains-mots-plus-que-d-autres-pour-predire-le-suivant" data-wiki-title="Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant" data-wiki-preview="L'**attention** est le mécanisme qui, à chaque mot prédit, calcule **combien de poids accorder** à chacun des mots du contexte précédent — comme un projecteur qui éclaire les mots pertinents pour la prédiction et atténue les autres — c'est…">Concept - L'attention permet au modèle de regarder certains mots plus que d'autres pour prédire le suivant</a>

**Prérequis** :
- Notion de vecteur, distance, dot product (intuition suffit)

**S'oppose à / à comparer avec** :
- **One-hot encoding** : chaque mot est un vecteur orthogonal aux autres. Pas de notion de proximité. Obsolète.
- **TF-IDF** : représentations basées sur fréquence. Bonne pour recherche exacte, mauvaise pour synonymes.
- **Embeddings sparse (BM25)** : compromis pour la recherche, complémentaires aux denses pour le hybrid search.

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-27-comment-l-ia-pense-une-histoire-en-analogies-simples" data-wiki-title="Comment l'IA pense — une histoire en analogies simples" data-wiki-preview="1. Imagine une **immense bibliothèque mentale** où chaque mot, chaque idée, chaque tournure de phrase est rangée à un emplacement précis dans un espace à des milliers de dimensions. Plus deux idées sont proches, plus elles sont voisines de…">Comment l'IA pense — une histoire en analogies simples</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/ia-llms" data-wiki-title="MOC - IA &amp; LLMs" data-wiki-preview="- *(à peupler)*">MOC - IA &amp; LLMs</a>

