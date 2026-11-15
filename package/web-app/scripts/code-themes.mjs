// Generates src/theme/code-themes.ts: a preset for each code theme in the
// Claude desktop app's "Code appearance" setting that has no hand-tuned
// preset in presets.ts (Solarized, GitHub Light, Catppuccin, Dracula, Nord,
// Monokai, Tokyo Night and One Dark Pro are tuned by hand). Claude highlights
// code with Shiki, so each theme is read from the VS Code theme JSON Shiki
// ships (tm-themes, pinned below; Pierre from @pierre/theme) and its UI colors
// are mapped onto the palette roles. Colors that fall below WCAG AA as UI
// text are adjusted just enough, and the generated file says which.
//
//   pnpm run code-themes
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const TM_THEMES = 'https://cdn.jsdelivr.net/npm/tm-themes@1.10.6'
const PIERRE = 'https://cdn.jsdelivr.net/npm/@pierre/theme@2.0.0'

// [preset id, name shown in Claude, source theme]
const THEMES = [
  ['pierre-light', 'Pierre Light', 'pierre:pierre-light'],
  ['vs-code-light', 'VS Code Light', 'light-plus'],
  ['one-light', 'One Light', 'one-light'],
  ['vitesse-light', 'Vitesse Light', 'vitesse-light'],
  ['min-light', 'Min Light', 'min-light'],
  ['rose-pine-dawn', 'Rosé Pine Dawn', 'rose-pine-dawn'],
  ['slack-ochin', 'Slack Ochin', 'slack-ochin'],
  ['github-dark', 'GitHub Dark', 'github-dark'],
  ['github-dark-dimmed', 'GitHub Dark Dimmed', 'github-dark-dimmed'],
  ['pierre-dark', 'Pierre Dark', 'pierre:pierre-dark'],
  ['vs-code-dark', 'VS Code Dark', 'dark-plus'],
  ['dracula-soft', 'Dracula Soft', 'dracula-soft'],
  ['vitesse-dark', 'Vitesse Dark', 'vitesse-dark'],
  ['min-dark', 'Min Dark', 'min-dark'],
  ['night-owl', 'Night Owl', 'night-owl'],
  ['rose-pine', 'Rosé Pine', 'rose-pine'],
  ['ayu-dark', 'Ayu Dark', 'ayu-dark'],
  ['slack-dark', 'Slack Dark', 'slack-dark'],
]

// Who to credit, by GitHub owner of the theme's source
const AUTHORS = {
  akamud: 'Mahmoud Ali',
  antfu: 'Anthony Fu',
  'ayu-theme': 'the ayu authors',
  Binaryify: 'Binaryify',
  dracula: 'the Dracula team',
  microsoft: 'Microsoft',
  misolori: 'Miguel Solorio',
  pierrecomputer: 'Pierre',
  primer: 'GitHub',
  'rose-pine': 'the Rosé Pine team',
  sdras: 'Sarah Drasner',
  'slack-theme': 'Slack',
}

// ---------- color math ----------

// #rgb, #rgba, #rrggbb or #rrggbbaa → { r, g, b, a }
const parse = (value) => {
  let hex = value.trim().replace('#', '')
  if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('')
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  }
}
const toHex = ({ r, g, b }) =>
  '#' +
  [r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
// A color, translucent ones blended over `base`, as #rrggbb
const solid = (value, base) => {
  const c = parse(value)
  if (c.a >= 1 || !base) return toHex(c)
  const b = parse(base)
  return toHex({
    r: b.r + (c.r - b.r) * c.a,
    g: b.g + (c.g - b.g) * c.a,
    b: b.b + (c.b - b.b) * c.a,
  })
}
const mix = (a, b, amount) => {
  const x = parse(a)
  const y = parse(b)
  return toHex({
    r: x.r + (y.r - x.r) * amount,
    g: x.g + (y.g - x.g) * amount,
    b: x.b + (y.b - x.b) * amount,
  })
}
const luminance = (hex) => {
  const { r, g, b } = parse(hex)
  const lin = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const saturation = (hex) => {
  const { r, g, b } = parse(hex)
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
}

// ---------- mapping ----------

// The least contrast between primary and secondary text (Claude's own dark
// theme has about 2.4), so its thinking reads as quieter than its answers
const TEXT_GAP = 1.5

const isLightColor = (hex) => luminance(hex) > 0.4
const isDarkColor = (hex) => luminance(hex) < 0.12

// The first of `keys` the theme sets, made solid over `base`, that `accept`s
const pick = (colors, keys, base, accept = () => true) => {
  for (const key of keys) {
    const value = colors[key]
    if (!value || !/^#[0-9a-f]{3,8}$/i.test(value)) continue
    const hex = solid(value, base)
    if (accept(hex)) return hex
  }
  return null
}

// Moves `fg` toward black or white, a step at a time, until it reads at
// `min` against every background
const readable = (fg, bgs, min, towardWhite) => {
  let color = fg
  for (let step = 0; step < 60; step += 1) {
    if (bgs.every((bg) => contrast(color, bg) >= min)) return color
    color = mix(color, towardWhite ? '#ffffff' : '#000000', 0.04)
  }
  return color
}

const paletteOf = (theme, mode) => {
  const c = theme.colors ?? {}
  const light = mode === 'light'
  const sameMode = light ? isLightColor : isDarkColor
  const shade = (hex, amount) => mix(hex, light ? '#000000' : '#ffffff', amount)

  const canvas =
    pick(c, ['editor.background'], null) ?? (light ? '#ffffff' : '#1e1e1e')
  // The sidebar, unless it is the other mode's color (Slack Ochin's navy
  // sidebar in a light theme) or the canvas itself
  const frame =
    pick(
      c,
      [
        'sideBar.background',
        'activityBar.background',
        'editorGroupHeader.tabsBackground',
        'tab.inactiveBackground',
        'panel.background',
      ],
      canvas,
      (hex) => sameMode(hex) && hex.toLowerCase() !== canvas.toLowerCase(),
    ) ?? shade(canvas, light ? 0.025 : 0.04)
  const raised =
    pick(
      c,
      [
        'editorWidget.background',
        'dropdown.background',
        'input.background',
        'quickInput.background',
      ],
      canvas,
      // Cards must stand out from the canvas, however slightly
      (hex) => sameMode(hex) && contrast(hex, canvas) >= 1.03,
    ) ?? mix(canvas, frame, 0.5)
  const pressed =
    pick(
      c,
      ['list.hoverBackground', 'toolbar.hoverBackground'],
      frame,
      (hex) => sameMode(hex) && contrast(hex, frame) >= 1.08,
    ) ?? shade(raised, 0.05)

  const text =
    pick(c, ['editor.foreground', 'foreground'], canvas) ??
    (light ? '#1f1f1f' : '#e0e0e0')
  const textSecondary =
    pick(
      c,
      ['sideBar.foreground', 'foreground', 'tab.inactiveForeground'],
      frame,
      // Not a color meant for the other mode's sidebar (Slack Ochin), and
      // dimmer than the text, so Claude's thinking and labels stand apart
      (hex) =>
        hex !== text &&
        contrast(hex, frame) >= 3 &&
        contrast(hex, canvas) < contrast(text, canvas),
    ) ?? mix(text, canvas, 0.25)
  const textMuted =
    pick(
      c,
      [
        'descriptionForeground',
        'editorLineNumber.activeForeground',
        'tab.inactiveForeground',
      ],
      canvas,
      // No brighter than the secondary text (Night Owl's description color
      // is brighter than its text)
      (hex) =>
        hex !== text &&
        contrast(hex, canvas) >= 3 &&
        contrast(hex, canvas) <= contrast(textSecondary, canvas) + 0.05,
    ) ?? mix(text, canvas, 0.4)

  const vivid = (hex) => saturation(hex) > 0.3 && contrast(hex, canvas) > 1.6
  const accent =
    pick(
      c,
      [
        'textLink.foreground',
        'button.background',
        'focusBorder',
        'activityBarBadge.background',
        'editorCursor.foreground',
      ],
      canvas,
      vivid,
    ) ?? (light ? '#0066b8' : '#3794ff')
  const accentHover =
    pick(
      c,
      ['textLink.activeForeground', 'button.hoverBackground'],
      canvas,
      (hex) => vivid(hex) && hex !== accent,
    ) ?? shade(accent, 0.12)
  const selected =
    pick(
      c,
      [
        'list.activeSelectionBackground',
        'list.inactiveSelectionBackground',
        'editor.selectionBackground',
      ],
      frame,
      // Visible on our frame (minimal themes like Vitesse select with a gray
      // meant for a white sidebar, which vanishes on a shaded one) and
      // readable under the text, so it needn't be faded for AA
      (hex) => contrast(text, hex) >= 4.5 && contrast(hex, frame) >= 1.15,
    ) ??
    // Otherwise an accent tint of the frame, as strong as the text allows,
    // or a plain shade of it
    [0.18, 0.14, 0.1]
      .map((amount) => mix(frame, accent, amount))
      .find(
        (hex) => contrast(text, hex) >= 4.5 && contrast(hex, frame) >= 1.1,
      ) ??
    shade(frame, 0.1)
  const wash =
    pick(
      c,
      ['badge.background', 'activityBarBadge.background', 'button.background'],
      canvas,
      vivid,
    ) ?? accent

  return {
    frame,
    canvas,
    raised,
    pressed,
    text,
    textSecondary,
    textMuted,
    line: textSecondary,
    accent,
    accentHover,
    selected,
    wash,
    buttonFg: pick(c, ['button.foreground'], null),
  }
}

// Adjusts what falls below AA, like the hand-tuned presets, and notes it
const fix = (p, mode) => {
  const light = mode === 'light'
  const notes = {}
  const theme = { ...p } // the theme's own colors, for the notes
  const set = (key, value, why) => {
    if (value.toLowerCase() !== p[key].toLowerCase()) {
      notes[key] = `${why} (was ${theme[key]})`
      p[key] = value
    }
  }
  // Primary text also sits on the selected row; nudging the text keeps the
  // selection visible (Min Dark's dim text would otherwise fade it away)
  for (const key of ['text', 'textSecondary', 'textMuted'])
    set(
      key,
      readable(
        p[key],
        key === 'text' ? [p.canvas, p.frame, p.selected] : [p.canvas, p.frame],
        4.5,
        !light,
      ),
      light ? 'darkened for AA' : 'lightened for AA',
    )
  // Claude draws its thinking in the secondary color, so keep it at least
  // TEXT_GAP from the text: dim the secondary while it stays AA, and only
  // then lift the text (themes whose text is dim to begin with, like Min)
  let text = p.text
  let secondary = p.textSecondary
  for (let i = 0; i < 120 && contrast(text, secondary) < TEXT_GAP; i += 1) {
    const dimmer = mix(secondary, p.canvas, 0.02)
    if (contrast(dimmer, p.canvas) >= 4.5 && contrast(dimmer, p.frame) >= 4.5)
      secondary = dimmer
    else text = mix(text, light ? '#000000' : '#ffffff', 0.02)
  }
  set('textSecondary', secondary, 'dimmed to stand apart from the text')
  set(
    'text',
    text,
    light ? 'darkened to stand apart' : 'lightened to stand apart',
  )
  // Muted text no brighter than the secondary
  let muted = p.textMuted
  for (
    let i = 0;
    i < 120 && contrast(muted, p.canvas) > contrast(secondary, p.canvas) + 0.05;
    i += 1
  ) {
    const dimmer = mix(muted, p.canvas, 0.02)
    if (contrast(dimmer, p.canvas) < 4.5 || contrast(dimmer, p.frame) < 4.5)
      break
    muted = dimmer
  }
  set('textMuted', muted, 'dimmed below the secondary text')
  // Last resort if the text still can't read on it: move it toward the canvas
  let selected = p.selected
  for (let i = 0; i < 25 && contrast(p.text, selected) < 4.5; i += 1)
    selected = mix(selected, p.canvas, 0.08)
  set('selected', selected, 'eased toward the canvas for AA')
  // The accent reads on the canvas, and button text reads on the accent
  const onAccent = (accent) =>
    [p.buttonFg, '#ffffff', p.canvas, '#000000']
      .filter(Boolean)
      .map((v) => solid(v, accent))
      .find((v) => contrast(v, accent) >= 4.5)
  let accent = readable(p.accent, [p.canvas], 4.5, !light)
  for (let i = 0; i < 30 && !onAccent(accent); i += 1)
    accent = mix(accent, light ? '#000000' : '#ffffff', 0.04)
  set('accent', accent, light ? 'darkened for AA' : 'lightened for AA')
  p.onAccent = onAccent(accent) ?? (light ? '#ffffff' : '#000000')
  p.accentHover = readable(p.accentHover, [p.canvas], 4.5, !light)
  p.line = p.textSecondary
  delete p.buttonFg
  return notes
}

// ---------- output ----------

const fetchJson = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

// The tm-themes index (licenses and sources) is a module; Node can't import
// one over https, so it is saved to a temporary file first
const loadIndex = async () => {
  const text = await (await fetch(`${TM_THEMES}/index.js`)).text()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-themes-'))
  const file = path.join(dir, 'index.mjs')
  fs.writeFileSync(file, text)
  try {
    return (await import(file)).themes
  } finally {
    fs.rmSync(dir, { recursive: true })
  }
}
const index = await loadIndex()

const ORDER = [
  'frame',
  'canvas',
  'raised',
  'pressed',
  'text',
  'textSecondary',
  'textMuted',
  'line',
  'accent',
  'accentHover',
  'onAccent',
  'selected',
  'wash',
]

const entries = []
for (const [id, name, source] of THEMES) {
  const pierre = source.startsWith('pierre:')
  const file = pierre ? source.slice(7) : source
  const theme = await fetchJson(
    pierre
      ? `${PIERRE}/themes/${file}.json`
      : `${TM_THEMES}/themes/${file}.json`,
  )
  const meta = pierre
    ? {
        license: 'Apache-2.0',
        source: 'https://github.com/pierrecomputer/pierre',
      }
    : index.find((t) => t.name === file)
  if (!meta) throw new Error(`no tm-themes entry for ${file}`)
  const mode = (theme.type ?? meta.type) === 'light' ? 'light' : 'dark'
  const repo = meta.source.match(/github\.com\/([^/]+)\/([^/]+)/)
  const owner = repo[1]
  const palette = paletteOf(theme, mode)
  const notes = fix(palette, mode)
  const lines = ORDER.map(
    (key) =>
      `      ${key}: '${palette[key]}',${notes[key] ? ` // ${notes[key]}` : ''}`,
  )
  entries.push(`  {
    id: '${id}',
    name: '${name}',
    mode: '${mode}',
    credit: {
      name: '${(meta.displayName ?? name).replace(/'/g, "\\'")} by ${(AUTHORS[owner] ?? owner).replace(/'/g, "\\'")}',
      url: 'https://github.com/${owner}/${repo[2]}',
      license: '${meta.license}',
    },
    palette: {
${lines.join('\n')}
    },
  },`)
  console.log(
    `${name.padEnd(20)} ${mode}  ${Object.keys(notes).length} adjusted`,
  )
}

const out = `/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { type Theme } from './palette'

// Generated by scripts/code-themes.mjs (pnpm run code-themes); edit that
// script, not this file. One preset per code theme in Claude's "Code
// appearance" setting that has no hand-tuned preset in presets.ts, mapped from
// the theme's VS Code UI colors.
export const CODE_THEME_PRESETS: Theme[] = [
${entries.join('\n')}
]
`
fs.writeFileSync(
  path.join(import.meta.dirname, '..', 'src', 'theme', 'code-themes.ts'),
  out,
)
console.log(`Wrote ${entries.length} presets to src/theme/code-themes.ts`)
