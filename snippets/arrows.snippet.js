// Run in the Claude app's DevTools Console with a few session groups in the
// sidebar (some expanded, some collapsed) and, if you can, the Context panel
// open (the one listing "MCP tools" and "Memory files"). It lists every
// distinct icon shape in the app, with how often and where it appears, and
// copies the report to the clipboard as JSON. The aim: find the bold arrow
// shapes, to replace them everywhere with the thin chevron the Context panel
// uses, matched by shape rather than by place.
//
// Icons come as inline SVGs, as one-character glyphs, or drawn by CSS (a
// mask or background image on an element or its ::before / ::after), so it
// looks for all three. It also copies the markup of every expandable row
// (aria-expanded) in the sidebar and the Context panel, which shows how the
// arrows are drawn even if they are none of those.
;(() => {
  const copyText = copy // DevTools' copy(), kept before anything async
  const ARROWS = /^[▲-◅›‹❯❮⌄⌃>]$/
  const short = (s, n = 1500) => (s.length > n ? `${s.slice(0, n)}…` : s)
  const classOf = (el) =>
    typeof el.className === 'string'
      ? el.className
      : (el.className?.baseVal ?? '')
  // The first few ancestors, as tag.classes, nearest first
  const chain = (el, depth = 6) => {
    const out = []
    for (let n = el.parentElement; n && out.length < depth; n = n.parentElement)
      out.push(
        `${n.tagName.toLowerCase()}.${classOf(n).trim().split(/\s+/).join('.')}`,
      )
    return out
  }
  // Attributes that say whether a row is open, from the icon up to its row
  const stateOf = (el) => {
    const found = {}
    for (let n = el, i = 0; n && i < 8; n = n.parentElement, i++)
      for (const a of n.attributes ?? [])
        if (
          /^(aria-expanded|aria-pressed|aria-selected|data-state|data-open|data-expanded|data-collapsed|open|role)$/.test(
            a.name,
          )
        )
          found[`${i}:${n.tagName.toLowerCase()}[${a.name}]`] = a.value
    return found
  }
  const sidebar =
    document.querySelector('.dframe-sidebar') ??
    document.querySelector('nav') ??
    document.body
  // The Context panel's rows: the elements that read "MCP tools" or "Memory files"
  const contextRows = [...document.querySelectorAll('*')].filter(
    (e) =>
      e.children.length === 0 &&
      /^(MCP tools|Memory files|System tools)/.test(e.textContent.trim()),
  )
  // Where an icon sits, to tell the sidebar's arrows from the rest
  const areaOf = (el) =>
    sidebar !== document.body && sidebar.contains(el)
      ? 'sidebar'
      : contextRows.some((label) =>
            label.closest('div')?.parentElement?.contains(el),
          )
        ? 'context panel'
        : 'elsewhere'
  // An icon CSS draws on the element or its ::before / ::after: a mask or a
  // background image (url(...)), or the pseudo-element's own content
  const cssIconOf = (el) => {
    for (const pseudo of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, pseudo)
      if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue
      const mask = cs.maskImage || cs.webkitMaskImage
      if (mask && mask !== 'none')
        return { on: pseudo ?? 'element', kind: 'mask', image: mask }
      if (cs.backgroundImage.includes('url('))
        return {
          on: pseudo ?? 'element',
          kind: 'background',
          image: cs.backgroundImage,
        }
      if (pseudo && cs.content !== '""' && cs.content.length <= 6)
        return { on: pseudo, kind: 'content', image: cs.content }
    }
    return null
  }
  const describe = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      area: areaOf(el),
      tag: el.tagName.toLowerCase(),
      class: classOf(el),
      text: el.tagName === 'svg' ? undefined : el.textContent.trim(),
      html: short(el.outerHTML),
      size: `${Math.round(r.width)}x${Math.round(r.height)}`,
      color: cs.color,
      transform: cs.transform,
      rowText: short(
        (
          el.closest('a,button,[role=button],li,[role=treeitem]') ??
          el.parentElement
        )?.textContent.trim() ?? '',
        80,
      ),
      css: el.tagName === 'svg' ? undefined : cssIconOf(el),
      state: stateOf(el),
      chain: chain(el),
    }
  }
  // Icons in a scope: SVGs (not inside another SVG), one-character arrows,
  // and small elements CSS draws an icon on
  const iconsIn = (scope) => {
    const svgs = [...scope.querySelectorAll('svg')].filter(
      (s) => !s.parentElement?.closest('svg'),
    )
    const glyphs = [...scope.querySelectorAll('span,i,div,button')].filter(
      (e) => e.children.length === 0 && ARROWS.test(e.textContent.trim()),
    )
    const drawn = [...scope.querySelectorAll('*')].filter((e) => {
      if (e.closest('svg')) return false
      const r = e.getBoundingClientRect()
      return r.width > 0 && r.width <= 32 && r.height <= 32 && cssIconOf(e)
    })
    return [...svgs, ...glyphs, ...drawn]
  }
  // Groups icons by their markup without sizes and colors, so each distinct
  // shape is listed once with how often it appears and a few examples
  const byShape = (els) => {
    const groups = new Map()
    for (const el of els) {
      const key =
        el.tagName === 'svg'
          ? [
              ...el.querySelectorAll(
                'path,polyline,line,polygon,circle,rect,use',
              ),
            ]
              .map(
                (p) =>
                  p.getAttribute('d') ??
                  p.getAttribute('points') ??
                  p.getAttribute('href') ??
                  p.tagName,
              )
              .join('|') || el.outerHTML
          : ARROWS.test(el.textContent.trim())
            ? `glyph:${el.textContent.trim()}`
            : (({ kind, image }) => `${kind}:${image}`)(cssIconOf(el))
      const g = groups.get(key) ?? []
      g.push(el)
      groups.set(key, g)
    }
    return [...groups.entries()]
      .map(([shape, g]) => {
        const areas = {}
        for (const el of g) areas[areaOf(el)] = (areas[areaOf(el)] ?? 0) + 1
        // One example per area first, so every place it shows is covered
        const firsts = Object.keys(areas).map((a) =>
          g.find((el) => areaOf(el) === a),
        )
        const rest = g.filter((el) => !firsts.includes(el))
        return {
          shape: short(shape, 400),
          count: g.length,
          areas,
          examples: [...firsts, ...rest].slice(0, 5).map(describe),
        }
      })
      .sort((a, b) => b.count - a.count)
  }

  const contextIcons = contextRows.flatMap((label) => {
    const row =
      label.closest('button,[role=button],li,summary') ??
      label.parentElement?.parentElement
    return row ? iconsIn(row).map(describe) : []
  })

  // The markup of each expandable row in the sidebar and the Context panel,
  // with any icon CSS draws inside it
  const expandables = [...document.querySelectorAll('[aria-expanded]')]
    .filter((e) => areaOf(e) !== 'elsewhere')
    .slice(0, 12)
    .map((e) => ({
      area: areaOf(e),
      expanded: e.getAttribute('aria-expanded'),
      text: short(e.textContent.trim(), 80),
      html: short(e.outerHTML, 2500),
      cssIcons: [e, ...e.querySelectorAll('*')]
        .map((d) => ({ el: d, css: cssIconOf(d) }))
        .filter((x) => x.css)
        .map(({ el, css }) => ({
          tag: el.tagName.toLowerCase(),
          class: classOf(el),
          ...css,
          image: short(css.image, 600),
        })),
    }))

  const report = {
    userAgent: navigator.userAgent,
    sidebarFound: sidebar !== document.body,
    contextPanelFound: contextRows.length > 0,
    // Every icon shape in the app, the most common first
    icons: byShape(iconsIn(document.body)),
    contextIcons,
    expandables,
  }
  copyText(JSON.stringify(report, null, 1))
  console.log(
    `[arrows] copied: ${report.icons.length} icon shapes in the app, ` +
      `${contextIcons.length} in the Context panel, ` +
      `${expandables.length} expandable rows` +
      (report.contextPanelFound
        ? ''
        : ' (open the Context panel and run again for its chevron)'),
  )
})()
