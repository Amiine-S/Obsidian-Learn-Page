import { createSignal, onCleanup, onMount } from 'solid-js'

export default function ReadingProgress() {
  const [progress, setProgress] = createSignal(0)

  const update = () => {
    const scrollTop = window.scrollY
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    if (scrollHeight <= 0) {
      setProgress(0)
      return
    }
    const pct = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
    setProgress(pct)
  }

  onMount(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    onCleanup(() => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    })
  })

  return (
    <div class="reading-progress" aria-hidden="true">
      <div class="reading-progress-fill" style={{ width: `${progress()}%` }} />
    </div>
  )
}
