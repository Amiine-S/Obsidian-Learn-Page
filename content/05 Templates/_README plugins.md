---
tags:
  - type/meta
---

# Plugins Obsidian recommandés

Cette note est un mémo de la config recommandée pour ce vault. Aucun plugin n'est obligatoire pour lire les notes — mais le dashboard et les templates s'appuient dessus.

## Plugins à installer

Settings → Community plugins → Browse, puis chercher chacun :

| Plugin | Rôle |
|---|---|
| **Templater** | Remplit les templates dynamiquement (date, titre du fichier, prompts) |
| **Dataview** | Exécute les queries du `00 Dashboard.md` |
| **Excalidraw** | Crée des schémas / diagrammes embeddables dans les notes |
| **Tag Wrangler** | Renomme/fusionne les tags facilement (clic droit sur un tag) |
| **Obsidian Git** *(optionnel)* | Backup auto vers un repo Git |

## Configuration Templater

- Settings → Templater → **Template folder location** = `05 Templates`
- (optionnel) Activer "Trigger Templater on new file creation" pour appliquer auto un template selon le dossier
- Folder Templates :
  - `01 Inbox` → `05 Templates/Template - Inbox`
  - `02 Sources` → `05 Templates/Template - Source`
  - `03 Concepts` → `05 Templates/Template - Concept`
  - `04 MOCs` → `05 Templates/Template - MOC`

## Configuration Excalidraw

- Settings → Excalidraw → **Excalidraw folder** = `06 Excalidraw`
- Embed dans une note : `![[Nom-du-schema.excalidraw]]`

## Configuration Dataview

- Settings → Dataview → **Enable JavaScript queries** : optionnel (on n'en utilise pas pour l'instant)
- Les queries DQL standards suffisent pour le dashboard

## Configuration Obsidian Git (optionnel)

- Settings → Obsidian Git → **Auto backup interval** : 30 min
- Initialiser un repo Git dans le dossier du vault si pas déjà fait
- Ajouter un `.gitignore` qui exclut `.obsidian/workspace.json` et `.obsidian/workspace*.json`
