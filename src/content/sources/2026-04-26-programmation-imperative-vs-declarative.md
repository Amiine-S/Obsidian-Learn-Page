---
title: Programmation impérative vs déclarative
author: Claude (synthèse)
digested: 2026-04-26T00:00:00.000Z
format: doc
domain: architecture
level: beginner
tags:
  - type/source
  - status/done
  - domain/architecture
  - format/doc
  - level/beginner
slug: 2026-04-26-programmation-imperative-vs-declarative
excerpt: >-
  1. **Impératif** = "comment" : tu décris **les étapes** que la machine doit
  exécuter (boucles, mutations, séquences). Proche du modèle CPU. 2.
  **Déclaratif** = "quoi" : tu décris **le résultat voulu** ; un moteur
  sous-jacent calcule comment l'atteindre. Plus proche du domaine mét
related:
  - programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi
  - le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent
  - architecture-fondamentaux
backlinks:
  - le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent
  - programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi
topics:
  - architecture
---

# Programmation impérative vs déclarative

## Pourquoi cette source

> Comprendre la distinction **impératif vs déclaratif** : ce que ça veut vraiment dire, où se cachent les frontières, et pourquoi c'est devenu **le critère de choix** pour beaucoup d'outils modernes (React, SQL, Rx, Effect-TS, Terraform). La distinction n'est pas binaire — c'est **un curseur** que tu déplaces selon le coût/bénéfice.

## Résumé en 5 lignes

1. **Impératif** = "comment" : tu décris **les étapes** que la machine doit exécuter (boucles, mutations, séquences). Proche du modèle CPU.
2. **Déclaratif** = "quoi" : tu décris **le résultat voulu** ; un moteur sous-jacent calcule comment l'atteindre. Plus proche du domaine métier.
3. C'est un **spectre**, pas une dichotomie. SQL est très déclaratif. Une regex aussi. Une `for` loop est très impérative. `array.map` est intermédiaire — déclaratif côté contrat, impératif côté implémentation.
4. **Avantages du déclaratif** : code plus court, moins de bugs d'état, optimisation laissée au moteur, code lu comme une intention.
5. **Limites** : performance pas toujours optimale, debug plus opaque (le "comment" est caché), apprentissage du moteur. Trop loin = abstraction qui fuite, on perd le contrôle quand ça compte.

---

## 1. Définitions

### Impératif

Tu donnes à la machine **une suite d'instructions** qui changent l'état du programme. C'est le paradigme natif de toutes les machines (CPU = automate à état).

```typescript
// Impératif : "comment trouver les noms des users majeurs"
const result: string[] = []
for (let i = 0; i < users.length; i++) {
  if (users[i].age >= 18) {
    result.push(users[i].name)
  }
}
```

Tu écris : la boucle, l'index, la condition, le push, la mutation du tableau résultat.

### Déclaratif

Tu décris **ce que tu veux**, sans décrire comment l'obtenir. Un moteur (compilateur, interpréteur, runtime) traduit ta description en exécution.

```typescript
// Déclaratif : "les noms des users majeurs"
const result = users
  .filter(u => u.age >= 18)
  .map(u => u.name)
```

Tu n'as pas écrit de boucle, pas d'index, pas de mutation. Tu as **composé** des opérations qui décrivent l'intention.

### SQL — l'archétype du déclaratif

```sql
SELECT name FROM users WHERE age >= 18 ORDER BY name LIMIT 10;
```

Tu n'as **rien** écrit sur :
- L'algorithme de sort
- L'index à utiliser
- La stratégie de fetch (sequential scan, index lookup, hash join)

L'optimiseur de la DB le fait pour toi, et le fait souvent mieux que toi.

---

## 2. Le spectre

| Niveau | Exemple | Tu écris... | La machine se charge de... |
|---|---|---|---|
| Très impératif | Assembleur, `for` brute | Chaque step, registres, jumps | Rien |
| Impératif | C, Java classique | Boucles, mutations, séquence | Allocation, instructions CPU |
| Mixte | `array.map` + state mut | Composition d'ops + quelques mutations | Itération, sometimes optimisations |
| Déclaratif | React JSX, fonctionnel pur | "Voici l'UI / la valeur voulue" | Diff, scheduling, rendering |
| Très déclaratif | SQL, Prolog, Datalog | "Voici la relation / la solution voulue" | Tout (algorithmique, optimisation, exécution) |

Le curseur se déplace **par décision de design**. Plus tu vas vers la droite, plus tu **abstraies**. Plus tu vas vers la gauche, plus tu **contrôles**.

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/programmation-imperative-decrit-comment-quand-le-declaratif-decrit-quoi" data-wiki-title="Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi" data-wiki-preview="La distinction **impératif vs déclaratif** est une question de **niveau d'abstraction** : un programme impératif décrit **les étapes** à exécuter (mutations, séquence, contrôle de flux), un programme déclaratif décrit **le résultat voulu**…">Concept - Programmation impérative décrit comment quand le déclaratif décrit quoi</a>

---

## 3. Pourquoi c'est devenu central en 2010-2025

Les outils dominants modernes sont **massivement déclaratifs** :

| Outil | Avant (impératif) | Après (déclaratif) |
|---|---|---|
| UI | jQuery (`$(...).addClass(...)`) | React (`return <div>...</div>`) |
| Data | SQL, Prolog | (déjà déclaratif depuis les 70s) |
| Async | callbacks, mutations | `RxJS`, `Effect`, `async/await` |
| Infra | shell scripts, Ansible imperatif | Terraform (state désiré), Kubernetes (manifests) |
| Build | Makefiles imperatifs | Bazel, Nix (résultat désiré) |
| Validation | `if (!x.email) throw ...` | `Schema.Struct({ email: Schema.String })` |

Pourquoi la bascule ?
- **Complexité** des systèmes augmente — l'impératif devient ingérable au-delà d'une certaine taille
- **Outils plus malins** — les moteurs déclaratifs (compilateurs, query planners) optimisent souvent mieux que l'humain
- **Concurrence / async** — le déclaratif compose mieux face au parallélisme

→ <a class="wikilink" href="/Obsidian-Learn-Page/concepts/le-declaratif-transfere-la-complexite-d-execution-au-moteur-sous-jacent" data-wiki-title="Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent" data-wiki-preview="Programmer en déclaratif ne fait pas disparaître la complexité de l'exécution — ça **la déplace** vers le moteur (compilateur, runtime, query planner) — donc plus le moteur est puissant, plus le déclaratif est utilisable, et plus son **abst…">Concept - Le déclaratif transfère la complexité d'exécution au moteur sous-jacent</a>

---

## 4. Limites du déclaratif

### Performance

Le moteur est rarement aussi optimal que du code impératif fait main. Pour un code chaud (10⁹ ops), tu as souvent intérêt à **descendre** vers l'impératif :
- Un `for` loop bat un `array.map().filter().reduce()` chaîné
- Une JOIN SQL peut être catastrophique si l'optimiseur se trompe — parfois on doit `EXPLAIN` et hint

### Debug

```typescript
users.filter(...).map(...).flatMap(...).reduce(...)
```

Quand ça plante au milieu, tu ne sais pas exactement **où** dans la chaîne. Inversement, un debugger pas-à-pas dans une `for` loop est trivial.

### Le moteur fuit

Plus le moteur est sophistiqué, plus quand il fuit ça fait mal. Exemples :
- React qui re-render trop → tu dois apprendre `useMemo`, `useCallback`, tous des **patches sur l'abstraction**
- Terraform qui veut détruire ta DB pour la recréer → tu apprends `lifecycle.prevent_destroy`, **opt-out de l'abstraction**
- L'optimiseur SQL qui choisit le mauvais plan → `OPTIMIZER_HINT`, **bypass partiel**

C'est ce qu'on appelle "**leaky abstraction**" : l'abstraction te promet de ne pas penser au-dessous, mais quand ça casse, **tu dois plonger**.

### Apprentissage du moteur

Pour utiliser SQL **bien**, tu dois apprendre les index, les query plans, les statistiques. Pour utiliser React **bien**, tu dois apprendre la fiber tree, le réconciliateur, les heuristiques d'update. Le déclaratif n'est pas "simple" — il est **autre**.

---

## 5. La règle pratique

Choisis le niveau d'abstraction selon **ce que tu veux contrôler** vs **ce que tu veux déléguer** :

| Situation | Privilégie |
|---|---|
| Code métier, lu souvent, modifié souvent | Déclaratif |
| Code chaud (perf-sensitive) | Impératif (au moins localement) |
| Logique complexe d'état (UI, machines) | Déclaratif |
| Traitement bas-niveau (parser, codec) | Impératif |
| Onboarding équipe junior | Déclaratif (intention plus claire) |
| Tu débugges au quotidien | Plus impératif (transparent) |

Et surtout : **mélange**. Le code applicatif moderne est typiquement **déclaratif au top-level** (composants, queries, schémas) et **impératif dans les détails** (helpers de calcul, parsers, hot loops).

---

## 6. Le piège du "purisme"

Personne n'écrit 100% impératif (sauf en assembleur). Personne n'écrit 100% déclaratif (les programmes Prolog réels ont des cuts impératifs). **L'idéologie tue le pragmatisme** dans les deux sens :

- 100% FP pure : difficile à débugger, perfs aléatoires, équipe découragée
- 100% impératif : code spaghetti, mutations partout, bugs de concurrence

Le **bon goût** consiste à choisir le niveau juste pour chaque morceau. Effect-TS, Rust ou React sont des **outils déclaratifs avec échappatoires impératives** (raw effect, `unsafe`, `useRef`). Cette dualité est volontaire.

---

## Citations brutes

> *"Imperative knowledge is 'how to': declarative knowledge is 'what is'."* — distinction classique en philosophie, recyclée en informatique.

> *"SQL is the most successful declarative language ever designed."* — Hillel Wayne.

---

## À explorer ensuite

- **Pure FP vs impure FP** : où est la limite vraiment utile (Haskell vs OCaml vs F#)
- **Reactive programming** (RxJS, signals) : un déclaratif spécifique pour le flot de données
- **DSL externes** vs **DSL internes** : SQL vs Knex.js, Terraform HCL vs Pulumi (TS)
- **Logic programming** : Prolog, Datalog, et leur retour timide via Soufflé / dataflow systems
- **Le React Compiler** : comment un compilateur tente de récupérer les bénéfices déclaratifs sur du code impératif

## MOC associé

<a class="wikilink" href="/Obsidian-Learn-Page/mocs/architecture-fondamentaux" data-wiki-title="MOC - Architecture &amp; Fondamentaux" data-wiki-preview="- Concept - Une closure capture son environnement lexical à la création - Concept - Un thunk est une fonction qui retarde l'évaluation">MOC - Architecture &amp; Fondamentaux</a>

