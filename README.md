# learn-site

Site de veille tech statique, généré depuis le vault Obsidian `Learn`.

Stack : **Astro 5 + Solid + Ark UI Solid**, Park UI / Panda CSS pour le styling, Pagefind pour la recherche.

## Workflow

```bash
pnpm install
pnpm sync          # copie le vault → src/content/ + génère wikilinks.json
pnpm dev           # http://localhost:4321/Obsidian-Learn-Page/
pnpm build         # statique dans dist/
```

`pnpm dev` et `pnpm build` lancent automatiquement `sync` en pre-hook.

## Sources de contenu

- Vault local : `../Obsidian Vault/Learn/`
- Override : `VAULT_PATH=/autre/chemin pnpm sync`

## Déploiement

Push sur `main` → GitHub Actions → GitHub Pages (`https://amiine-s.github.io/Obsidian-Learn-Page/`).

Le contenu `src/content/` est commité (CI n'a pas accès au vault local) — `pnpm sync` est donc à lancer **avant push**.
