import { createMemo, createSignal, For, Show } from 'solid-js'

export interface SourceCardData {
  id: string
  title: string
  excerpt: string
  digested: string // ISO
  format: string
  level: string
  topics: string[]
  url: string
}

interface Props {
  sources: SourceCardData[]
  baseUrl: string
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })

export default function SourceList(props: Props) {
  const [active, setActive] = createSignal<Set<string>>(new Set())

  const allTopics = createMemo(() => {
    const counts = new Map<string, number>()
    for (const s of props.sources) {
      for (const t of s.topics) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  })

  const filtered = createMemo(() => {
    const sel = active()
    if (sel.size === 0) return props.sources
    return props.sources.filter((s) => s.topics.some((t) => sel.has(t)))
  })

  const toggle = (topic: string) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  const reset = () => setActive(new Set())

  return (
    <>
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
          {active().size > 0 ? `${filtered().length} sources` : 'Sources'}
        </h2>
        <Show
          when={filtered().length > 0}
          fallback={
            <p class="muted">Aucune source ne matche les topics sélectionnés.</p>
          }
        >
          <div class="entry-grid">
            <For each={filtered()}>
              {(s) => (
                <article class="entry-card">
                  <div class="meta">
                    <time datetime={s.digested}>{fmtDate(s.digested)}</time>
                    <span>·</span>
                    <span>{s.format}</span>
                  </div>
                  <h3>
                    <a href={s.url}>{s.title}</a>
                  </h3>
                  <p class="excerpt">{s.excerpt}</p>
                  <Show when={s.topics.length > 0}>
                    <div class="card-topics">
                      <For each={s.topics}>
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
        </Show>
      </section>
    </>
  )
}
