/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { hslTriple, mix, withAlpha } from './color'
import { type Palette } from './palette'

// Claude's variables, set from a palette. Two groups, because the app keeps
// two layers: the design system (--cds-*, and claude.ai's older --bg-* and
// --text-*) on the root, and the Code tab frame (--df-*), which re-sets its
// own variables on its sidebar, cards and session lists.
export interface Tokens {
  root: Record<string, string>
  frame: Record<string, string>
}

export const deriveTokens = (p: Palette): Tokens => {
  // A step past pressed toward the text: dividers and the strongest fill
  const deep = mix(p.pressed, p.text, 0.035)
  const hover = withAlpha(p.selected, 0.27)
  const accentSoft = withAlpha(p.accent, 0.14)
  const strongLine = withAlpha(p.line, 0.4)

  const root: Record<string, string> = {
    '--cds-surface-0': p.frame,
    '--cds-surface-1': p.canvas,
    '--cds-surface-2': p.canvas,
    '--cds-surface-3': p.raised,
    '--cds-surface-panel': p.canvas,
    // Menus, and boxes Claude lifts with a shadow (the composer): above the
    // canvas, like stock's lighter popover
    '--cds-surface-popover': p.raised,
    '--cds-page-bg': p.canvas,
    '--background-color-page': p.canvas,
    '--cds-bg-neutral': withAlpha(p.line, 0.08),
    '--cds-bg-neutral-hover': withAlpha(p.line, 0.14),
    '--cds-bg-user-message': withAlpha(p.wash, 0.1),
    '--cds-text-primary': p.text,
    '--cds-text-secondary': p.textSecondary,
    '--cds-text-muted': p.textMuted,
    '--cds-border': withAlpha(p.line, 0.22),
    '--cds-border-strong': strongLine,
    '--cds-border-stronger': strongLine,
    '--cds-role-accent-400': p.accent,
    '--cds-role-accent-450': p.accentHover,
    '--cds-role-accent-600': p.accent,
    '--cds-role-accent-on': p.onAccent,
    '--cds-on-accent': p.onAccent,
    '--cds-text-accent': p.accent,
    '--cds-bg-accent': accentSoft,
    '--cds-bg-accent-muted': accentSoft,
    '--cds-bg-accent-chip': accentSoft,
    '--cds-border-accent': p.accent,
    '--cds-bg-highlight': accentSoft,
    // Fields and neutral fills: half-white and cool-gray tints by default
    '--cds-fill-field': p.canvas,
    '--cds-alpha-1': withAlpha(p.wash, 0.07),
    '--cds-alpha-2': withAlpha(p.wash, 0.12),
    '--cds-alpha-3': withAlpha(p.wash, 0.18),
    '--cds-fill-ghost-hover': hover,
    '--cds-fill-ghost-selected': withAlpha(p.selected, 0.55),
    '--cds-fill-secondary-hover': hover,
    // The flat sidebar look and its cards (Claude 3.x)
    '--cds-fizzy-lake-color-sidebar': p.frame,
    '--cds-fizzy-lake-color-card-hover': p.raised,
    '--cds-fizzy-lake-color-card-link': withAlpha(p.wash, 0.04),
    '--cds-fizzy-lake-color-card-link-hover': withAlpha(p.wash, 0.08),
    '--cds-fizzy-lake-color-card-link-pressed': withAlpha(p.wash, 0.12),
    '--cds-fizzy-lake-color-selected-hover': withAlpha(p.selected, 0.7),
    // claude.ai's older tokens (HSL triples), still used in a few places
    '--bg-000': hslTriple(p.canvas),
    '--bg-100': hslTriple(p.canvas),
    '--bg-200': hslTriple(p.raised),
    '--bg-300': hslTriple(p.frame),
    '--bg-400': hslTriple(p.pressed),
    '--bg-500': hslTriple(deep),
    '--text-000': hslTriple(p.text),
    '--text-100': hslTriple(p.text),
    '--text-200': hslTriple(p.textSecondary),
    '--text-300': hslTriple(p.textSecondary),
    '--border-300': hslTriple(deep),
  }

  const frame: Record<string, string> = {
    // The frame's gray scale, z0 = card surface up to z6 = muted text
    '--df-z0': hslTriple(p.canvas),
    '--df-z1': hslTriple(p.raised),
    '--df-z2': hslTriple(p.frame),
    '--df-z3': hslTriple(p.pressed),
    '--df-z4': hslTriple(deep),
    '--df-z5': hslTriple(mix(p.textMuted, p.canvas, 0.35)),
    '--df-z6': hslTriple(p.textMuted),
    // The ground under the chat panes (dark mode paints it from these; the
    // frame's own --bg-100 is set from it too): the canvas, so the chat
    // column and the composer dock are one surface
    '--df-bg-page-hsl': hslTriple(p.canvas),
    '--df-bg-page': p.canvas,
    '--df-sidebar-bg': p.frame,
    '--df-web-sidebar-bg': p.frame,
    // With macOS vibrancy the docked sidebar paints this tint over a
    // transparent, blurred desktop: solid frame color, like the collapsed
    // sidebar
    '--df-sidebar-tint': p.frame,
    '--df-sidebar-tint-share': '100%',
    '--df-hover': hover,
    '--df-selected': p.selected,
    '--df-selected-base': p.selected,
  }

  return { root, frame }
}
