---
tags:
  - type/dashboard
---

# Dashboard

> Point d'entrée du vault. Les sections dynamiques nécessitent le plugin **Dataview** (voir [[_README plugins]]).

## Accès rapide aux MOCs

- [[MOC - Rust]] *(prioritaire)*
- [[MOC - Frontend]]
- [[MOC - Backend & Infra]]
- [[MOC - IA & LLMs]]
- [[MOC - Architecture & Fondamentaux]]

---

## À digérer (Inbox)

```dataview
LIST
FROM "01 Inbox"
WHERE !contains(file.tags, "#status/done")
SORT file.ctime DESC
```

---

## Dernières sources (7 derniers jours)

```dataview
TABLE
  digested AS "Digéré le",
  domain AS "Domaine",
  level AS "Niveau"
FROM "02 Sources"
WHERE digested >= date(today) - dur(7 days)
SORT digested DESC
```

---

## Concepts récents

```dataview
LIST
FROM "03 Concepts"
SORT file.ctime DESC
LIMIT 10
```

---

## Stats par domaine

```dataview
TABLE length(rows) AS "Concepts"
FROM "03 Concepts"
GROUP BY domain
SORT length(rows) DESC
```

---

## Sources par format

```dataview
TABLE length(rows) AS "Sources"
FROM "02 Sources"
GROUP BY format
SORT length(rows) DESC
```

---

## Tous les MOCs

```dataview
LIST
FROM "04 MOCs"
SORT file.name ASC
```
