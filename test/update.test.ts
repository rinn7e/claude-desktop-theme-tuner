/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { decodeStored } from '../src/storage/storage'
import { type Model } from '../src/type'
import {
  defaultStored,
  handlePickPreset,
  handleResetSlot,
  handleSelectMode,
  handleSetColor,
  handleToggleGlassOff,
  handleToggleReduceMotion,
  handleToggleSlot,
  isEdited,
  snippetOf,
} from '../src/update'

const model: Model = {
  ...defaultStored,
  editing: 'light',
  shown: 'theme',
  copied: null,
  copyFailed: null,
  helpOpen: false,
}

describe('sub-updaters', () => {
  it('starts with Solarized Light on and dark mode stock', () => {
    expect(model.light.enabled).toBe(true)
    expect(model.light.theme.id).toBe('solarized-light')
    expect(model.dark.enabled).toBe(false)
  })

  it('picks a preset for the mode being edited and turns it on', () => {
    const next = handlePickPreset(handleSelectMode(model, 'dark'), 'nord')
    expect(next.dark).toMatchObject({ enabled: true, theme: { id: 'nord' } })
    expect(next.light).toBe(model.light)
  })

  it('ignores an unknown preset', () => {
    expect(handlePickPreset(model, 'nope')).toBe(model)
  })

  it('edits a color without touching the preset', () => {
    const next = handleSetColor(model, 'canvas', '#ABCDEF')
    expect(next.light.theme.palette.canvas).toBe('#abcdef')
    expect(isEdited(next.light)).toBe(true)
    expect(isEdited(model.light)).toBe(false)
    expect(
      handlePickPreset(next, 'solarized-light').light.theme.palette.canvas,
    ).toBe('#fdf6e3')
  })

  it('rejects a half-typed color', () => {
    expect(handleSetColor(model, 'canvas', '#abc')).toBe(model)
  })

  it('resets edits back to the preset', () => {
    const next = handleResetSlot(handleSetColor(model, 'accent', '#000000'))
    expect(isEdited(next.light)).toBe(false)
  })

  it('toggles a mode on and off', () => {
    const off = handleToggleSlot(model, 'light')
    expect(off.light.enabled).toBe(false)
    expect(handleToggleSlot(off, 'light').light.enabled).toBe(true)
  })

  it('adds the glass-off code to the snippet when turned on', () => {
    expect(model.glassOff).toBe(false)
    expect(snippetOf(model)).not.toContain('WindowVibrancy')
    const on = handleToggleGlassOff(model)
    expect(on.glassOff).toBe(true)
    expect(snippetOf(on)).toContain('WindowVibrancy')
  })

  it('adds the reduce-motion code to the snippet when turned on', () => {
    expect(model.reduceMotion).toBe(false)
    expect(snippetOf(model)).not.toContain('reduceMotion')
    expect(snippetOf(handleToggleReduceMotion(model))).toContain(
      'html.dataset.reduceMotion = "true"',
    )
  })

  it('puts only the enabled modes in the snippet', () => {
    expect(snippetOf(model)).toContain('light: Solarized Light, dark: stock')
    const both = handlePickPreset(handleSelectMode(model, 'dark'), 'dracula')
    expect(snippetOf(both)).toContain('light: Solarized Light, dark: Dracula')
  })
})

describe('decodeStored', () => {
  it('reads back what was stored', () => {
    const stored = JSON.parse(JSON.stringify(defaultStored))
    expect(decodeStored(stored, defaultStored)).toEqual(defaultStored)
  })

  it('reads settings saved before the glass option, with it off', () => {
    const old = JSON.parse(JSON.stringify(defaultStored))
    delete old.glassOff
    delete old.reduceMotion
    const decoded = decodeStored(old, defaultStored)
    expect(decoded.glassOff).toBe(false)
    expect(decoded.reduceMotion).toBe(false)
  })

  it('falls back on missing or invalid data', () => {
    expect(decodeStored(null, defaultStored)).toBe(defaultStored)
    const bad = JSON.parse(JSON.stringify(defaultStored))
    bad.light.theme.palette.canvas = 'red'
    expect(decodeStored(bad, defaultStored)).toBe(defaultStored)
  })
})
