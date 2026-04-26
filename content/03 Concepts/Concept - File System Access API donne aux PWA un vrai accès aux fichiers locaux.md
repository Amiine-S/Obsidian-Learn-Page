---
created: 2026-04-26
domain: frontend
level: intermediate
tags:
  - type/concept
  - domain/frontend
  - level/intermediate
---

# Concept - File System Access API donne aux PWA un vrai accès aux fichiers locaux

## Idée en une phrase

> La **File System Access API** permet à une page web (et donc à une PWA) d'**ouvrir, lire, modifier et sauvegarder** des fichiers sur le système de fichiers réel de l'utilisateur — et non plus seulement de blobs sandboxés — moyennant **une permission explicite par session**.

## Contexte / pourquoi ça compte

C'est l'API qui ferme l'un des derniers grands écarts entre web app et app native. Avant : si tu voulais modifier un fichier `.md` ou un `.png`, tu devais le faire **uploader**, le travailler côté JS, le **télécharger** modifié — l'utilisateur récupérait un nouveau fichier dans son dossier "Téléchargements." Avec FS Access, **tu modifies le fichier original, en place**.

Conséquence : des outils comme **VS Code Web, Photopea, Figma offline, des éditeurs de texte PWA** sont devenus possibles. C'est aussi la base de toute PWA "workforce" sérieuse (sauvegarder dans un dossier projet, drag & drop d'un dossier entier).

## Détails / mécanisme

### Les 3 entrées principales

| API | Usage |
|---|---|
| `showOpenFilePicker()` | Ouvrir un (ou plusieurs) fichier(s) en lecture |
| `showSaveFilePicker()` | Demander où sauvegarder un nouveau fichier |
| `showDirectoryPicker()` | Demander un dossier (avec sous-dossiers) |

### Lire un fichier

```typescript
const [handle] = await window.showOpenFilePicker({
  types: [
    { description: "Markdown", accept: { "text/markdown": [".md"] } }
  ],
  multiple: false,
})
// handle est un FileSystemFileHandle persistant

const file = await handle.getFile() // un Blob/File standard
const text = await file.text()
console.log(text)
```

### Sauvegarder en place

```typescript
// Demander la permission write si on n'a que read
if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") {
  await handle.requestPermission({ mode: "readwrite" })
}

const writable = await handle.createWritable()
await writable.write(text + "\n\nappended")
await writable.close()
// Le fichier ORIGINAL est modifié
```

### Sauvegarder un nouveau fichier

```typescript
const handle = await window.showSaveFilePicker({
  suggestedName: "report.md",
  types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }]
})
const writable = await handle.createWritable()
await writable.write("# My report")
await writable.close()
```

### Parcourir un dossier

```typescript
const dirHandle = await window.showDirectoryPicker()
for await (const [name, h] of dirHandle.entries()) {
  if (h.kind === "file") {
    const file = await (h as FileSystemFileHandle).getFile()
    console.log(name, file.size)
  } else {
    // h.kind === "directory" — tu peux récurser
  }
}
```

### Persistance des handles

Les `FileSystemFileHandle` peuvent être **stockés dans IndexedDB**. Au prochain lancement de l'app, tu retrouves le handle et tu redemandes la permission — l'utilisateur n'a pas à re-piquer le fichier.

```typescript
// stocker
await db.put("recent", handle, "lastFile")

// recharger
const stored = await db.get("recent", "lastFile")
const perm = await stored.queryPermission({ mode: "readwrite" })
if (perm !== "granted") await stored.requestPermission({ mode: "readwrite" })
```

### Sécurité / permissions

- **User gesture obligatoire** : tu ne peux pas appeler `showOpenFilePicker()` sans clic utilisateur
- **Permission session-scoped** par défaut (`prompt` à chaque session pour write)
- **Sandbox** : `\Windows\System32`, `~/.ssh`, etc. sont **interdits**
- L'utilisateur peut révoquer en un clic (icône de cadenas)

## Exemple concret

Mini-éditeur Markdown qui ouvre un fichier, le modifie, et sauve :

```typescript
let currentHandle: FileSystemFileHandle | null = null

document.querySelector("#open")!.addEventListener("click", async () => {
  const [h] = await window.showOpenFilePicker({
    types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }]
  })
  currentHandle = h
  const file = await h.getFile()
  textarea.value = await file.text()
})

document.querySelector("#save")!.addEventListener("click", async () => {
  if (!currentHandle) return
  if ((await currentHandle.queryPermission({ mode: "readwrite" })) !== "granted") {
    await currentHandle.requestPermission({ mode: "readwrite" })
  }
  const w = await currentHandle.createWritable()
  await w.write(textarea.value)
  await w.close()
})
```

10 lignes pour un éditeur qui modifie de vrais fichiers locaux.

### File Handling : l'app appelée par l'OS

Si ton app déclare dans le manifest :

```json
"file_handlers": [
  { "action": "/open", "accept": { "text/markdown": [".md"] } }
]
```

Alors un double-clic sur un `.md` dans le Finder/Explorer **lance ton app installée** :

```typescript
window.launchQueue.setConsumer(async (params) => {
  const handle = params.files[0]
  // ouvrir le contenu...
})
```

C'est l'équivalent du "Open With" natif. Combiné à l'install PWA, ça donne une intégration OS bien plus complète.

## Connexions

**Concepts liés** :
- [[Concept - Window Controls Overlay donne aux PWA desktop le contrôle de la barre de titre]]
- [[Concept - Les PWA 2026 ferment l'écart fonctionnel avec les apps natives]]

**Prérequis** :
- Notion de PWA (manifest, service worker, install)
- API asynchrones / promises

**S'oppose à / à comparer avec** :
- **Input file + download** : ancien modèle, sandboxé, pas de "save in place"
- **OPFS (Origin Private File System)** : autre API, sandbox dédié à l'origine — pas d'interaction avec les fichiers utilisateur
- **Capabilities Electron / Tauri** : équivalent en app native enrobée, sans permission par fichier

## Sources

- [[2026-04-26 - Nouveautés PWA en 2026]]

## MOC

[[MOC - Frontend]]
