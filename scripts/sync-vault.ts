/**
 * sync-vault.ts
 *
 * Lit le vault Obsidian source, copie les notes pertinentes dans src/content/,
 * extrait les métadonnées dérivées (title, oneLiner, excerpt), construit
 * l'index wikilinks.json et injecte les arrays related/backlinks dans chaque entrée.
 *
 * Usage :
 *   pnpm sync                  # one-shot
 *   pnpm sync:watch            # mode surveillance (chokidar)
 *   VAULT_PATH=... pnpm sync   # override du chemin du vault
 */

import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import GithubSlugger from 'github-slugger'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

if (process.env.SKIP_VAULT_SYNC === '1') {
  console.log('[sync] SKIP_VAULT_SYNC=1 — sync ignoré (build CI sur contenu déjà commité)')
  process.exit(0)
}

const VAULT_PATH = resolve(
  process.env.VAULT_PATH ?? join(ROOT, '..', 'Obsidian Vault', 'Learn')
)

const SOURCES_DIR = join(VAULT_PATH, '02 Sources')
const CONCEPTS_DIR = join(VAULT_PATH, '03 Concepts')
const MOCS_DIR = join(VAULT_PATH, '04 MOCs')

const OUT_ROOT = join(ROOT, 'src', 'content')
const OUT_SOURCES = join(OUT_ROOT, 'sources')
const OUT_CONCEPTS = join(OUT_ROOT, 'concepts')
const OUT_MOCS = join(OUT_ROOT, 'mocs')
const OUT_INDEX = join(OUT_ROOT, 'wikilinks.json')

type Collection = 'sources' | 'concepts' | 'mocs'

interface VaultEntry {
  filename: string             // basename sans `.md`, tel qu'il apparaît dans [[...]]
  filenameKey: string          // filename.toLowerCase().trim() — clé d'index
  collection: Collection
  slug: string
  title: string
  oneLiner?: string
  excerpt?: string
  rawFrontmatter: Record<string, unknown>
  body: string
  outPath: string
  related: string[]            // slugs (forward)
  backlinks: string[]          // slugs (reverse)
}

interface IndexEntry {
  slug: string
  collection: Collection
  title: string
  oneLiner?: string
  excerpt?: string
}

const slugger = new GithubSlugger()

async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function listMarkdown(dir: string): Promise<string[]> {
  if (!(await fileExists(dir))) return []
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
    .map((e) => join(dir, e.name))
}

function isDraft(fm: Record<string, unknown>): boolean {
  const tags = fm.tags
  if (!Array.isArray(tags)) return false
  return tags.some((t) => typeof t === 'string' && t.toLowerCase().includes('status/draft'))
}

function extractTitle(filename: string, fmTitle: unknown, body: string): string {
  if (typeof fmTitle === 'string' && fmTitle.trim()) return fmTitle.trim()
  // chercher le premier H1
  const h1 = body.match(/^#\s+(.+?)\s*$/m)
  if (h1) return h1[1].trim()
  // fallback : nettoyer le filename
  return filename
    .replace(/^Concept - /i, '')
    .replace(/^MOC - /i, '')
    .replace(/^\d{4}-\d{2}-\d{2} - /, '')
    .trim()
}

function extractOneLiner(body: string): string | undefined {
  // section "## Idée en une phrase" suivie d'un blockquote
  const match = body.match(/##\s+Id[ée]e en une phrase[\s\S]*?\n>\s*(.+?)(?:\n\n|\n##|$)/i)
  if (match) {
    return match[1].replace(/\n>\s*/g, ' ').trim()
  }
  return undefined
}

function extractExcerpt(body: string): string {
  // premier paragraphe non-vide qui n'est ni un H1, ni un H2, ni un blockquote, ni du frontmatter
  const lines = body.split('\n')
  let inCodeBlock = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    if (!line) continue
    if (line.startsWith('#')) continue
    if (line.startsWith('>')) continue
    if (line.startsWith('---')) continue
    // collecter jusqu'à ligne vide
    const para: string[] = [line]
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim()
      if (!next) break
      if (next.startsWith('#')) break
      para.push(next)
    }
    return para.join(' ').replace(/\[\[(.+?)\]\]/g, '$1').slice(0, 280).trim()
  }
  return ''
}

function detectCollection(absPath: string): Collection {
  const rel = relative(VAULT_PATH, absPath).split(sep)[0]
  if (rel === '02 Sources') return 'sources'
  if (rel === '03 Concepts') return 'concepts'
  if (rel === '04 MOCs') return 'mocs'
  throw new Error(`Unexpected path outside known dirs: ${absPath}`)
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function makeSlug(filename: string, collection: Collection): string {
  // base = filename sans préfixe technique (Concept - / MOC - / date prefix)
  let base = filename
  if (collection === 'concepts') base = base.replace(/^Concept - /i, '')
  if (collection === 'mocs') base = base.replace(/^MOC - /i, '')
  // ASCII-fy puis remplacer apostrophes/quotes par espace pour qu'elles deviennent un tiret unique
  base = stripAccents(base).replace(/['’"`]/g, ' ')
  // collapse les " - " multiples
  base = base.replace(/\s+/g, ' ').trim()
  return slugger.slug(base).replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function extractWikilinkRefs(body: string): string[] {
  const refs: string[] = []
  const re = /\[\[([^\]]+?)\]\]/g
  let m
  while ((m = re.exec(body)) !== null) {
    // [[Name|Alias]] → on garde Name (le filename référencé)
    const ref = m[1].split('|')[0].trim()
    // ignorer les ancres internes [[#section]] et les embeds ![[file]] (gérés ailleurs)
    if (ref.startsWith('#')) continue
    refs.push(ref)
  }
  return refs
}

const PREVIEW_MAX = 240
function clip(s: string | undefined, max = PREVIEW_MAX): string {
  if (!s) return ''
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const BASE_URL = '/Obsidian-Learn-Page'

function transformWikilinks(body: string, indexByKey: Map<string, IndexEntry>): string {
  // Skip embeds ![[...]] entièrement (gérés autrement, pas pour la veille texte)
  // Et skip les fence code blocks pour ne pas casser les exemples
  let transformed = ''
  const lines = body.split('\n')
  let inFence = false
  for (const line of lines) {
    if (line.match(/^```/)) {
      inFence = !inFence
      transformed += line + '\n'
      continue
    }
    if (inFence) {
      transformed += line + '\n'
      continue
    }
    // Skip embeds ![[...]] sur la ligne (laisser passer brut, Astro affichera comme texte)
    transformed +=
      line.replace(/\[\[([^\]]+?)\]\]/g, (_full, content) => {
        const parts = String(content).split('|').map((s) => s.trim())
        const target = parts[0]
        const alias = parts.length > 1 ? parts[1] : undefined
        if (target.startsWith('#')) return `<span class="wikilink-anchor">${escapeHtmlText(alias ?? target)}</span>`

        const key = target.toLowerCase()
        const hit = indexByKey.get(key)
        if (!hit) {
          return `<span class="wikilink-broken" title="Référence non trouvée : ${escapeHtmlAttr(target)}">${escapeHtmlText(alias ?? target)}</span>`
        }
        const display = alias ?? hit.title
        const href = `${BASE_URL}/${hit.collection}/${hit.slug}`
        const preview = clip(hit.oneLiner ?? hit.excerpt)
        return `<a class="wikilink" href="${escapeHtmlAttr(href)}" data-wiki-title="${escapeHtmlAttr(hit.title)}" data-wiki-preview="${escapeHtmlAttr(preview)}">${escapeHtmlText(display)}</a>`
      }) + '\n'
  }
  // retire le \n ajouté au dernier élément si le body original n'en avait pas
  return body.endsWith('\n') ? transformed : transformed.replace(/\n$/, '')
}

async function loadEntry(absPath: string): Promise<VaultEntry | null> {
  const raw = await readFile(absPath, 'utf-8')
  const parsed = matter(raw)
  const fm = parsed.data ?? {}

  if (isDraft(fm)) return null

  const collection = detectCollection(absPath)
  const filenameWithExt = absPath.split(sep).pop()!
  const filename = filenameWithExt.replace(/\.md$/i, '')
  const filenameKey = filename.toLowerCase().trim()
  const slug = makeSlug(filename, collection)
  const title = extractTitle(filename, fm.title, parsed.content)
  const oneLiner = extractOneLiner(parsed.content)
  const excerpt = extractExcerpt(parsed.content)

  const outDir =
    collection === 'sources' ? OUT_SOURCES : collection === 'concepts' ? OUT_CONCEPTS : OUT_MOCS

  return {
    filename,
    filenameKey,
    collection,
    slug,
    title,
    oneLiner,
    excerpt,
    rawFrontmatter: fm,
    body: parsed.content,
    outPath: join(outDir, `${slug}.md`),
    related: [],
    backlinks: [],
  }
}

async function cleanOutDirs(): Promise<void> {
  for (const d of [OUT_SOURCES, OUT_CONCEPTS, OUT_MOCS]) {
    if (await fileExists(d)) {
      await rm(d, { recursive: true, force: true })
    }
    await mkdir(d, { recursive: true })
  }
}

function buildOutMarkdown(entry: VaultEntry, indexByKey: Map<string, IndexEntry>): string {
  const fm: Record<string, unknown> = {
    ...entry.rawFrontmatter,
    title: entry.title,
    slug: entry.slug,
    excerpt: entry.excerpt,
  }
  if (entry.oneLiner) fm.oneLiner = entry.oneLiner
  if (entry.related.length > 0) fm.related = entry.related
  if (entry.backlinks.length > 0) fm.backlinks = entry.backlinks

  // Normalisation domain/format/level vers minuscules pour matcher le schema Zod
  if (typeof fm.domain === 'string') fm.domain = fm.domain.toLowerCase()
  if (typeof fm.format === 'string') fm.format = fm.format.toLowerCase()
  if (typeof fm.level === 'string') fm.level = fm.level.toLowerCase()

  // Ne pas écrire les champs vides
  for (const k of Object.keys(fm)) {
    const v = fm[k]
    if (v === undefined || v === null || v === '') delete fm[k]
  }

  // Transformation des wikilinks → ancres HTML inline
  const body = transformWikilinks(entry.body, indexByKey)
  return matter.stringify(body, fm)
}

async function sync(): Promise<void> {
  const start = Date.now()

  if (!(await fileExists(VAULT_PATH))) {
    console.error(`[sync] VAULT_PATH introuvable : ${VAULT_PATH}`)
    console.error('[sync] Set VAULT_PATH env var pour pointer un autre chemin.')
    process.exit(1)
  }

  // 1) Listing
  const files = [
    ...(await listMarkdown(SOURCES_DIR)),
    ...(await listMarkdown(CONCEPTS_DIR)),
    ...(await listMarkdown(MOCS_DIR)),
  ]

  console.log(`[sync] vault : ${VAULT_PATH}`)
  console.log(`[sync] ${files.length} fichiers candidats`)

  // 2) Pass 1 : load + slugify
  slugger.reset()
  const entries: VaultEntry[] = []
  const slugCollisions = new Map<string, string[]>()

  for (const f of files) {
    try {
      const entry = await loadEntry(f)
      if (entry) {
        entries.push(entry)
        const key = `${entry.collection}/${entry.slug}`
        const existing = slugCollisions.get(key) ?? []
        existing.push(entry.filename)
        slugCollisions.set(key, existing)
      }
    } catch (err) {
      console.error(`[sync] erreur chargement ${f}:`, err)
    }
  }

  // collision detection
  for (const [key, files] of slugCollisions) {
    if (files.length > 1) {
      console.error(`[sync] COLLISION SLUG sur ${key} : ${files.join(', ')}`)
      process.exit(1)
    }
  }

  // 3) Build indexes
  const indexByKey = new Map<string, IndexEntry>()
  for (const e of entries) {
    indexByKey.set(e.filenameKey, {
      slug: e.slug,
      collection: e.collection,
      title: e.title,
      oneLiner: e.oneLiner,
      excerpt: e.excerpt,
    })
  }

  // 4) Pass 2 : extraire wikilinks → related / backlinks
  const slugToFilenameKey = new Map<string, string>()
  for (const e of entries) slugToFilenameKey.set(e.slug, e.filenameKey)

  let brokenLinks = 0
  for (const e of entries) {
    const refs = extractWikilinkRefs(e.body)
    const seenForward = new Set<string>()
    for (const ref of refs) {
      const key = ref.toLowerCase().trim()
      const target = indexByKey.get(key)
      if (!target) {
        if (!ref.startsWith('MOC -')) {
          // MOC - X est utilisé en fin de note, pas critique si non trouvé en début
        }
        brokenLinks++
        continue
      }
      if (target.slug === e.slug) continue // self-ref
      if (seenForward.has(target.slug)) continue
      seenForward.add(target.slug)
      e.related.push(target.slug)
      // reverse
      const targetEntry = entries.find((x) => x.slug === target.slug)
      if (targetEntry && !targetEntry.backlinks.includes(e.slug)) {
        targetEntry.backlinks.push(e.slug)
      }
    }
  }

  if (brokenLinks > 0) {
    console.warn(`[sync] ${brokenLinks} wikilinks non résolus (probablement vers des notes hors scope).`)
  }

  // 5) Clean output et écrire les fichiers
  await cleanOutDirs()

  for (const e of entries) {
    const md = buildOutMarkdown(e, indexByKey)
    await mkdir(dirname(e.outPath), { recursive: true })
    await writeFile(e.outPath, md, 'utf-8')
  }

  // 6) Écrire wikilinks.json
  const indexObj: Record<string, IndexEntry> = {}
  for (const [key, val] of indexByKey) indexObj[key] = val
  await writeFile(OUT_INDEX, JSON.stringify(indexObj, null, 2), 'utf-8')

  const ms = Date.now() - start
  const counts = {
    sources: entries.filter((e) => e.collection === 'sources').length,
    concepts: entries.filter((e) => e.collection === 'concepts').length,
    mocs: entries.filter((e) => e.collection === 'mocs').length,
  }
  console.log(
    `[sync] OK en ${ms}ms — ${counts.sources} sources, ${counts.concepts} concepts, ${counts.mocs} MOCs`
  )
}

async function watch(): Promise<void> {
  const chokidar = await import('chokidar')
  await sync()
  console.log('[sync] mode watch — ctrl+C pour quitter')
  const watcher = chokidar.watch([SOURCES_DIR, CONCEPTS_DIR, MOCS_DIR], {
    ignored: /(^|[/\\])\.(obsidian|trash)/,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  })
  let pending: NodeJS.Timeout | null = null
  const debouncedSync = () => {
    if (pending) clearTimeout(pending)
    pending = setTimeout(async () => {
      try {
        await sync()
      } catch (err) {
        console.error('[sync] erreur :', err)
      }
    }, 150)
  }
  watcher.on('add', debouncedSync)
  watcher.on('change', debouncedSync)
  watcher.on('unlink', debouncedSync)
}

const isWatch = process.argv.includes('--watch')
;(isWatch ? watch() : sync()).catch((err) => {
  console.error('[sync] FATAL :', err)
  process.exit(1)
})
