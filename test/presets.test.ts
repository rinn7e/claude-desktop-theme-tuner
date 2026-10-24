/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { contrast, isHex } from '../src/theme/color'
import { CONTRAST_CHECKS } from '../src/theme/palette'
import { PRESETS } from '../src/theme/presets'

describe('presets', () => {
  it('have unique ids', () => {
    expect(new Set(PRESETS.map((t) => t.id)).size).toBe(PRESETS.length)
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
