/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
// The setup a person picks, and the look the mod sends Claude for it. Plain
// TypeScript with no engine import, so the web tuner's tests run it too.
//
// A setup is the JSON the web tuner writes: per mode a preset and the colors
// that change. The tuner's palette has 13 roles; a mod look takes a few
// anchors and the design system derives the rest, so the surfaces, the three
// texts and the accent go across, and the code theme of the preset's own
// name (each preset matches one of Claude's code themes). On top of that a
// mode can set the knobs of Claude directly (anchors, roles, git colors, the
// code theme), and the setup the contrast and a backdrop; doc/mod-knobs.md
// lists them.
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

// The knobs of Claude a mode can set directly, by their names in Claude
export const ANCHOR_KEYS = [
  'surface-0',
  'surface-1',
  'surface-2',
  'surface-3',
  'text-primary',
  'text-secondary',
  'text-muted',
] as const
export type AnchorKey = (typeof ANCHOR_KEYS)[number]

export const ROLE_KEYS = [
  'accent',
  'danger',
  'success',
  'warning',
  'pro',
] as const
export type RoleKey = (typeof ROLE_KEYS)[number]

export const GIT_KEYS = [
  'added',
  'removed',
  'modified',
  'merged',
  'closed',
  'conflicting',
  'draft',
] as const
export type GitKey = (typeof GIT_KEYS)[number]

export interface ModeChoice {
  preset?: string
  name?: string
  // The palette colors that differ from the preset
  colors?: Partial<Record<PaletteKey, string>>
  // Knobs of Claude set directly, over what the palette gives
  anchors?: Partial<Record<AnchorKey, string>>
  roles?: Partial<Record<RoleKey, string>>
  git?: Partial<Record<GitKey, string>>
  // A code theme id of Claude, over the preset's own; null sends none, so
  // Claude's own picker stays free for the mode
  codeTheme?: string | null
}

// What is behind the conversation: a color (#rrggbb, or a design system
// name such as surface-0, which follows the mode) or a gradient
export type Backdrop =
  | { color: string }
  | {
      gradient: {
        stops: string[]
        angle?: number
        shape?: 'linear' | 'radial'
      }
    }

export interface Setup {
  light?: ModeChoice
  dark?: ModeChoice
  // Stronger borders and focus rings
  contrast?: 'more'
  backdrop?: Backdrop
  // The light sidebar is sent so that it comes out as the frame through the
  // sidebar glass of macOS (see sidebarBase); false sends the frame as it is,
  // for Reduce transparency
  compensateGlass?: false
}

// One mode, resolved: the colors to draw with, what to call them, and the
// code theme that goes with them
export interface Resolved {
  name: string
  palette: Palette
  codeTheme?: string
  // The knobs the mode sets directly
  anchors: Partial<Record<AnchorKey, string>>
  roles: Partial<Record<RoleKey, string>>
  git: Partial<Record<GitKey, string>>
  // Whether the code theme was set directly rather than by the preset
  isCodeThemeSet: boolean
  // Claude's own colors, untouched: the look leaves the mode to the app,
  // code theme included (a look must set colors to set one)
  isStock?: boolean
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

const MODES: Mode[] = ['light', 'dark']
// The presets that are Claude's own colors, measured from the app
const STOCK_PRESETS = ['claude-light', 'claude-dark']
const HEX = /^#[0-9a-f]{6}$/i
const CODE_THEME = /^[a-z0-9][a-z0-9._-]{0,63}$/i
// A design system color a backdrop may name
const COLOR_NAME = /^[a-z][a-z0-9-]{0,40}$/

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

// A record of #rrggbb colors under the given keys, lowercased
const hexRecord = <K extends string>(
  mode: Mode,
  what: string,
  raw: unknown,
  keys: readonly K[],
): Result<Partial<Record<K, string>>> => {
  if (raw === undefined) return { ok: true, value: {} }
  if (!isRecord(raw))
    return { ok: false, error: `The ${mode} ${what} are invalid.` }
  const out: Partial<Record<K, string>> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!(keys as readonly string[]).includes(key))
      return {
        ok: false,
        error: `Unknown ${what.replace(/s$/, '')} "${key}" in the ${mode} theme.`,
      }
    if (typeof value !== 'string' || !HEX.test(value))
      return {
        ok: false,
        error: `The ${mode} theme has an invalid color (${key}).`,
      }
    out[key as K] = value.toLowerCase()
  }
  return { ok: true, value: out }
}

// A mode as the setup gives it: a preset with the colors that change, or
// all 13 colors with no preset (a theme from a preset file), and the knobs
// it sets directly
export const resolveMode = (mode: Mode, raw: unknown): Result<Resolved> => {
  if (!isRecord(raw))
    return { ok: false, error: `The ${mode} theme is invalid.` }
  const { preset: presetId, name, colors = {} } = raw
  const anchors = hexRecord(mode, 'anchors', raw.anchors, ANCHOR_KEYS)
  if (!anchors.ok) return anchors
  const roles = hexRecord(mode, 'roles', raw.roles, ROLE_KEYS)
  if (!roles.ok) return roles
  const git = hexRecord(mode, 'git colors', raw.git, GIT_KEYS)
  if (!git.ok) return git
  if (
    raw.codeTheme !== undefined &&
    raw.codeTheme !== null &&
    (typeof raw.codeTheme !== 'string' || !CODE_THEME.test(raw.codeTheme))
  )
    return { ok: false, error: `The ${mode} code theme is invalid.` }
  // A code theme set directly needs a look to carry it
  const setsKnobs =
    Object.keys(anchors.value).length +
      Object.keys(roles.value).length +
      Object.keys(git.value).length >
      0 || typeof raw.codeTheme === 'string'
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
      ...(typeof raw.codeTheme === 'string'
        ? { codeTheme: raw.codeTheme }
        : codeTheme && raw.codeTheme !== null
          ? { codeTheme }
          : {}),
      anchors: anchors.value,
      roles: roles.value,
      git: git.value,
      isCodeThemeSet: raw.codeTheme !== undefined,
      ...(typeof presetId === 'string' &&
      STOCK_PRESETS.includes(presetId) &&
      Object.keys(colors).length === 0 &&
      !setsKnobs
        ? { isStock: true }
        : {}),
    },
  }
}

const checkBackdrop = (raw: unknown): Result<Backdrop> => {
  const bad: Result<Backdrop> = { ok: false, error: 'The backdrop is invalid.' }
  if (!isRecord(raw)) return bad
  if (typeof raw.color === 'string') {
    const color = raw.color.trim()
    return HEX.test(color) || COLOR_NAME.test(color)
      ? { ok: true, value: { color: color.toLowerCase() } }
      : { ok: false, error: `The backdrop color "${raw.color}" is invalid.` }
  }
  const g = raw.gradient
  if (!isRecord(g) || !Array.isArray(g.stops)) return bad
  const stops = g.stops
  if (stops.length < 2 || stops.length > 16)
    return { ok: false, error: 'A gradient takes 2 to 16 colors.' }
  if (!stops.every((c) => typeof c === 'string' && HEX.test(c)))
    return { ok: false, error: 'The gradient colors must be #rrggbb.' }
  if (
    g.angle !== undefined &&
    (typeof g.angle !== 'number' || g.angle < 0 || g.angle > 360)
  )
    return { ok: false, error: 'The gradient angle is 0 to 360.' }
  if (g.shape !== undefined && g.shape !== 'linear' && g.shape !== 'radial')
    return { ok: false, error: 'The gradient shape is linear or radial.' }
  return {
    ok: true,
    value: {
      gradient: {
        stops: (stops as string[]).map((c) => c.toLowerCase()),
        ...(typeof g.angle === 'number' ? { angle: g.angle } : {}),
        ...(g.shape === 'linear' || g.shape === 'radial'
          ? { shape: g.shape }
          : {}),
      },
    },
  }
}

const nonEmpty = <T extends object>(key: string, value: T | undefined) =>
  value && Object.keys(value).length ? { [key]: value } : {}

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
    const { preset, name, colors, codeTheme } = choice as ModeChoice
    setup[mode] = {
      ...(preset ? { preset } : {}),
      ...(typeof name === 'string' && cleanName(name)
        ? { name: cleanName(name) }
        : {}),
      ...nonEmpty(
        'colors',
        colors &&
          Object.fromEntries(
            Object.entries(colors).map(([k, v]) => [k, v.toLowerCase()]),
          ),
      ),
      ...nonEmpty('anchors', resolved.value.anchors),
      ...nonEmpty('roles', resolved.value.roles),
      ...nonEmpty('git', resolved.value.git),
      ...(typeof codeTheme === 'string' || codeTheme === null
        ? { codeTheme }
        : {}),
    }
  }
  if (raw.contrast !== undefined) {
    if (raw.contrast !== 'more')
      return { ok: false, error: 'The contrast is "more" or left out.' }
    setup.contrast = 'more'
  }
  if (raw.compensateGlass !== undefined) {
    if (typeof raw.compensateGlass !== 'boolean')
      return { ok: false, error: 'compensateGlass is true, false or left out.' }
    // On unless turned off, so only off is kept
    if (!raw.compensateGlass) setup.compensateGlass = false
  }
  if (raw.backdrop !== undefined) {
    const backdrop = checkBackdrop(raw.backdrop)
    if (!backdrop.ok) return backdrop
    setup.backdrop = backdrop.value
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
// Claude paints its light sidebar half surface-0, half surface-1
// (`color-mix(in srgb, surface-0 50%, surface-1)`, read from the app), and
// the conversation surface-1. So that the sidebar comes out as the frame of
// the palette, surface-0 is sent as far below the frame as the canvas is
// above it, each channel kept to 0 to 255. The dark sidebar is the
// conversation darkened by a fifth (`color-mix(in srgb, page 80%, black)`),
// which no anchor moves.
//
// On a Mac with transparency on, Claude draws that sidebar at 72% over the
// macOS sidebar glass, so the screen shows a little of the glass: #eee8d5
// was measured as #ede8dc over a light glass of about #eae8ee. With
// `compensateGlass` the sidebar is aimed at the color that comes out as the
// frame through that glass instead, unless the setup turns it off. It only
// holds while the glass looks so (a light wallpaper, light mode).
export const SIDEBAR_OPACITY = 0.72
export const LIGHT_GLASS = '#eae8ee'

// The color that shows as `frame` through the glass
export const throughGlass = (frame: string): string => {
  const f = channels(frame)
  const g = channels(LIGHT_GLASS)
  return toHex(
    f.map(
      (v, i) => (v - (1 - SIDEBAR_OPACITY) * (g[i] ?? 0)) / SIDEBAR_OPACITY,
    ),
  )
}

// The glass laid over a color, as the screen shows it
export const onGlass = (color: string): string => {
  const c = channels(color)
  const g = channels(LIGHT_GLASS)
  return toHex(
    c.map((v, i) => SIDEBAR_OPACITY * v + (1 - SIDEBAR_OPACITY) * (g[i] ?? 0)),
  )
}

const toHex = (rgb: number[]): string =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`

export const sidebarBase = (
  frame: string,
  canvas: string,
  { compensateGlass = false }: { compensateGlass?: boolean } = {},
): string => {
  const f = channels(compensateGlass ? throughGlass(frame) : frame)
  const c = channels(canvas)
  return toHex(f.map((v, i) => 2 * v - (c[i] ?? 0)))
}

const anchorsOf = (mode: Mode, p: Palette, options: LookOptions) => {
  const frameIsDarker = luminance(p.frame) <= luminance(p.canvas)
  const low =
    mode === 'light' && frameIsDarker
      ? sidebarBase(p.frame, p.canvas, {
          compensateGlass: options.compensateGlass !== false,
        })
      : frameIsDarker
        ? p.frame
        : p.canvas
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

// Claude keeps the surfaces in order (each as light as the one before it or
// lighter), and the palette sends surface-2 as surface-1: a surface-1 set
// alone takes surface-2 along, or a lighter chat would break the order and
// Claude would paint nothing
const surfacesFollowing = (
  set: Partial<Record<AnchorKey, string>>,
): Partial<Record<AnchorKey, string>> =>
  set['surface-1'] !== undefined && set['surface-2'] === undefined
    ? { 'surface-2': set['surface-1'] }
    : {}

// A role as makeColors takes it: a seed, or a seed with steps of its ramp
// set by hand
export type RoleSeed = string | { seed: string; stops: Record<string, string> }

export const seedOf = (role: RoleSeed): string =>
  typeof role === 'string' ? role : role.seed

// The accent of a palette, with the steps of its ramp that Claude paints
// with set to the palette's own colors, so Claude draws them as the first
// tuner does: links (step 600 in light mode, 300 in dark) and filled
// buttons (step 450) in the accent, and their hover (the step beside, 400)
// in the hover accent. Claude derives the rest of the ramp from the seed.
export const accentOf = (mode: Mode, p: Palette): RoleSeed => ({
  seed: p.accent,
  stops: {
    [mode === 'light' ? '600' : '300']: p.accent,
    '450': p.accent,
    '400': p.accentHover,
  },
})

// A mode of the definition: its gray anchors (surface-0 and text-primary
// always), its roles (the accent always) and any git colors
export interface LookMode {
  gray: {
    anchors: { 'surface-0': string; 'text-primary': string } & Partial<
      Record<AnchorKey, string>
    >
  }
  roles: { accent: RoleSeed } & Partial<Record<RoleKey, RoleSeed>>
  git?: Partial<Record<GitKey, string>>
}

export interface LookDefinition {
  label: string
  id: string
  light?: LookMode
  dark?: LookMode
  codeTheme?: { light?: string; dark?: string }
  contrast?: 'more'
}

// What `makeColors` is given for the resolved modes; a mode left out keeps
// Claude's own colors. The knobs a mode sets directly win over the palette.
// What a setup sets for the whole look
export interface LookOptions {
  contrast?: 'more'
  // On unless false
  compensateGlass?: boolean
}

export const lookOptionsOf = (setup: Setup): LookOptions => ({
  contrast: setup.contrast,
  compensateGlass: setup.compensateGlass !== false,
})

export const lookDefinition = (
  modes: Partial<Record<Mode, Resolved>>,
  options: LookOptions = {},
): LookDefinition => {
  const { contrast } = options
  const label =
    MODES.flatMap((m) => (modes[m] ? [modes[m].name] : [])).join(' / ') ||
    'Theme Tuner'
  // makeColors takes a label of 1 to 64 characters
  const def: LookDefinition = { label: label.slice(0, 64), id: 'theme-tuner' }
  const codeTheme: { light?: string; dark?: string } = {}
  for (const mode of MODES) {
    const resolved = modes[mode]
    // A stock mode is left to the app, its code theme too
    if (!resolved || resolved.isStock) continue
    if (resolved.codeTheme) codeTheme[mode] = resolved.codeTheme
    def[mode] = {
      gray: {
        anchors: {
          ...anchorsOf(mode, resolved.palette, options),
          ...surfacesFollowing(resolved.anchors),
          ...resolved.anchors,
        },
      },
      roles: {
        ...resolved.roles,
        accent: resolved.roles.accent ?? accentOf(mode, resolved.palette),
      },
      ...(Object.keys(resolved.git).length ? { git: resolved.git } : {}),
    }
  }
  if (Object.keys(codeTheme).length) def.codeTheme = codeTheme
  if (contrast === 'more' && (def.light || def.dark)) def.contrast = 'more'
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

// Where Desktop would paint nothing because of the primary text, lifts it
// toward white (dark) or black (light) a step at a time: some palettes'
// text is too dim for one of Claude's highlights. Throws what `makeColors`
// throws, Claude's own reason where another color fails, or when no step
// paints.
const fitText = <T>(
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

// The steps of the accent a palette pins, by what Claude paints with them
type AccentPart = 'link' | 'fill' | 'hover'
const partOf = (mode: Mode, stop: string): AccentPart =>
  stop === '450' ? 'fill' : stop === '400' ? 'hover' : 'link'

// The look with only some of the pinned accent steps: the others go back
// to Claude's own ramp
const pinning = (def: LookDefinition, keep: AccentPart[]): LookDefinition => {
  const next: LookDefinition = JSON.parse(JSON.stringify(def))
  for (const mode of MODES) {
    const half = next[mode]
    const accent = half?.roles.accent
    if (!half || typeof accent !== 'object') continue
    const stops = Object.fromEntries(
      Object.entries(accent.stops).filter(([stop]) =>
        keep.includes(partOf(mode, stop)),
      ),
    )
    half.roles.accent = Object.keys(stops).length
      ? { seed: accent.seed, stops }
      : accent.seed
  }
  return next
}

const isPinned = (def: LookDefinition): boolean =>
  MODES.some((m) => typeof def[m]?.roles.accent === 'object')

// The pinned steps to try, most first: a step can fail a contrast check of
// Claude the seed alone passes (a light link color, a pale hover)
const ALL_PARTS: AccentPart[] = ['link', 'fill', 'hover']

const PINNINGS: AccentPart[][] = [
  ALL_PARTS,
  ['fill', 'hover'],
  ['link', 'fill'],
  ['fill'],
  ['link'],
  [],
]

const PART_WORDS: Record<AccentPart, string> = {
  link: 'links',
  fill: 'buttons',
  hover: 'button hover',
}

// Runs `makeColors` (passed in: the mod has its own copy, the web tests
// theirs) and fits the look until Claude paints it: the primary text is
// lifted where it is too dim, and the accent steps of the palette go back
// to Claude's ramp where they fail. Throws what `makeColors` throws, or
// Claude's own reason when nothing paints.
export const fitLook = <T>(
  def: LookDefinition,
  makeColors: MakeColors<T>,
): FittedLook<T> => {
  if (!isPinned(def)) return fitText(def, makeColors)
  let lastError: unknown
  for (const keep of PINNINGS) {
    try {
      const fitted = fitText(pinning(def, keep), makeColors)
      const dropped = ALL_PARTS.filter((part) => !keep.includes(part))
      if (!dropped.length) return fitted
      const what = dropped.map((part) => PART_WORDS[part]).join(' and ')
      const notes = MODES.filter(
        (m) => typeof def[m]?.roles.accent === 'object',
      ).map(
        (m) =>
          `${m} accent ${what} left to Claude's ramp so Claude paints the theme`,
      )
      return { ...fitted, adjusted: [...fitted.adjusted, ...notes] }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
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
// values sent (after the fit) and where each comes from: a palette color, or
// set directly
export const knobsOf = (
  mode: Mode,
  resolved: Resolved,
  def: LookDefinition,
): Knob[] => {
  const half = def[mode]
  if (!half) return []
  const { palette } = resolved
  const frameIsDarker = luminance(palette.frame) <= luminance(palette.canvas)
  const fromPalette: Record<AnchorKey, string | undefined> = {
    'surface-0': frameIsDarker
      ? mode === 'light'
        ? 'frame, for the sidebar'
        : 'frame'
      : 'canvas',
    'surface-1': frameIsDarker ? 'canvas' : 'frame',
    'surface-2': frameIsDarker ? 'canvas' : 'frame',
    'surface-3': undefined,
    'text-primary': 'text',
    'text-secondary': 'textSecondary',
    'text-muted':
      half.gray.anchors['text-muted'] === palette.textMuted
        ? 'textMuted'
        : 'textSecondary',
  }
  const knobs: Knob[] = []
  for (const key of ANCHOR_KEYS) {
    const value = half.gray.anchors[key]
    if (value === undefined) continue
    const from =
      resolved.anchors[key] !== undefined
        ? key === 'text-primary' && value !== resolved.anchors[key]
          ? 'set, made stronger to paint'
          : 'set'
        : key === 'surface-2' && resolved.anchors['surface-1'] !== undefined
          ? 'surface-1'
          : key === 'text-primary' && value !== palette.text
            ? 'text, made stronger to paint'
            : (fromPalette[key] ?? 'set')
    knobs.push({ knob: key, value, from })
  }
  for (const key of ROLE_KEYS) {
    const role = half.roles[key]
    const value = role === undefined ? undefined : seedOf(role)
    if (value === undefined) continue
    knobs.push({
      knob: `roles.${key}`,
      value,
      from: resolved.roles[key] !== undefined ? 'set' : 'accent',
    })
  }
  for (const key of GIT_KEYS) {
    const value = half.git?.[key]
    if (value !== undefined)
      knobs.push({ knob: `git.${key}`, value, from: 'set' })
  }
  const code = def.codeTheme?.[mode]
  if (code)
    knobs.push({
      knob: 'codeTheme',
      value: code,
      from: resolved.isCodeThemeSet ? 'set' : 'the preset',
    })
  return knobs
}
