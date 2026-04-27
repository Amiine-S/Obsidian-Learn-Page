---
created: '2026-04-26T15:44:56.681Z'
domain: architecture
level: beginner
tags:
  - type/concept
  - domain/architecture
  - level/beginner
title: >-
  Concept - Programmation impérative décrit comment quand le déclaratif décrit
  quoi
slug: programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi
excerpt: >-
  C'est le critère structurant qui sépare beaucoup d'outils modernes de leurs
  ancêtres : - jQuery (impératif) → React (déclaratif) - Bash scripts
  (impératif) → Terraform (déclaratif) - callbacks (impératif) → Effect / RxJS
  (déclaratif)
oneLiner: >-
  La distinction **impératif vs déclaratif** est une question de **niveau
  d'abstraction** : un programme impératif décrit **les étapes** à exécuter
  (mutations, séquence, contrôle de flux), un programme déclaratif décrit **le
  résultat voulu** et délègue les étapes à un moteur — c'est un curseur, pas une
  dichotomie.
related:
  - le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent
  - solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux
  - httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end
  - 2026-04-26-programmation-imperative-vs-declarative
  - architecture-fondamentaux
backlinks:
  - 2026-04-26-programmation-imperative-vs-declarative
  - la-composition-de-fonctions-chaine-des-transformations-en-pipeline
  - le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent
  - architecture-fondamentaux
topics:
  - architecture
---
## Idée en une phrase

> La distinction **impératif vs déclaratif** est une question de **niveau d'abstraction** : un programme impératif décrit **les étapes** à exécuter (mutations, séquence, contrôle de flux), un programme déclaratif décrit **le résultat voulu** et délègue les étapes à un moteur — c'est un curseur, pas une dichotomie.

## Contexte / pourquoi ça compte

C'est le critère structurant qui sépare beaucoup d'outils modernes de leurs ancêtres :
- jQuery (impératif) → React (déclaratif)
- Bash scripts (impératif) → Terraform (déclaratif)
- callbacks (impératif) → Effect / RxJS (déclaratif)

Comprendre où se situe un outil sur le spectre te permet de :
- Choisir entre deux outils pour un même besoin
- Reconnaître quand une abstraction "fuit" (un moteur déclaratif qui demande quand même de raisonner impérativement)
- Décider à quel niveau écrire ton propre code (souvent : déclaratif au top, impératif au fond)

## Détails / mécanisme

### Définitions

| Style | Tu écris... | Exécution |
|---|---|---|
| Impératif | Une **suite d'instructions** qui mutent un état | Fait littéralement ce que tu écris |
| Déclaratif | Une **description du résultat voulu** ou des **relations** | Un moteur traduit la description en exécution |

### Exemple parallèle

**Impératif** :
```typescript
function evens(arr: number[]): number[] {
  const out: number[] = []
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) {
      out.push(arr[i])
    }
  }
  return out
}
```

Tu décris : la boucle, l'index, la condition, le push.

**Déclaratif** :
```typescript
const evens = (arr: number[]) => arr.filter(x => x % 2 === 0)
```

Tu décris : "ce sont les éléments pairs de `arr`."

### Le spectre concret

```
   ←───────  IMPÉRATIF                       DÉCLARATIF  ───────→
   
   ASM     C/Java     for-loop TS    array.map    React    SQL    Prolog
                        |__________________|
                        zone "moderne usuelle"
```

Note bien : **`array.map` n'est pas pur déclaratif**. Tu spécifies une fonction qui sera appelée sur chaque élément (= une étape, dans l'ordre). C'est juste **plus déclaratif** que la `for` loop.

### Frontières floues

Beaucoup d'outils mélangent les deux :

```typescript
// React JSX = déclaratif (l'arbre voulu)
return <div>{users.filter(u => u.active).map(u => <User key={u.id} {...u} />)}</div>

// Mais l'intérieur des handlers est impératif
function onClick() {
  setCount(c => c + 1) // mutation explicite
  fetch('/api/event')   // séquence d'actions
}
```

C'est **normal et souhaitable**. Le déclaratif domine la **structure**, l'impératif gère les **événements ponctuels**.

### Question à se poser face à un outil

> "Qu'est-ce que je décris ? Le **chemin** ou la **destination** ?"

- Tu écris une recette pas-à-pas → impératif
- Tu écris une carte du résultat → déclaratif

## Exemple concret

Une feature : "afficher la liste des users actifs, triée par date de création."

**Impératif** :
```typescript
async function display() {
  const all = await db.query("SELECT * FROM users")
  const active = []
  for (const u of all) {
    if (u.active) active.push(u)
  }
  active.sort((a, b) => a.createdAt - b.createdAt)
  
  const list = document.getElementById("list")!
  list.innerHTML = ""
  for (const u of active) {
    const li = document.createElement("li")
    li.textContent = u.name
    list.appendChild(li)
  }
}
```

**Déclaratif** (mix React + SQL) :
```sql
SELECT * FROM users WHERE active = true ORDER BY created_at;
```

```jsx
<ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
```

Le second est plus court, plus lisible, plus refactorable. Le premier garde plus de contrôle (tu sais exactement quoi se passe à chaque step).

## Connexions

**Concepts liés** :
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent" data-wiki-title="Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent" data-wiki-preview="Programmer en déclaratif ne fait pas disparaître la complexité de l'exécution — ça **la déplace** vers le moteur (compilateur, runtime, query planner) — donc plus le moteur est puissant, plus le déclaratif est utilisable, et plus son **abst…">Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent</a>
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/solidjs-execute-son-composant-une-seule-fois-et-lie-le-dom-aux-signaux" data-wiki-title="Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux" data-wiki-preview="En SolidJS, **le corps du composant est exécuté une seule fois** au montage : son rôle est de **construire le DOM** et d'**y attacher des bindings réactifs aux signals** — les mises à jour ultérieures contournent complètement le composant.">Concept - SolidJS exécute son composant une seule fois et lie le DOM aux signaux</a> *(React/Solid sont déclaratifs en intent)*
- <a class="wikilink" href="/Obsidian-Learn-Page/concepts/httpapi-decrit-un-serveur-effect-ts-comme-un-schema-type-end-to-end" data-wiki-title="Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end" data-wiki-preview="`HttpApi` est une **description déclarative** de la surface d'une API : pour chaque endpoint, tu déclares la méthode, le path, les schémas (path, query, body, response, erreurs) — cette spec devient une **source unique de vérité** dont sont…">Concept - HttpApi décrit un serveur Effect-TS comme un schéma typé end-to-end</a> *(API déclarative)*

**Prérequis** :
- Notion de base d'un programme et d'instructions

**S'oppose à / à comparer avec** :
- **OOP vs FP** — distinction orthogonale, pas la même chose. Tu peux faire de la FP impérative (mutations dans des closures), de l'OOP déclarative (rare, mais Smalltalk-like)
- **Statique vs dynamique** — encore une autre distinction (typage), n'a rien à voir

## Sources

- <a class="wikilink" href="/Obsidian-Learn-Page/sources/2026-04-26-programmation-imperative-vs-declarative" data-wiki-title="Programmation impérative vs déclarative" data-wiki-preview="1. **Impératif** = &quot;comment&quot; : tu décris **les étapes** que la machine doit exécuter (boucles, mutations, séquences). Proche du modèle CPU. 2. **Déclaratif** = &quot;quoi&quot; : tu décris **le résultat voulu** ; un moteur sous-jacent calcule comment…">Programmation impérative vs déclarative</a>

## MOC

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation - Concept - Le currying transforme une fonction n-aire en chaîne unaire - Concept - La composition de fon…">MOC - Architecture &amp; Fondamentaux</a>

