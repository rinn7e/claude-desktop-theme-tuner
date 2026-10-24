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
  handleSetColor,
  handleToggleReduceMotion,
  handleToggleSlot,
  handleToggleSwapped,
  isEdited,
  snippetDoesSomething,
  snippetOf,
  update,
} from '../src/update'

const model: Model = {
  ...defaultStored,
  shown: 'theme',
  copied: null,
  copyFailed: null,
  helpOpen: false,
  menuOpen: false,
}

describe('sub-updaters', () => {
  it('starts with Solarized Light on and dark mode stock', () => {
    expect(model.light.enabled).toBe(true)
    expect(model.light.theme.id).toBe('solarized-light')
    expect(model.dark.enabled).toBe(false)
  })

  it('puts a preset in the slot of its own mode and turns it on', () => {
    const next = handlePickPreset(model, 'nord')
    expect(next.dark).toMatchObject({ enabled: true, theme: { id: 'nord' } })
    expect(next.light).toBe(model.light)
  })

  it('ignores an unknown preset', () => {
    expect(handlePickPreset(model, 'nope')).toBe(model)
  })

  it('edits a color without touching the preset', () => {
    const next = handleSetColor(model, 'light', 'canvas', '#ABCDEF')
    expect(next.light.theme.palette.canvas).toBe('#abcdef')
    expect(isEdited(next.light)).toBe(true)
    expect(isEdited(model.light)).toBe(false)
    expect(
      handlePickPreset(next, 'solarized-light').light.theme.palette.canvas,
    ).toBe('#fdf6e3')
  })

  it('edits each mode on its own', () => {
    const next = handleSetColor(model, 'dark', 'canvas', '#123456')
    expect(next.dark.theme.palette.canvas).toBe('#123456')
    expect(next.light).toBe(model.light)
  })

  it('rejects a half-typed color', () => {
    expect(handleSetColor(model, 'light', 'canvas', '#abc')).toBe(model)
  })

  it('resets edits back to the preset', () => {
    const next = handleResetSlot(
      handleSetColor(model, 'light', 'accent', '#000000'),
      'light',
    )
    expect(isEdited(next.light)).toBe(false)
  })

  it('toggles a mode on and off', () => {
    const off = handleToggleSlot(model, 'light')
    expect(off.light.enabled).toBe(false)
    expect(handleToggleSlot(off, 'light').light.enabled).toBe(true)
  })

  it('adds the reduce-motion code to the snippet when turned on', () => {
    expect(model.reduceMotion).toBe(false)
    expect(snippetOf(model)).not.toContain('reduceMotion')
    expect(snippetOf(handleToggleReduceMotion(model))).toContain(
      'html.dataset.reduceMotion = "true"',
    )
  })

  it('swaps the sides and back, without touching the snippet', () => {
    const swapped = handleToggleSwapped(model)
    expect(swapped.swapped).toBe(true)
    expect(snippetOf(swapped)).toBe(snippetOf(model))
    expect(handleToggleSwapped(swapped).swapped).toBe(false)
  })

  it('opens and closes the settings menu, and swapping from it closes it', () => {
    const [open] = update({ _tag: 'ToggleMenu' }, model)
    expect(open.menuOpen).toBe(true)
    expect(update({ _tag: 'CloseMenu' }, open)[0].menuOpen).toBe(false)
    const [swapped] = update({ _tag: 'ToggleSwapped' }, open)
    expect(swapped).toMatchObject({ swapped: true, menuOpen: false })
  })

  it('puts only the enabled modes in the snippet', () => {
    expect(snippetOf(model)).toContain('light: Solarized Light, dark: stock')
    const both = handlePickPreset(model, 'dracula')
    expect(snippetOf(both)).toContain('light: Solarized Light, dark: Dracula')
  })

  it('has no snippet to offer while both modes are stock', () => {
    const none = handleToggleSlot(model, 'light')
    expect(snippetDoesSomething(model)).toBe(true)
    expect(snippetDoesSomething(none)).toBe(false)
    expect(snippetDoesSomething(handleToggleReduceMotion(none))).toBe(true)
  })
})

describe('decodeStored', () => {
  it('reads back what was stored', () => {
    const stored = JSON.parse(JSON.stringify(defaultStored))
    expect(decodeStored(stored, defaultStored)).toEqual(defaultStored)
  })

  it('reads settings saved before reduce motion, with it off', () => {
    const old = JSON.parse(JSON.stringify(defaultStored))
    delete old.reduceMotion
    delete old.swapped
    const decoded = decodeStored(old, defaultStored)
    expect(decoded.reduceMotion).toBe(false)
    expect(decoded.swapped).toBe(false)
  })

  it('falls back on missing or invalid data', () => {
    expect(decodeStored(null, defaultStored)).toBe(defaultStored)
    const bad = JSON.parse(JSON.stringify(defaultStored))
    bad.light.theme.palette.canvas = 'red'
    expect(decodeStored(bad, defaultStored)).toBe(defaultStored)
  })
})
