import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'

export interface FeedItem {
  kind: 'source' | 'concept'
  id: string
  title: string
  excerpt: string
  date: string // ISO
  format?: string // sources only
  topics: string[]
  url: string
}

interface Props {
  items: FeedItem[]
  baseUrl: string
}

const PAGE_SIZE = 12

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })

type KindFilter = 'all' | 'source' | 'concept'

export default function SourceList(props: Props) {
  const [active, setActive] = createSignal<Set<string>>(new Set())
  const [kindFilter, setKindFilter] = createSignal<KindFilter>('all')
  const [shown, setShown] = createSignal(PAGE_SIZE)
  let sentinel: HTMLDivElement | undefined

  const byKind = createMemo(() => {
    const k = kindFilter()
    if (k === 'all') return props.items
    return props.items.filter((i) => i.kind === k)
  })

  const allTopics = createMemo(() => {
    const counts = new Map<string, number>()
    for (const s of byKind()) {
      for (const t of s.topics) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  })

  const filtered = createMemo(() => {
    const sel = active()
    if (sel.size === 0) return byKind()
    return byKind().filter((s) => s.topics.some((t) => sel.has(t)))
  })

  const sourceCount = createMemo(() => props.items.filter((i) => i.kind === 'source').length)
  const conceptCount = createMemo(() => props.items.filter((i) => i.kind === 'concept').length)

  const visible = createMemo(() => filtered().slice(0, shown()))
  const hasMore = createMemo(() => shown() < filtered().length)

  // Reset pagination quand un filtre change
  createEffect(() => {
    active()
    kindFilter()
    setShown(PAGE_SIZE)
  })

  onMount(() => {
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore()) {
          setShown((s) => s + PAGE_SIZE)
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(sentinel)
    onCleanup(() => observer.disconnect())
  })

  const toggle = (topic: string) => {
    setActive((prev) => {
      const next = new Set<string>(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }
  const reset = () => setActive(new Set())

  return (
    <>
      <section style={{ 'margin-bottom': '2rem' }}>
        <div class="kind-filter" role="tablist">
          <button
            role="tab"
            type="button"
            classList={{ active: kindFilter() === 'all' }}
            aria-selected={kindFilter() === 'all'}
            onClick={() => setKindFilter('all')}
          >
            Tout <span class="kind-filter-count">{props.items.length}</span>
          </button>
          <button
            role="tab"
            type="button"
            classList={{ active: kindFilter() === 'source' }}
            aria-selected={kindFilter() === 'source'}
            onClick={() => setKindFilter('source')}
          >
            Sources <span class="kind-filter-count">{sourceCount()}</span>
          </button>
          <button
            role="tab"
            type="button"
            classList={{ active: kindFilter() === 'concept' }}
            aria-selected={kindFilter() === 'concept'}
            onClick={() => setKindFilter('concept')}
          >
            Concepts <span class="kind-filter-count">{conceptCount()}</span>
          </button>
        </div>
      </section>

      <section style={{ 'margin-bottom': '2.5rem' }}>
        <div class="filter-header">
          <h2 class="section-title" style={{ margin: 0 }}>
            Filtrer par topic
          </h2>
          <Show when={active().size > 0}>
            <button class="filter-reset" type="button" onClick={reset}>
              Tout désélectionner ({active().size})
            </button>
          </Show>
        </div>
        <div class="filter-bar">
          <For each={allTopics()}>
            {([topic, count]) => (
              <button
                type="button"
                class="filter-pill"
                classList={{ active: active().has(topic) }}
                data-topic={topic}
                onClick={() => toggle(topic)}
                aria-pressed={active().has(topic)}
              >
                <span class="filter-pill-dot" />
                {topic}
                <span class="filter-pill-count">{count}</span>
              </button>
            )}
          </For>
        </div>
      </section>

      <section>
        <h2 class="section-title">
          {active().size > 0
            ? `${filtered().length} résultat${filtered().length > 1 ? 's' : ''}`
            : 'Tout le contenu'}
        </h2>
        <Show
          when={visible().length > 0}
          fallback={<p class="muted">Aucun résultat ne matche les topics sélectionnés.</p>}
        >
          <div class="entry-grid">
            <For each={visible()}>
              {(item) => (
                <article class="entry-card" classList={{ 'card-concept': item.kind === 'concept' }}>
                  <div class="meta">
                    <time datetime={item.date}>{fmtDate(item.date)}</time>
                    <span>·</span>
                    <span>{item.kind === 'source' ? item.format : 'concept'}</span>
                  </div>
                  <h3>
                    <a href={item.url}>{item.title}</a>
                  </h3>
                  <p class="excerpt">{item.excerpt}</p>
                  <Show when={item.topics.length > 0}>
                    <div class="card-topics">
                      <For each={item.topics}>
                        {(topic) => (
                          <span class="badge" data-topic={topic}>
                            {topic}
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                </article>
              )}
            </For>
          </div>
          <div ref={sentinel} class="infinite-sentinel" aria-hidden="true">
            <Show when={hasMore()}>
              <span class="muted">Chargement…</span>
            </Show>
            <Show when={!hasMore() && filtered().length > PAGE_SIZE}>
              <span class="muted">— fin —</span>
            </Show>
          </div>
        </Show>
      </section>
    </>
  )
}
