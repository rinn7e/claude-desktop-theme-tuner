/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
// The setup a person picks, and the look the mod sends Claude for it. Plain
// TypeScript with no engine import, so the web tuner's tests run it too.
//
// A setup is the JSON of the web tuner's share links (#theme=...): per mode
// a preset and the colors that change. The tuner's palette has 13 roles; a
// mod look takes a few anchors and the design system derives the rest, so
// the surfaces, the three texts and the accent go across, and the code
// theme of the preset's own name (each preset matches one of Claude's code
// themes).
import { PRESETS, type Preset } from './presets'

export const PALETTE_KEYS = [
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
] as const

export type PaletteKey = (typeof PALETTE_KEYS)[number]
export type Palette = Record<PaletteKey, string>
export type Mode = 'light' | 'dark'

export interface ModeChoice {
  preset?: string
  name?: string
  colors?: Partial<Record<PaletteKey, string>>
}

export interface Setup {
  light?: ModeChoice
  dark?: ModeChoice
}

// One mode, resolved: the colors to draw with, what to call them, and the
// code theme that goes with them
export interface Resolved {
  name: string
  palette: Palette
  codeTheme?: string
  // Claude's own colors, untouched: the look leaves the mode to the app,
  // code theme included (a look must set colors to set one)
  isStock?: boolean
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

const MODES: Mode[] = ['light', 'dark']
// The presets that are Claude's own colors, measured from the app
const STOCK_PRESETS = ['claude-light', 'claude-dark']
const HEX = /^#[0-9a-f]{6}$/i

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export const presetById = (id: string): Preset | undefined =>
  PRESETS.find((p) => p.id === id)

// A name is shown in the pane and sent as the look's label: plain, short
export const cleanName = (name: string): string =>
  name
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 60)

// A mode as the setup gives it: a preset with the colors that change, or
// all 13 colors with no preset (a theme from a preset file)
export const resolveMode = (mode: Mode, raw: unknown): Result<Resolved> => {
  if (!isRecord(raw))
    return { ok: false, error: `The ${mode} theme is invalid.` }
  const { preset: presetId, name, colors = {} } = raw
  if (!isRecord(colors))
    return { ok: false, error: `The ${mode} colors are invalid.` }
  for (const [key, value] of Object.entries(colors)) {
    if (!(PALETTE_KEYS as readonly string[]).includes(key))
      return {
        ok: false,
        error: `Unknown color "${key}" in the ${mode} theme.`,
      }
    if (typeof value !== 'string' || !HEX.test(value))
      return {
        ok: false,
        error: `The ${mode} theme has an invalid color (${key}).`,
      }
  }
  let base: Partial<Palette> = {}
  let baseName = 'Custom'
  let codeTheme: string | undefined
  if (presetId !== undefined) {
    const preset =
      typeof presetId === 'string' ? presetById(presetId) : undefined
    if (!preset) return { ok: false, error: `No preset "${String(presetId)}".` }
    if (preset.mode !== mode)
      return { ok: false, error: `"${preset.id}" is a ${preset.mode} preset.` }
    base = preset.palette
    baseName = preset.name
    codeTheme = preset.codeTheme
  }
  const palette: Partial<Palette> = { ...base }
  for (const [key, value] of Object.entries(colors))
    palette[key as PaletteKey] = (value as string).toLowerCase()
  const missing = PALETTE_KEYS.find((k) => palette[k] === undefined)
  if (missing)
    return {
      ok: false,
      error: `The ${mode} theme needs a preset or all 13 colors (${missing} is missing).`,
    }
  return {
    ok: true,
    value: {
      name:
        typeof name === 'string' && cleanName(name)
          ? cleanName(name)
          : baseName,
      palette: palette as Palette,
      ...(codeTheme ? { codeTheme } : {}),
      ...(typeof presetId === 'string' &&
      STOCK_PRESETS.includes(presetId) &&
      Object.keys(colors).length === 0
        ? { isStock: true }
        : {}),
    },
  }
}

// Checks a setup from anywhere (the store, a link, the model) and keeps the
// modes it names, in the setup's own shape
export const checkSetup = (raw: unknown): Result<Setup> => {
  if (!isRecord(raw)) return { ok: false, error: 'The theme is invalid.' }
  const setup: Setup = {}
  for (const mode of MODES) {
    const choice = raw[mode]
    if (choice === undefined || choice === null) continue
    const resolved = resolveMode(mode, choice)
    if (!resolved.ok) return resolved
    const { preset, name, colors } = choice as ModeChoice
    setup[mode] = {
      ...(preset ? { preset } : {}),
      ...(typeof name === 'string' && cleanName(name)
        ? { name: cleanName(name) }
        : {}),
      ...(colors && Object.keys(colors).length
        ? {
            colors: Object.fromEntries(
              Object.entries(colors).map(([k, v]) => [k, v.toLowerCase()]),
            ),
          }
        : {}),
    }
  }
  return { ok: true, value: setup }
}

// Whether a text is preset ids rather than a link or JSON: ids name only the
// modes they change, so the caller keeps the other mode
export const isPresetList = (text: string): boolean => {
  const input = text.trim()
  return (
    input !== '' && !input.startsWith('{') && !/#(?:.*&)?theme=/.test(input)
  )
}

// What a person or the model hands over: a tuner link (its #theme=...), the
// JSON itself, or preset ids ("solarized-light dracula", one per mode)
export const parseSetup = (text: string): Result<Setup> => {
  const input = text.trim()
  if (!input) return { ok: false, error: 'Nothing to apply.' }
  const hash = input.match(/#(?:.*&)?theme=([^&\s]+)/)
  if (hash || input.startsWith('{')) {
    let raw: unknown
    try {
      raw = JSON.parse(hash?.[1] ? decodeURIComponent(hash[1]) : input)
    } catch {
      return { ok: false, error: "The theme isn't valid JSON." }
    }
    return checkSetup(raw)
  }
  const setup: Setup = {}
  for (const id of input.split(/[\s,]+/)) {
    const preset = presetById(id)
    if (!preset)
      return {
        ok: false,
        error: `No preset "${id}". \`/tuner list\` names them.`,
      }
    if (setup[preset.mode])
      return {
        ok: false,
        error: `Two ${preset.mode} presets: give one per mode.`,
      }
    setup[preset.mode] = { preset: preset.id }
  }
  return { ok: true, value: setup }
}

// The share link the web tuner opens with this setup
export const tunerLink = (base: string, setup: Setup): string =>
  `${base}#theme=${encodeURIComponent(JSON.stringify(setup))}`

// ---------- the look ----------

const channels = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

// A step of `amount` (0 to 1) from one color toward another
const mixHex = (from: string, to: string, amount: number): string => {
  const [r1, g1, b1] = channels(from)
  const [r2, g2, b2] = channels(to)
  const step = (a: number, b: number) =>
    Math.round(a + (b - a) * amount)
      .toString(16)
      .padStart(2, '0')
  return `#${step(r1, r2)}${step(g1, g2)}${step(b1, b2)}`
}

const luminance = (hex: string): number => {
  const linear = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = channels(hex)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

// A look's surfaces run from the darkest (surface-0, the sidebar and page)
// up, in both modes: the frame and canvas are sent darker first, whichever
// that is. The menus (surface-3) are left for the design system to derive:
// a preset's raised color is often far lighter than its canvas, and a dark
// surface-3 that light makes the text on it fail Claude's contrast check,
// which then paints none of the look.
//
// Claude also wants muted text no stronger than secondary; presets where the
// two are a hair apart the wrong way send muted as secondary.
const anchorsOf = (mode: Mode, p: Palette) => {
  const frameIsDarker = luminance(p.frame) <= luminance(p.canvas)
  const low = frameIsDarker ? p.frame : p.canvas
  const high = frameIsDarker ? p.canvas : p.frame
  const strength = (hex: string) =>
    mode === 'light' ? -luminance(hex) : luminance(hex)
  const muted =
    strength(p.textMuted) > strength(p.textSecondary)
      ? p.textSecondary
      : p.textMuted
  return {
    'surface-0': low,
    'surface-1': high,
    'surface-2': high,
    'text-primary': p.text,
    'text-secondary': p.textSecondary,
    'text-muted': muted,
  }
}

export interface LookDefinition {
  label: string
  id: string
  light?: {
    gray: { anchors: ReturnType<typeof anchorsOf> }
    roles: { accent: string }
  }
  dark?: {
    gray: { anchors: ReturnType<typeof anchorsOf> }
    roles: { accent: string }
  }
  codeTheme?: { light?: string; dark?: string }
}

// What `makeColors` is given for the resolved modes; a mode left out keeps
// Claude's own colors
export const lookDefinition = (
  modes: Partial<Record<Mode, Resolved>>,
): LookDefinition => {
  const label =
    MODES.flatMap((m) => (modes[m] ? [modes[m].name] : [])).join(' / ') ||
    'Theme Tuner'
  // makeColors takes a label of 1 to 64 characters
  const def: LookDefinition = { label: label.slice(0, 64), id: 'theme-tuner' }
  const codeTheme: { light?: string; dark?: string } = {}
  for (const mode of MODES) {
    const resolved = modes[mode]
    if (!resolved) continue
    if (resolved.codeTheme) codeTheme[mode] = resolved.codeTheme
    if (resolved.isStock) continue
    def[mode] = {
      gray: { anchors: anchorsOf(mode, resolved.palette) },
      roles: { accent: resolved.palette.accent },
    }
  }
  if (Object.keys(codeTheme).length) def.codeTheme = codeTheme
  return def
}

// The resolved modes of a setup already checked
export const resolveSetup = (setup: Setup): Partial<Record<Mode, Resolved>> => {
  const out: Partial<Record<Mode, Resolved>> = {}
  for (const mode of MODES) {
    const choice = setup[mode]
    if (!choice) continue
    const resolved = resolveMode(mode, choice)
    if (resolved.ok) out[mode] = resolved.value
  }
  return out
}

// ---------- fitting a look Claude will paint ----------

// The words `makeColors` starts a problem with when Desktop would paint none
// of the look
const UNPAINTED = "Desktop won't paint"

type MakeColors<T> = (def: LookDefinition) => { theme: T; problems: string[] }

export interface FittedLook<T> {
  theme: T
  // The definition the theme was made from, the fit's changes included
  definition: LookDefinition
  problems: string[]
  // What was changed so that Claude paints the look, in plain words
  adjusted: string[]
}

// Runs `makeColors` (passed in: the mod has its own copy, the web tests
// theirs) and, where Desktop would paint nothing because of the primary
// text, lifts it toward white (dark) or black (light) a step at a time: some
// palettes' text is too dim for one of Claude's highlights. Throws what
// `makeColors` throws, Claude's own reason where another color fails, or
// when no step paints.
export const fitLook = <T>(
  def: LookDefinition,
  makeColors: MakeColors<T>,
): FittedLook<T> => {
  const adjusted: string[] = []
  let current = def
  for (let step = 0; step <= 8; step++) {
    const { theme, problems } = makeColors(current)
    const unpainted = problems.filter((l) => l.startsWith(UNPAINTED))
    if (unpainted.length === 0)
      return { theme, definition: current, problems, adjusted }
    const fromText = unpainted.filter((l) => l.includes('text-primary'))
    if (fromText.length === 0) throw new Error(unpainted[0])
    const next: LookDefinition = JSON.parse(JSON.stringify(current))
    for (const mode of MODES) {
      const half = next[mode]
      if (!half || !fromText.some((l) => l.includes(`in ${mode} mode`)))
        continue
      const anchors = half.gray.anchors
      anchors['text-primary'] = mixHex(
        anchors['text-primary'],
        mode === 'dark' ? '#ffffff' : '#000000',
        0.25,
      )
      const note = `${mode} text made stronger so Claude paints the theme`
      if (!adjusted.includes(note)) adjusted.push(note)
    }
    current = next
  }
  throw new Error(
    "Claude won't paint this theme: its text is too close to its backgrounds.",
  )
}

// ---------- what the pane shows ----------

export interface Knob {
  // The name Claude gives the knob
  knob: string
  value: string
  // The palette color it comes from, or what changed it
  from: string
}

// The knobs a look sends for one mode, by the names of Claude, with the
// values sent (after the fit) and the palette color each comes from
export const knobsOf = (
  mode: Mode,
  palette: Palette,
  def: LookDefinition,
): Knob[] => {
  const half = def[mode]
  if (!half) return []
  const a = half.gray.anchors
  const frameIsDarker = luminance(palette.frame) <= luminance(palette.canvas)
  const lower = frameIsDarker ? 'frame' : 'canvas'
  const higher = frameIsDarker ? 'canvas' : 'frame'
  const knobs: Knob[] = [
    { knob: 'surface-0', value: a['surface-0'], from: lower },
    { knob: 'surface-1', value: a['surface-1'], from: higher },
    { knob: 'surface-2', value: a['surface-2'], from: higher },
    {
      knob: 'text-primary',
      value: a['text-primary'],
      from:
        a['text-primary'] === palette.text
          ? 'text'
          : 'text, made stronger to paint',
    },
    {
      knob: 'text-secondary',
      value: a['text-secondary'],
      from: 'textSecondary',
    },
    {
      knob: 'text-muted',
      value: a['text-muted'],
      from:
        a['text-muted'] === palette.textMuted ? 'textMuted' : 'textSecondary',
    },
    { knob: 'roles.accent', value: half.roles.accent, from: 'accent' },
  ]
  const code = def.codeTheme?.[mode]
  if (code) knobs.push({ knob: 'codeTheme', value: code, from: 'the preset' })
  return knobs
}
