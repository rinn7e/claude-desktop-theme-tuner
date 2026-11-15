/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
// What the home shows for a setup: the look the mod would send Claude for
// it, made with the same code the mod runs (package/claude-mod/hooks/look.ts
// and the makeColors of Claude), so the knobs and problems shown are the
// ones the mod meets.
import {
  type Backdrop,
  type Knob,
  LIGHT_GLASS,
  type LookDefinition,
  type Mode,
  type Palette,
  type Resolved,
  SIDEBAR_OPACITY,
  type Setup,
  fitLook,
  knobsOf,
  lookDefinition,
  lookOptionsOf,
  resolveSetup,
  seedOf,
} from '../../../../claude-mod/hooks/look'
import { makeColors } from '../../../../claude-mod/hooks/make-colors.js'
import { PRESETS } from '../../../../claude-mod/hooks/presets'
import type { Showcase } from '../../preview/claude-mock'
import { THEME_GRAPH, evaluator } from '../../theme/claude-graph'
import { CODE_SYNTAX } from '../../theme/code-syntax'

export const MODES: Mode[] = ['light', 'dark']

export const presetsOf = (mode: Mode) => PRESETS.filter((p) => p.mode === mode)

// Claude's own colors, which a mode left out keeps
const stockPalette = (mode: Mode): Palette =>
  (PRESETS.find((p) => p.id === `claude-${mode}`) ?? presetsOf(mode)[0]).palette

// The code themes of Claude, per mode: the ones the presets name
export const codeThemesOf = (mode: Mode): string[] => [
  ...new Set(
    presetsOf(mode).flatMap((p) => (p.codeTheme ? [p.codeTheme] : [])),
  ),
]

export interface ModeLook {
  resolved: Resolved
  // The knobs sent, with their values after the fit
  knobs: Knob[]
  // The colors makeColors derives for the mode (role ramps, git colors)
  derived: Record<string, string>
  // Claude's own colors: the mode sets nothing
  isStock: boolean
}

export interface Look {
  modes: Partial<Record<Mode, ModeLook>>
  // Why Claude would paint none of the look, when it would not
  error: string | null
  // What the fit changed so Claude paints it
  adjusted: string[]
  // The contrast notes of makeColors that still paint, per mode
  notes: Record<Mode, string[]>
  definition: LookDefinition
}

type Theme = { inputs?: Partial<Record<Mode, Record<string, string>>> }

// A stock mode sends nothing, but its rows show what it would send once a
// knob changes: the look of its preset's colors
const stockLook = (mode: Mode, r: Resolved) => {
  const def = lookDefinition({ [mode]: { ...r, isStock: false } })
  let derived: Record<string, string> = {}
  try {
    derived = (makeColors(def).theme as Theme).inputs?.[mode] ?? {}
  } catch {
    // Claude's own colors always build; nothing to show if they do not
  }
  return { resolved: r, knobs: knobsOf(mode, r, def), derived }
}

export const lookOf = (setup: Setup): Look => {
  const resolved = resolveSetup(setup)
  const def = lookDefinition(resolved, lookOptionsOf(setup))
  let theme: Theme = {}
  let definition = def
  let error: string | null = null
  let adjusted: string[] = []
  let problems: string[] = []
  if (def.light || def.dark) {
    try {
      const fitted = fitLook(def, makeColors)
      theme = fitted.theme as Theme
      definition = fitted.definition
      adjusted = fitted.adjusted
      problems = fitted.problems
    } catch (e) {
      // makeColors throws for a look it cannot build at all (a surface-0
      // lighter than surface-1 in dark mode): no derived colors then
      error = e instanceof Error ? e.message : String(e)
    }
  }
  const modes: Partial<Record<Mode, ModeLook>> = {}
  for (const mode of MODES) {
    const r = resolved[mode]
    if (!r) continue
    modes[mode] = definition[mode]
      ? {
          resolved: r,
          knobs: knobsOf(mode, r, definition),
          derived: theme.inputs?.[mode] ?? {},
          isStock: false,
        }
      : { ...stockLook(mode, r), isStock: true }
  }
  const notesOf = (mode: Mode) =>
    problems.filter((p) => p.includes(`in ${mode} mode`))
  return {
    modes,
    error,
    adjusted,
    notes: { light: notesOf('light'), dark: notesOf('dark') },
    definition,
  }
}

// The value a knob is sent with, by its name in Claude
export const knobValue = (
  look: Look,
  mode: Mode,
  knob: string,
): string | undefined =>
  look.modes[mode]?.knobs.find((k) => k.knob === knob)?.value

// The palette the preview draws one mode with: the preset's colors, with
// what the look sends Claude on top. Claude draws its sidebar and page with
// surface-0 and the conversation with surface-1, and the accent from the
// ramp makeColors derives from the seed. The rest (lines, hovers) stay the
// preset's: an approximation of what Claude derives.
export const previewPalette = (look: Look, mode: Mode): Palette => {
  const m = look.modes[mode]
  if (!m) return stockPalette(mode)
  const base = m.resolved.palette
  if (m.isStock) return base
  const half = look.definition[mode]
  if (!half) return base
  const a = half.gray.anchors
  const d = m.derived
  return {
    ...base,
    frame: a['surface-0'],
    canvas: a['surface-1'] ?? base.canvas,
    raised: a['surface-3'] ?? base.raised,
    text: a['text-primary'],
    textSecondary: a['text-secondary'] ?? base.textSecondary,
    textMuted: a['text-muted'] ?? base.textMuted,
    // The step Claude draws links with (text-accent), and the hover of its
    // filled buttons
    accent:
      d[mode === 'light' ? 'role-accent-600' : 'role-accent-300'] ??
      seedOf(half.roles.accent),
    accentHover: d['role-accent-fill-hover'] ?? base.accentHover,
    onAccent: d['role-accent-on'] ?? base.onAccent,
  }
}

// The backdrop as a CSS background for the preview. A design system name
// (surface-0) is one of the variables the mock sets. Claude also frosts its
// panels over a backdrop, which the preview leaves out.
export const backdropCss = (
  backdrop: Backdrop | undefined,
): string | undefined => {
  if (!backdrop) return undefined
  if ('color' in backdrop)
    return backdrop.color.startsWith('#')
      ? backdrop.color
      : `var(--cds-${backdrop.color})`
  const { stops, angle, shape } = backdrop.gradient
  return shape === 'radial'
    ? `radial-gradient(circle, ${stops.join(', ')})`
    : `linear-gradient(${angle ?? 180}deg, ${stops.join(', ')})`
}

// Claude's own inputs of a mode (its stock ramps): what makeColors gives a
// mode a look leaves out
let stockInputs: Partial<Record<Mode, Record<string, string>>> | undefined
const stockInputsOf = (mode: Mode): Record<string, string> => {
  if (!stockInputs) {
    const other = (m: Mode): Mode => (m === 'light' ? 'dark' : 'light')
    stockInputs = {}
    for (const m of MODES) {
      const preset = PRESETS.find((p) => p.id === `claude-${other(m)}`)
      if (!preset) continue
      const half = lookDefinition(
        resolveSetup({
          [other(m)]: {
            preset: preset.id,
            roles: { accent: preset.palette.accent },
          },
        }),
      )
      try {
        stockInputs[m] = (makeColors(half).theme as Theme).inputs?.[m] ?? {}
      } catch {
        stockInputs[m] = {}
      }
    }
  }
  return stockInputs[mode] ?? {}
}

// Preview v2: the design system tokens Claude computes for the mode, as CSS
// variables (--cds-surface-1, --cds-bg-user-message, ...), from the ramps of
// the look, or Claude's own ramps for a mode the look leaves out. A token
// the graph cannot resolve is left to the palette.
export const claudeTokens = (
  look: Look,
  mode: Mode,
): Record<string, string> => {
  const m = look.modes[mode]
  const inputs =
    m && !m.isStock && Object.keys(m.derived).length
      ? m.derived
      : stockInputsOf(mode)
  if (!Object.keys(inputs).length) return {}
  const tokenOf = evaluator(THEME_GRAPH, inputs, mode === 'dark')
  // The inputs of the look (its ramps, the git colors) are variables of
  // Claude too, such as --cds-text-git-added
  const out: Record<string, string> = Object.fromEntries(
    Object.entries(inputs).map(([name, value]) => [`--cds-${name}`, value]),
  )
  for (const name of Object.keys(THEME_GRAPH)) {
    try {
      const value = tokenOf(name)
      if (value !== undefined) out[`--cds-${name}`] = value
    } catch {
      // A token that needs an input the look lacks
    }
  }
  // Where Claude paints a part from more than one token, as the probe of a
  // mod look found (snippets/mod-look.snippet.js): the sidebar (translucent
  // over the macOS glass, which the preview leaves out), a selected or
  // hovered row (a ghost fill), and the composer, tinted with bg-neutral
  // over the chat
  const s0 = out['--cds-surface-0']
  const s1 = out['--cds-surface-1']
  // Claude's own rules, read from the app: the light sidebar is half
  // surface-0, half surface-1; the dark one is the page (surface-1)
  // darkened by a fifth
  // On a Mac the light sidebar shows a little of the macOS glass through
  // (72% of it is Claude's color): the preview lays the same light glass
  // under it, so it shows what the screen shows
  if (s0 && s1)
    out['--cds-fizzy-lake-color-sidebar'] =
      mode === 'light'
        ? `color-mix(in srgb, color-mix(in srgb, ${s0} 50%, ${s1}) ${SIDEBAR_OPACITY * 100}%, ${LIGHT_GLASS})`
        : `color-mix(in srgb, ${s1} 80%, black)`
  if (out['--cds-fill-ghost-selected'])
    out['--df-selected'] = out['--cds-fill-ghost-selected']
  if (out['--cds-fill-ghost-hover'])
    out['--df-hover'] = out['--cds-fill-ghost-hover']
  if (out['--cds-bg-neutral']) out['--mock-composer'] = out['--cds-bg-neutral']
  return out
}

// The code block of preview v2: in the colors of the code theme the look
// sets, or, for Claude's own code theme (claude-light, claude-dark, or none
// set), in the roles of the look, as Claude draws it: keywords in the
// accent, names in danger, strings in success, variables in warning and
// literals in pro
export const showcaseOf = (look: Look, mode: Mode): Showcase => {
  const id = look.definition.codeTheme?.[mode]
  const syntax = id ? CODE_SYNTAX[id] : undefined
  if (syntax) return { code: syntax, codeTheme: id ?? '' }
  const t = claudeTokens(look, mode)
  const v = (name: string, fallback: string) => t[`--cds-${name}`] ?? fallback
  const fg = v('text-primary', 'currentColor')
  return {
    code: {
      fg,
      comment: v('text-muted', fg),
      keyword: v('text-accent', fg),
      storage: v('text-accent', fg),
      string: v('text-success', fg),
      number: v('text-pro', fg),
      func: v('text-danger', fg),
      type: v('text-danger', fg),
      variable: v('text-warning', fg),
    },
    codeTheme: id ?? `claude-${mode}`,
  }
}
