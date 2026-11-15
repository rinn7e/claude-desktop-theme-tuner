// For maintainers: run in the Claude app's DevTools Console, in a Claude Code
// session with a look of the Theme Tuner mod on (no theme snippet). It copies
// a JSON report to the clipboard: every visible element of the window with
// the colors it paints (background, text, border) and, for each color, the
// design system variables that hold that exact color where the element is.
// The home preview (preview v2) paints its mock from these tokens; see
// doc/claude-internals.md.
;(() => {
  // copy() only exists while pasted code runs synchronously
  const copyText = copy
  const root = document.documentElement
  const TRANSPARENT = 'rgba(0, 0, 0, 0)'

  // Every custom property name a readable stylesheet sets,
  const names = new Set()
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.style)
        for (const p of rule.style) if (p.startsWith('--')) names.add(p)
      if (rule.cssRules) walk(rule.cssRules)
    }
  }
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules)
    } catch {
      /* cross-origin sheet */
    }
  }
  // and every inline style: a look may arrive as variables set on elements
  for (const el of [root, ...document.querySelectorAll('[style]')])
    for (const p of el.style) if (p.startsWith('--')) names.add(p)
  const tokenNames = [...names].filter((n) => /^--(cds|df)-/.test(n)).sort()

  // The color each variable holds inside a scope, as the browser serializes
  // computed colors, so it compares with an element's colors as text
  const colorsIn = (scope) => {
    const probe = document.createElement('span')
    probe.style.display = 'none'
    scope.appendChild(probe)
    const byName = {}
    for (const n of tokenNames) {
      probe.style.backgroundColor = ''
      probe.style.backgroundColor = `var(${n})`
      const raw = getComputedStyle(scope).getPropertyValue(n).trim()
      if (!raw) continue
      const c = getComputedStyle(probe).backgroundColor
      // A variable that is not a color leaves the probe transparent
      if (
        c !== TRANSPARENT ||
        /^(transparent|#0000|rgba\(.*,\s*0\))$/.test(raw)
      )
        byName[n] = c
    }
    probe.remove()
    return byName
  }

  // Variables are re-set inside the sidebar, the panels and the composer, so
  // each element is matched against the scope it sits in
  const scopeEls = [
    ['root', root],
    ['sidebar', document.querySelector('.dframe-sidebar, aside')],
    ['content', document.querySelector('.dframe-content, main')],
    [
      'composer',
      document.querySelector('[contenteditable="true"]')?.closest('form') ??
        document.querySelector('[contenteditable="true"]')?.parentElement,
    ],
  ].filter(([, el]) => el)
  const scopes = scopeEls.map(([name, el]) => ({
    name,
    el,
    colors: colorsIn(el),
  }))
  const scopeOf = (el) => {
    let best = scopes[0]
    for (const s of scopes) if (s.el.contains(el)) best = s
    return best
  }
  const tokensFor = (scope, color) =>
    Object.entries(scope.colors)
      .filter(([, c]) => c === color)
      .map(([n]) => n)

  const classOf = (el) =>
    String(el.className?.baseVal ?? el.className ?? '').slice(0, 160)
  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .slice(0, 50)

  const seen = new Set()
  const elements = []
  for (const el of document.body.querySelectorAll('*')) {
    if (elements.length >= 600) break
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight)
      continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0')
      continue
    const text = ownText(el)
    const bg = s.backgroundColor !== TRANSPARENT ? s.backgroundColor : null
    const fg = text ? s.color : null
    const border =
      parseFloat(s.borderTopWidth) > 0 && s.borderTopColor !== TRANSPARENT
        ? s.borderTopColor
        : null
    if (!bg && !fg && !border) continue
    const cls = classOf(el)
    const key = [el.tagName, cls, bg, fg, border].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    const scope = scopeOf(el)
    const paint = (color) =>
      color ? { color, tokens: tokensFor(scope, color) } : undefined
    elements.push({
      tag: el.tagName.toLowerCase(),
      text,
      role: el.getAttribute('role') ?? undefined,
      label: el.getAttribute('aria-label') ?? undefined,
      data: Object.keys(el.dataset).join(',') || undefined,
      class: cls,
      rect: [r.x, r.y, r.width, r.height].map(Math.round).join(','),
      scope: scope.name,
      bg: paint(bg),
      fg: paint(fg),
      border: paint(border),
    })
  }

  const report = {
    userAgent: navigator.userAgent,
    mode: root.dataset.mode,
    window: `${innerWidth}x${innerHeight}`,
    htmlAttrs: Object.fromEntries(
      [...root.attributes].map((a) => [a.name, a.value.slice(0, 120)]),
    ),
    // The tokens of each scope, for checking the values preview v2 computes
    tokens: Object.fromEntries(scopes.map((s) => [s.name, s.colors])),
    elements,
  }
  copyText(JSON.stringify(report, null, 1))
  console.log(
    `[mod-look] copied: ${elements.length} elements, ${tokenNames.length} variables, ${scopes.length} scopes. Paste it to the tuner maintainer.`,
  )
})()
