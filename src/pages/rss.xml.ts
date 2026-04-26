import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const sources = (await getCollection('sources')).sort(
    (a, b) => b.data.digested.valueOf() - a.data.digested.valueOf()
  )

  return rss({
    title: 'Veille tech — Amine',
    description:
      'Notes de lecture liées entre elles : articles, vidéos, talks digérés en concepts atomiques.',
    site: context.site ?? 'https://amiine-s.github.io/Obsidian-Learn-Page/',
    items: sources.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.digested,
      description: entry.data.excerpt ?? '',
      link: `/sources/${entry.id}/`,
      categories: [entry.data.domain, entry.data.format, entry.data.level],
    })),
    customData: '<language>fr-FR</language>',
  })
}
