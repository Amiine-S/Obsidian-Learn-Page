import { defineConfig } from 'astro/config'
import solid from '@astrojs/solid-js'
import sitemap from '@astrojs/sitemap'
import pagefind from 'astro-pagefind'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

export default defineConfig({
  site: 'https://amiine-s.github.io',
  base: '/Obsidian-Learn-Page',
  trailingSlash: 'ignore',
  integrations: [solid(), sitemap(), pagefind()],
  markdown: {
    // Les wikilinks [[...]] sont transformés en ancres HTML inline directement par
    // scripts/sync-vault.ts avec data-wiki-title / data-wiki-preview.
    // Pas besoin de remark-wiki-link.
    remarkPlugins: [],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['heading-anchor'], ariaHidden: 'true', tabIndex: -1 },
          content: { type: 'text', value: ' #' },
        },
      ],
    ],
    shikiConfig: {
      // Toujours du sombre, même en light mode — code blocks ont leur identité.
      // github-dark : haut contraste, lisible, palette éprouvée par GitHub.
      themes: { light: 'github-dark', dark: 'github-dark' },
      wrap: false,
    },
  },
})
