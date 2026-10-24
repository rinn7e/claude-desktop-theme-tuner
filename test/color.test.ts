/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { contrast, hslTriple, isHex, mix, withAlpha } from '../src/theme/color'

describe('color', () => {
  it('accepts only #rrggbb', () => {
    expect(isHex('#fdf6e3')).toBe(true)
    expect(isHex('#FDF6E3')).toBe(true)
    expect(isHex('#fff')).toBe(false)
    expect(isHex('fdf6e3')).toBe(false)
  })

  it('mixes two colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#102030', '#102030', 0.3)).toBe('#102030')
  })

  it('writes rgba with an alpha', () => {
    expect(withAlpha('#586e75', 0.22)).toBe('rgba(88, 110, 117, 0.22)')
  })

  it('writes the HSL triples the old theme wrote by hand', () => {
    expect(hslTriple('#fdf6e3')).toBe('43.8 86.7% 94.1%')
    expect(hslTriple('#eee8d5')).toBe('45.6 42.4% 88.4%')
    expect(hslTriple('#073642')).toBe('192.2 80.8% 14.3%')
    expect(hslTriple('#808080')).toBe('0.0 0.0% 50.2%')
  })

  it('computes WCAG contrast', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#073642', '#fdf6e3')).toBeCloseTo(12.05, 1)
  })
})
