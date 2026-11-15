// For maintainers: run in the Claude app's DevTools Console (like the theme
// snippet) after an app update breaks the theme. It copies a JSON report to
// the clipboard: what paints the sidebar, chat, side panels and composer, and
// every color-like CSS variable the app defines, so the tokens in
// src/theme/tokens.ts can be matched to the new names. See
// doc/claude-internals.md.
;(() => {
  const root = document.documentElement
  // Spots to sample, as fractions of the window
  const points = {
    sidebar: [0.06, 0.55],
    sidebarTop: [0.06, 0.1],
    chat: [0.45, 0.5],
    composer: [0.5, 0.95],
    topBar: [0.5, 0.02],
    rightPanel: [0.82, 0.3],
    filesPane: [0.94, 0.5],
  }
  const classOf = (el) =>
    String(el.className?.baseVal ?? el.className ?? '').slice(0, 240)
  // The element at a spot and its ancestors that paint a background
  const chainAt = ([fx, fy]) => {
    const chain = []
    for (
      let el = document.elementFromPoint(fx * innerWidth, fy * innerHeight);
      el && el !== root;
      el = el.parentElement
    ) {
      const bg = getComputedStyle(el).backgroundColor
      if (bg !== 'rgba(0, 0, 0, 0)' || chain.length === 0) {
        chain.push({
          tag: el.tagName.toLowerCase(),
          class: classOf(el),
          data: Object.keys(el.dataset).join(','),
          bg,
        })
      }
      if (chain.length >= 6) break
    }
    return chain
  }

  // Every custom property name any readable stylesheet sets
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
  const colorish =
    /surface|bg|background|sidebar|panel|fill|frame|card|canvas|z\d|hover|selected|border|text|accent/
  const varsOn = (el, base) => {
    const style = getComputedStyle(el)
    const out = {}
    for (const n of [...names].sort()) {
      if (!colorish.test(n)) continue
      const v = style.getPropertyValue(n).trim()
      if (v && (!base || base[n] !== v)) out[n] = v
    }
    return out
  }

  const report = {
    userAgent: navigator.userAgent,
    mode: root.dataset.mode,
    htmlClass: classOf(root),
    themeLoaded: Boolean(
      document.getElementById('claude-theme-tuner-theme') ||
      document.getElementById('user-solarized-light-theme'),
    ),
    points: Object.fromEntries(
      Object.entries(points).map(([k, p]) => [k, chainAt(p)]),
    ),
    rootVars: varsOn(root),
  }
  // Variables that differ inside the sidebar and the right panel (frames often set their own)
  for (const k of ['sidebar', 'rightPanel', 'filesPane']) {
    const [fx, fy] = points[k]
    const el = document.elementFromPoint(fx * innerWidth, fy * innerHeight)
    if (el) report[`${k}Vars`] = varsOn(el, report.rootVars)
  }
  // Class names that look like layout frames, to spot renames
  const frameClasses = new Set()
  for (const el of document.querySelectorAll('[class]')) {
    for (const c of classOf(el).split(/\s+/))
      if (/frame|sidebar|df-|panel|pane|shell/i.test(c)) frameClasses.add(c)
  }
  report.frameClasses = [...frameClasses].sort().slice(0, 300)

  // Every sidebar, docked or overlaid, with its color and the rules that set
  // its background or the variables feeding it (the source of a wrong shade)
  const ruleList = []
  const collect = (rules) => {
    for (const rule of rules) {
      if (rule.selectorText && rule.style) ruleList.push(rule)
      if (rule.cssRules) collect(rule.cssRules)
    }
  }
  for (const sheet of document.styleSheets) {
    try {
      collect(sheet.cssRules)
    } catch {
      /* cross-origin sheet */
    }
  }
  const feeds =
    /^(background|--df-sidebar|--df-web-sidebar|--cds-fizzy|--cds-surface)/
  report.sidebars = [
    ...document.querySelectorAll('.dframe-sidebar, aside'),
  ].map((el) => {
    const style = getComputedStyle(el)
    const rules = []
    for (const rule of ruleList) {
      let matches = false
      try {
        matches = el.matches(rule.selectorText)
      } catch {
        /* selector with pseudo-elements */
      }
      if (!matches) continue
      const decls = [...rule.style]
        .filter((p) => feeds.test(p))
        .map((p) => `${p}: ${rule.style.getPropertyValue(p).trim()}`)
        // A background shorthand with var() leaves its longhands empty
        .concat(
          rule.style.getPropertyValue('background')
            ? [
                `background: ${rule.style.getPropertyValue('background').trim()}`,
              ]
            : [],
        )
      if (decls.length)
        rules.push({ selector: rule.selectorText.slice(0, 300), decls })
    }
    const { width, height } = el.getBoundingClientRect()
    return {
      class: classOf(el),
      data: Object.fromEntries(Object.entries(el.dataset)),
      size: `${Math.round(width)}x${Math.round(height)}`,
      bg: style.backgroundColor,
      bgImage: style.backgroundImage.slice(0, 200),
      tint: style.getPropertyValue('--df-sidebar-tint').trim(),
      tintShare: style.getPropertyValue('--df-sidebar-tint-share').trim(),
      tintMixed: style.getPropertyValue('--df-sidebar-tint-mixed').trim(),
      rules,
    }
  })

  // The rules setting the main surface and text variables, with their
  // selectors: the theme's rules have to outrank these
  const mainVars =
    /^(--cds-surface-[01]|--cds-text-primary|--cds-page-bg|--bg-000|background-color)$/
  const chat =
    document.querySelector('.dframe-content') || document.querySelector('main')
  report.mainRules = [
    ['html', root],
    ['body', document.body],
    ['chat', chat],
  ]
    .filter(([, el]) => el)
    .map(([name, el]) => ({
      element: name,
      class: classOf(el).slice(0, 160),
      rules: ruleList
        .filter((rule) => {
          try {
            return el.matches(rule.selectorText)
          } catch {
            return false
          }
        })
        .map((rule) => ({
          selector: rule.selectorText.slice(0, 300),
          media: rule.parentRule?.conditionText ?? null,
          decls: [...rule.style]
            .filter((p) => mainVars.test(p))
            .map(
              (p) =>
                `${p}: ${rule.style.getPropertyValue(p).trim()}${rule.style.getPropertyPriority(p) ? ' !important' : ''}`,
            ),
        }))
        .filter((r) => r.decls.length),
      computed: {
        surface1: getComputedStyle(el)
          .getPropertyValue('--cds-surface-1')
          .trim(),
        text: getComputedStyle(el)
          .getPropertyValue('--cds-text-primary')
          .trim(),
        bg: getComputedStyle(el).backgroundColor,
      },
    }))

  // The composer and every container around it, up to <body>, with the rules
  // that paint them or re-set surface variables locally (a local declaration
  // beats one inherited from <html>, even an !important one)
  const localVars = /^(background|--cds-surface|--cds-fill|--cds-bg|--bg-)/
  const composerSpot = document.elementFromPoint(
    points.composer[0] * innerWidth,
    points.composer[1] * innerHeight,
  )
  report.composerStack = []
  for (
    let el = composerSpot;
    el && el !== document.body;
    el = el.parentElement
  ) {
    const rules = ruleList
      .filter((rule) => {
        try {
          return el.matches(rule.selectorText)
        } catch {
          return false
        }
      })
      .map((rule) => ({
        selector: rule.selectorText.slice(0, 240),
        decls: [...rule.style]
          .filter((p) => localVars.test(p))
          .map((p) => `${p}: ${rule.style.getPropertyValue(p).trim()}`)
          // A background shorthand with var() leaves its longhands empty
          .concat(
            rule.style.getPropertyValue('background')
              ? [
                  `background: ${rule.style.getPropertyValue('background').trim()}`,
                ]
              : [],
          ),
      }))
      .filter((r) => r.decls.length)
    const { width, height } = el.getBoundingClientRect()
    report.composerStack.push({
      tag: el.tagName.toLowerCase(),
      class: classOf(el).slice(0, 200),
      size: `${Math.round(width)}x${Math.round(height)}`,
      bg: getComputedStyle(el).backgroundColor,
      inline: (el.getAttribute('style') || '').slice(0, 200),
      rules,
    })
  }

  // Large surfaces still painted white or a light neutral gray: what the
  // theme missed, wherever it sits (sample points can miss panes when docked
  // DevTools shrinks the window)
  const neutral = (bg) => {
    const m = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(bg)
    if (!m || (m[4] !== undefined && Number(m[4]) < 0.5)) return false
    const [r, g, b] = [m[1], m[2], m[3]].map(Number)
    return (
      Math.min(r, g, b) >= 225 && Math.max(r, g, b) - Math.min(r, g, b) <= 6
    )
  }
  const seen = new Set()
  report.neutralSurfaces = []
  for (const el of document.querySelectorAll('body *')) {
    const { width, height } = el.getBoundingClientRect()
    if (width * height < 8000) continue
    const bg = getComputedStyle(el).backgroundColor
    if (!neutral(bg)) continue
    const key = classOf(el) + bg
    if (seen.has(key)) continue
    seen.add(key)
    report.neutralSurfaces.push({
      tag: el.tagName.toLowerCase(),
      class: classOf(el),
      data: Object.keys(el.dataset).join(','),
      parentClass: el.parentElement
        ? classOf(el.parentElement).slice(0, 120)
        : '',
      bg,
      size: `${Math.round(width)}x${Math.round(height)}`,
    })
    if (report.neutralSurfaces.length >= 60) break
  }

  copy(JSON.stringify(report, null, 1))
  console.log(
    '[theme] diagnostic copied to the clipboard:',
    Object.keys(report.rootVars).length,
    'variables',
  )
})()
