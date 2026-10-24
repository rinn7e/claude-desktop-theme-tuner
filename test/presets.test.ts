/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { contrast, isHex } from '../src/theme/color'
import { CONTRAST_CHECKS } from '../src/theme/palette'
import { CLAUDE_PRESETS, PRESETS, allPresets } from '../src/theme/presets'

describe('presets', () => {
  it('have unique ids', () => {
    const ids = allPresets().map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('list the Claude presets first in each mode', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(allPresets().find((t) => t.mode === mode)?.id).toBe(
        `claude-${mode}`,
      )
    }
  })

  // Measured in Claude 3.6556.2; kept as Claude ships them, so they are not
  // held to the AA checks below
  it("keep Claude's own measured colors", () => {
    const [light, dark] = CLAUDE_PRESETS
    expect(light.palette).toMatchObject({
      canvas: '#ffffff',
      frame: '#f9f9f9',
      accent: '#257de0',
      text: '#1a1a1a',
    })
    expect(dark.palette).toMatchObject({
      canvas: '#191919',
      frame: '#1f1f1f',
      accent: '#257de0',
      text: '#efefef',
    })
    for (const t of CLAUDE_PRESETS) {
      for (const value of Object.values(t.palette))
        expect(isHex(value), value).toBe(true)
    }
  })

  it('cover both modes', () => {
    expect(PRESETS.some((t) => t.mode === 'light')).toBe(true)
    expect(PRESETS.some((t) => t.mode === 'dark')).toBe(true)
  })

  it.each(PRESETS.map((t) => [t.name, t] as const))(
    '%s uses #rrggbb colors and keeps every text pair readable',
    (_name, theme) => {
      for (const value of Object.values(theme.palette)) {
        expect(isHex(value), value).toBe(true)
      }
      for (const { fg, bg, min } of CONTRAST_CHECKS) {
        const ratio = contrast(theme.palette[fg], theme.palette[bg])
        expect(
          ratio,
          `${fg} on ${bg}: ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(min)
      }
    },
  )
})
