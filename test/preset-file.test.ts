/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import {
  type PresetFile,
  decodePresetFile,
  encodePresetFile,
  presetFileName,
} from '../src/storage/preset-file'
import { themeCss } from '../src/theme/css'
import { presetById } from '../src/theme/presets'
import { type Model } from '../src/type'
import {
  canReset,
  defaultStored,
  handlePresetFileRead,
  handleSetColor,
  presetOf,
} from '../src/update'

const model: Model = {
  ...defaultStored,
  shown: 'theme',
  copied: null,
  copyFailed: null,
  helpOpen: false,
  menuOpen: false,
  presetNotice: null,
}

const preset: PresetFile = presetOf(model)

// The file as JSON, changed by `edit`, back to text
const tweaked = (edit: (file: Record<string, unknown>) => void): string => {
  const file = JSON.parse(encodePresetFile(preset)) as Record<string, unknown>
  edit(file)
  return JSON.stringify(file)
}

describe('preset files', () => {
  it('load back what was saved', () => {
    expect(decodePresetFile(encodePresetFile(preset))).toEqual({
      ok: true,
      preset,
    })
  })

  it('are named after the two themes', () => {
    expect(presetFileName(preset)).toBe(
      'claude-theme-solarized-light-stock.json',
    )
  })

  it('refuse text that is not JSON', () => {
    expect(decodePresetFile('not json')).toEqual({
      ok: false,
      error: "That file isn't JSON.",
    })
  })

  it('refuse JSON that is not a tuner preset', () => {
    const result = decodePresetFile(tweaked((f) => (f.format = 'other')))
    expect(result.ok).toBe(false)
  })

  it('name the color that is not a hex color', () => {
    const text = tweaked((f) => {
      const dark = f.dark as { theme: { palette: Record<string, string> } }
      dark.theme.palette.textMuted = 'red'
    })
    expect(decodePresetFile(text)).toEqual({
      ok: false,
      error: 'The dark theme has an invalid color (textMuted).',
    })
  })

  it('refuse a theme in the wrong mode', () => {
    const text = tweaked((f) => {
      ;(f.light as { theme: { mode: string } }).theme.mode = 'dark'
    })
    expect(decodePresetFile(text)).toEqual({
      ok: false,
      error: 'The light slot holds a dark theme.',
    })
  })

  it('keep names from closing the snippet comment', () => {
    const text = tweaked((f) => {
      ;(f.light as { theme: { name: string } }).theme.name =
        'Nice */ html { background: url(https://evil.example) } /*'
    })
    const result = decodePresetFile(text)
    if (!result.ok) throw new Error(result.error)
    const css = themeCss({ light: result.preset.light.theme, dark: null })
    expect(css).not.toContain('*/ html')
    expect(result.preset.light.theme.name).not.toContain('*/')
  })

  it('drop credit links that are not https', () => {
    const text = tweaked((f) => {
      ;(f.light as { theme: { credit: { url: string } } }).theme.credit.url =
        'javascript:alert(1)'
    })
    const result = decodePresetFile(text)
    if (!result.ok) throw new Error(result.error)
    expect(result.preset.light.theme.credit).toBeUndefined()
  })
})

describe('loading a preset file', () => {
  it('puts its setup in place and says so', () => {
    const nord = presetById('nord')
    if (!nord) throw new Error('no nord preset')
    const file = encodePresetFile({
      ...preset,
      dark: { enabled: true, theme: nord },
      reduceMotion: true,
    })
    const next = handlePresetFileRead(model, 'mine.json', file)
    expect(next.dark.theme.id).toBe('nord')
    expect(next.reduceMotion).toBe(true)
    expect(next.presetNotice).toEqual({
      kind: 'loaded',
      text: 'Loaded mine.json.',
    })
  })

  it('keeps the setup and explains a refused file', () => {
    const next = handlePresetFileRead(model, 'bad.json', '{}')
    expect(next.light).toBe(model.light)
    expect(next.presetNotice?.kind).toBe('error')
  })

  it('offers Reset only when there is a preset to go back to', () => {
    const edited = handleSetColor(model, 'light', 'accent', '#123456')
    expect(canReset(edited.light)).toBe(true)
    const custom = {
      ...edited.light,
      theme: { ...edited.light.theme, id: 'my-own' },
    }
    expect(canReset(custom)).toBe(false)
  })
})
