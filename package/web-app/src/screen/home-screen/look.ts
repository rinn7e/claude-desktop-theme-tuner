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
  type LookDefinition,
  type Mode,
  type Palette,
  type Resolved,
  type Setup,
  fitLook,
  knobsOf,
  lookDefinition,
  resolveSetup,
} from '../../../../claude-mod/hooks/look'
import { makeColors } from '../../../../claude-mod/hooks/make-colors.js'
import { PRESETS } from '../../../../claude-mod/hooks/presets'

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
  const def = lookDefinition(resolved, { contrast: setup.contrast })
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
    accent: d['role-accent-400'] ?? half.roles.accent,
    accentHover: d['role-accent-450'] ?? base.accentHover,
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
