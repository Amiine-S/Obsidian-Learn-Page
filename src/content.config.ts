import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const level = z.enum(['beginner', 'intermediate', 'advanced'])
const format = z.enum(['article', 'video', 'podcast', 'book', 'talk', 'doc', 'course'])

// `topics` est un tableau libre de slugs : rust, typescript, react, frontend, infra…
// Une source ou un concept peut en avoir plusieurs (multi-tag).
const topics = z.array(z.string()).default([])

const sources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sources' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    url: z.string().optional(),
    author: z.string().optional(),
    published: z.coerce.date().optional(),
    digested: z.coerce.date(),
    format,
    topics,
    // domain conservé pour la rétro-compat avec les MOCs et la couleur "primary"
    domain: z.string().optional(),
    level,
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    related: z.array(z.string()).default([]),
    backlinks: z.array(z.string()).default([]),
    audioUrl: z.string().optional(),
    audioDurationSec: z.number().optional(),
  }),
})

const concepts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/concepts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    created: z.coerce.date().optional(),
    topics,
    domain: z.string().optional(),
    level: level.optional(),
    tags: z.array(z.string()).default([]),
    oneLiner: z.string().optional(),
    excerpt: z.string().optional(),
    related: z.array(z.string()).default([]),
    backlinks: z.array(z.string()).default([]),
  }),
})

const mocs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/mocs' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    domain: z.string(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    related: z.array(z.string()).default([]),
    backlinks: z.array(z.string()).default([]),
  }),
})

export const collections = { sources, concepts, mocs }
