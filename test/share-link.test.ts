/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { type PresetFile } from '../src/storage/preset-file'
import {
  decodeLinkSetup,
  encodeLinkSetup,
  linkHash,
  parseLinkHash,
} from '../src/storage/share-link'
import { themeCss } from '../src/theme/css'
import { allPresets, presetById } from '../src/theme/presets'
import { type Model } from '../src/type'
import {
  defaultStored,
  handleLinkSetup,
  handlePickPreset,
  handleSetColor,
  presetOf,
  shareLinkOf,
} from '../src/update'

const model: Model = {
  ...defaultStored,
  shown: 'theme',
  copied: null,
  copyFailed: null,
  helpOpen: false,
  menuOpen: false,
  presetNotice: null,
  previewOnly: false,
}

const fallback: PresetFile = presetOf(model)

const decode = (setup: unknown) =>
  decodeLinkSetup(JSON.stringify(setup), fallback)

const errorOf = (setup: unknown): string => {
  const result = decode(setup)
  return result.ok ? '' : result.error
}

describe('share links', () => {
  it('load back what was copied, edits included', () => {
    const edited = handleSetColor(
      handlePickPreset(model, 'dracula'),
      'light',
      'accent',
      '#c0009f',
    )
    const back = parseLinkHash(linkHash(presetOf(edited)), fallback)
    expect(back.setup).toEqual({ ok: true, preset: presetOf(edited) })
    expect(back.previewOnly).toBe(false)
  })

  it('carry only the preset and the changed colors', () => {
    const edited = handleSetColor(model, 'light', 'accent', '#c0009f')
    expect(JSON.parse(encodeLinkSetup(presetOf(edited)))).toEqual({
      light: { preset: 'solarized-light', colors: { accent: '#c0009f' } },
    })
  })

  it('override a preset with the given colors, keeping the rest', () => {
    const result = decode({
      light: { preset: 'solarized-light', colors: { accent: '#C0009F' } },
    })
    if (!result.ok) throw new Error(result.error)
    const solarized = presetById('solarized-light')!
    expect(result.preset.light.theme.palette).toEqual({
      ...solarized.palette,
      accent: '#c0009f',
    })
    expect(result.preset.light.theme.credit).toEqual(solarized.credit)
    expect(result.preset.light.theme.name).toBe('Solarized Light')
  })

  it('leave a mode stock when the link leaves it out', () => {
    const result = decode({ dark: { preset: 'nord' } })
    if (!result.ok) throw new Error(result.error)
    expect(result.preset.light.enabled).toBe(false)
    expect(result.preset.dark.enabled).toBe(true)
    expect(result.preset.reduceMotion).toBe(false)
  })

  it('take a full custom palette without a preset', () => {
    const palette = presetById('nord')!.palette
    const result = decode({ dark: { name: 'Mine', colors: palette } })
    if (!result.ok) throw new Error(result.error)
    expect(result.preset.dark.theme).toMatchObject({
      id: 'custom',
      name: 'Mine',
      palette,
    })
  })

  it.each([
    [{ light: { preset: 'nope' } }, 'No preset "nope".'],
    [{ light: { preset: 'dracula' } }, '"dracula" is a dark preset.'],
    [
      { light: { preset: 'solarized-light', colors: { accent: 'magenta' } } },
      'The light theme has an invalid color (accent).',
    ],
    [
      { light: { preset: 'solarized-light', colors: { glow: '#ff00ff' } } },
      'Unknown color "glow" in the light theme.',
    ],
    [
      { dark: { colors: { accent: '#ff00ff' } } },
      'The dark theme needs a preset or all 13 colors (frame is missing).',
    ],
    [{ light: 'solarized-light' }, 'The light theme is invalid.'],
    [[], 'the theme in the link is invalid.'],
  ])('refuse %j', (setup, error) => {
    expect(errorOf(setup)).toBe(error)
  })

  it('refuse a name that would close the snippet comment', () => {
    const result = decode({
      light: { preset: 'solarized-light', name: 'x */ body{display:none} /*' },
    })
    if (!result.ok) throw new Error(result.error)
    const css = themeCss({ light: result.preset.light.theme, dark: null })
    expect(css).not.toContain('display:none} /*')
    expect(result.preset.light.theme.name).not.toContain('*/')
  })

  it('read the preview view and survive a mangled hash', () => {
    expect(parseLinkHash('#view=preview', fallback)).toEqual({
      setup: null,
      previewOnly: true,
    })
    expect(parseLinkHash('#theme=%7B%E0', fallback).setup).toEqual({
      ok: false,
      error: 'the link is cut off or mangled.',
    })
    expect(parseLinkHash('', fallback)).toEqual({
      setup: null,
      previewOnly: false,
    })
  })

  it('load into the model with a notice, or say why not', () => {
    const loaded = handleLinkSetup(model, decode({ dark: { preset: 'nord' } }))
    expect(loaded.dark.theme.id).toBe('nord')
    expect(loaded.presetNotice?.kind).toBe('loaded')
    const refused = handleLinkSetup(model, decode({ dark: { preset: 'x' } }))
    expect(refused.dark).toEqual(model.dark)
    expect(refused.presetNotice).toEqual({
      kind: 'error',
      text: 'Couldn\'t load the link: No preset "x".',
    })
  })

  it('are the page address plus the setup', () => {
    expect(shareLinkOf(model, 'https://example.com/tuner/')).toBe(
      'https://example.com/tuner/' + linkHash(presetOf(model)),
    )
  })

  it('are documented for agents with every preset id', () => {
    const guide = readFileSync('public/llms.txt', 'utf8')
    for (const theme of allPresets()) expect(guide).toContain(theme.id)
  })
})
