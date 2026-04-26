/**
 * rehype plugin : highlight les <pre><code class="language-X"> via @wooorm/starry-night.
 *
 * Pourquoi : reproduit fidèlement les couleurs GitHub (mêmes grammaires TextMate),
 * via des classes CSS (pas inline styles comme Shiki).
 */
import { createStarryNight, common } from '@wooorm/starry-night'
import { toString } from 'hast-util-to-string'
import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Element, ElementContent } from 'hast'

// Initialisé une seule fois au chargement du plugin (top-level await OK en ESM).
const starryNight = await createStarryNight(common)

export default function rehypeStarryNight(): Plugin<[], Root> {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, _idx, parent) => {
      if (!parent || node.tagName !== 'pre') return
      const head = node.children[0]
      if (!head || head.type !== 'element' || head.tagName !== 'code') return

      const classes = head.properties?.className
      if (!Array.isArray(classes)) return
      const langClass = classes.find(
        (c): c is string => typeof c === 'string' && c.startsWith('language-')
      )
      if (!langClass) return

      const language = langClass.slice('language-'.length)
      const scope = starryNight.flagToScope(language)
      if (!scope) return

      const highlighted = starryNight.highlight(toString(head), scope)
      head.children = highlighted.children as ElementContent[]
    })
  }
}
