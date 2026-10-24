// Run in the Claude app's DevTools Console with no theme applied (restart
// Claude, or run the Revert command first). It reads Claude's own default
// colors in light and dark mode and copies them to the clipboard as JSON, to
// build the "Claude" presets from.
;(() => {
  const copyText = copy // DevTools' copy(), kept before anything async
  const root = document.documentElement
  if (
    document.getElementById('claude-theme-tuner-theme') ||
    document.getElementById('user-solarized-light-theme')
  ) {
    console.log(
      '[stock] a theme is applied: run the Revert command or restart Claude first',
    )
    return
  }
  const vars = [
    '--cds-surface-0',
    '--cds-surface-1',
    '--cds-surface-2',
    '--cds-surface-3',
    '--cds-surface-panel',
    '--cds-surface-popover',
    '--cds-page-bg',
    '--cds-fill-field',
    '--cds-text-primary',
    '--cds-text-secondary',
    '--cds-text-muted',
    '--cds-role-accent-400',
    '--cds-role-accent-450',
    '--cds-role-accent-600',
    '--cds-fill-accent',
    '--cds-text-accent',
    '--cds-on-accent',
    '--cds-role-accent-on',
    '--cds-border',
    '--cds-border-strong',
    '--cds-bg-neutral',
    '--cds-bg-user-message',
    '--cds-fill-ghost-hover',
    '--cds-fill-ghost-selected',
    '--cds-alpha-1',
    '--cds-fizzy-lake-color-sidebar',
    '--df-selected',
    '--df-hover',
    '--df-sidebar-bg',
  ]
  // Resolves a variable to the color it paints (var() chains, color-mix and
  // alpha included) by applying it to a probe element inside the given scope
  const resolve = (scope, name) => {
    const probe = document.createElement('div')
    probe.style.cssText = `position:fixed;left:-9999px;color:var(${name})`
    scope.appendChild(probe)
    const raw = getComputedStyle(scope).getPropertyValue(name).trim()
    const color = raw ? getComputedStyle(probe).color : null
    probe.remove()
    return { raw, color }
  }
  const sidebar = document.querySelector('.dframe-sidebar') || root
  const readMode = (mode) => {
    const before = root.dataset.mode
    root.dataset.mode = mode
    const out = {}
    for (const name of vars)
      out[name] = resolve(name.startsWith('--df') ? sidebar : root, name)
    out.sidebarPaint = getComputedStyle(sidebar).backgroundColor
    if (before === undefined) delete root.dataset.mode
    else root.dataset.mode = before
    return out
  }
  const report = {
    userAgent: navigator.userAgent,
    currentMode: root.dataset.mode,
    light: readMode('light'),
    dark: readMode('dark'),
  }
  copyText(JSON.stringify(report, null, 1))
  console.log('[stock] Claude default colors copied for light and dark mode')
})()
