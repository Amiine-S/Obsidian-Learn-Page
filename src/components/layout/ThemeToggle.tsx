import { createSignal, onMount, Show } from 'solid-js'

type Theme = 'light' | 'dark' | 'system'

function getInitialTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'system'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = createSignal<Theme>('system')

  onMount(() => {
    setTheme(getInitialTheme())
    applyTheme(theme())
  })

  const cycle = () => {
    const next: Theme = theme() === 'light' ? 'dark' : theme() === 'dark' ? 'system' : 'light'
    setTheme(next)
    applyTheme(next)
    if (next === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', next)
    }
  }

  return (
    <button
      type="button"
      class="icon-btn"
      onClick={cycle}
      aria-label={`Thème actuel : ${theme()}. Cliquer pour changer.`}
      title={`Thème : ${theme()}`}
    >
      <Show when={theme() === 'light'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </Show>
      <Show when={theme() === 'dark'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </Show>
      <Show when={theme() === 'system'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </Show>
    </button>
  )
}
