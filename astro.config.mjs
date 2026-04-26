import { defineConfig } from 'astro/config'
import solid from '@astrojs/solid-js'
import sitemap from '@astrojs/sitemap'
import pagefind from 'astro-pagefind'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStarryNight from './src/lib/rehype-starry-night.ts'

export default defineConfig({
  site: 'https://amiine-s.github.io',
  base: '/Obsidian-Learn-Page',
  trailingSlash: 'ignore',
  integrations: [solid(), sitemap(), pagefind()],
  markdown: {
    // Wikilinks transformés en ancres HTML par scripts/sync-vault.ts (pas de remark plugin)
    remarkPlugins: [],
    // syntax highlighting via starry-night (cf rehype-starry-night.ts) au lieu de Shiki
    syntaxHighlight: false,
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
      rehypeStarryNight,
    ],
  },
})
