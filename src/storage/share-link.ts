/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { isHex } from '../theme/color'
import { type Mode, type Palette, type PaletteKey } from '../theme/palette'
import { presetById } from '../theme/presets'
import { type Slot } from '../type'
import { type PresetFile, safeName } from './preset-file'

// A setup carried in the page's hash, so a link (from a person or an AI
// agent) opens the tuner with it: #theme=<URI-encoded JSON>. The hash never
// reaches the server. Each mode is either left out (stock) or
//   { "preset": "solarized-light", "name": "...", "colors": { "accent": "#..." } }
// where the colors override the preset's; without a preset, all 13 colors
// are needed. public/llms.txt documents it for agents.

export interface LinkMode {
  preset?: string
  name?: string
  colors?: Partial<Record<PaletteKey, string>>
}

export interface LinkSetup {
  light?: LinkMode
  dark?: LinkMode
  reduceMotion?: boolean
}

// What the hash asks for: a setup, and whether to show only the previews
// (for screenshots)
export interface LinkRequest {
  setup: LinkSetupResult | null
  previewOnly: boolean
}

export type LinkSetupResult =
  { ok: true; preset: PresetFile } | { ok: false; error: string }

const PALETTE_KEYS: PaletteKey[] = [
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

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

type SlotResult = { ok: true; slot: Slot } | { ok: false; error: string }

const slotFromLink = (mode: Mode, raw: unknown, fallback: Slot): SlotResult => {
  // Left out: the mode stays stock
  if (raw === undefined || raw === null)
    return { ok: true, slot: { ...fallback, enabled: false } }
  if (!isRecord(raw))
    return { ok: false, error: `The ${mode} theme is invalid.` }

  const { preset: presetId, name, colors = {} } = raw
  if (!isRecord(colors))
    return { ok: false, error: `The ${mode} colors are invalid.` }
  for (const [key, value] of Object.entries(colors)) {
    if (!PALETTE_KEYS.includes(key as PaletteKey))
      return {
        ok: false,
        error: `Unknown color "${key}" in the ${mode} theme.`,
      }
    if (typeof value !== 'string' || !isHex(value))
      return {
        ok: false,
        error: `The ${mode} theme has an invalid color (${key}).`,
      }
  }

  let base: Partial<Palette> = {}
  let id = 'custom'
  let baseName = 'Custom'
  let credit
  if (presetId !== undefined) {
    const preset =
      typeof presetId === 'string' ? presetById(presetId) : undefined
    if (!preset) return { ok: false, error: `No preset "${String(presetId)}".` }
    if (preset.mode !== mode)
      return { ok: false, error: `"${preset.id}" is a ${preset.mode} preset.` }
    base = preset.palette
    id = preset.id
    baseName = preset.name
    credit = preset.credit
  }
  const palette = { ...base } as Record<string, string>
  for (const [key, value] of Object.entries(colors))
    palette[key] = (value as string).toLowerCase()
  const missing = PALETTE_KEYS.find((k) => palette[k] === undefined)
  if (missing)
    return {
      ok: false,
      error: `The ${mode} theme needs a preset or all 13 colors (${missing} is missing).`,
    }

  return {
    ok: true,
    slot: {
      enabled: true,
      theme: {
        id,
        name: typeof name === 'string' ? safeName(name) : baseName,
        mode,
        palette: palette as unknown as Palette,
        // Like an edited preset in the tuner, it keeps the preset's credit
        ...(credit ? { credit } : {}),
      },
    },
  }
}

// Decodes a link's setup; modes it leaves out keep the fallback's theme,
// turned off (stock)
export const decodeLinkSetup = (
  json: string,
  fallback: PresetFile,
): LinkSetupResult => {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, error: "the theme in the link isn't valid JSON." }
  }
  if (!isRecord(raw))
    return { ok: false, error: 'the theme in the link is invalid.' }
  const light = slotFromLink('light', raw.light, fallback.light)
  if (!light.ok) return light
  const dark = slotFromLink('dark', raw.dark, fallback.dark)
  if (!dark.ok) return dark
  return {
    ok: true,
    preset: {
      light: light.slot,
      dark: dark.slot,
      reduceMotion: raw.reduceMotion === true,
    },
  }
}

// One mode for a link: the preset it came from and only the colors changed,
// or all colors for a theme from a preset file
const linkModeOf = (slot: Slot): LinkMode | undefined => {
  if (!slot.enabled) return undefined
  const preset = presetById(slot.theme.id)
  const colors: Partial<Record<PaletteKey, string>> = {}
  for (const key of PALETTE_KEYS) {
    const value = slot.theme.palette[key]
    if (!preset || preset.palette[key].toLowerCase() !== value.toLowerCase())
      colors[key] = value
  }
  return {
    ...(preset ? { preset: preset.id } : {}),
    ...(!preset || slot.theme.name !== preset.name
      ? { name: slot.theme.name }
      : {}),
    ...(Object.keys(colors).length ? { colors } : {}),
  }
}

export const encodeLinkSetup = (preset: PresetFile): string => {
  const setup: LinkSetup = {
    light: linkModeOf(preset.light),
    dark: linkModeOf(preset.dark),
    ...(preset.reduceMotion ? { reduceMotion: true } : {}),
  }
  return JSON.stringify(setup)
}

// The hash for a setup, e.g. #theme=%7B%22light%22...
export const linkHash = (preset: PresetFile): string =>
  `#theme=${encodeURIComponent(encodeLinkSetup(preset))}`

// Reads a page hash: #theme=...&view=preview. URLSearchParams turns "+"
// into a space, so the theme is read and decoded by hand
export const parseLinkHash = (
  hash: string,
  fallback: PresetFile,
): LinkRequest => {
  const params = hash.replace(/^#/, '').split('&')
  const value = (name: string) =>
    params.find((p) => p.startsWith(`${name}=`))?.slice(name.length + 1)
  const theme = value('theme')
  let setup: LinkSetupResult | null = null
  if (theme !== undefined) {
    try {
      setup = decodeLinkSetup(decodeURIComponent(theme), fallback)
    } catch {
      setup = { ok: false, error: 'the link is cut off or mangled.' }
    }
  }
  return { setup, previewOnly: value('view') === 'preview' }
}
