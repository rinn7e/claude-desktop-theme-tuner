/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import {
  fitLook,
  lookDefinition,
  parseSetup,
  resolveMode,
  resolveSetup,
} from '../mod/hooks/look'
import { makeColors } from '../mod/hooks/make-colors.js'
import { linkHash } from '../src/storage/share-link'
import { allPresets } from '../src/theme/presets'
import { type Model } from '../src/type'
import {
  defaultStored,
  handlePickPreset,
  handleSetColor,
  modCommandOf,
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
  previewOnly: false,
}

describe('the Theme Tuner mod look', () => {
  // Claude paints none of a look its makeColors says it won't, so every
  // preset must come out paintable, lifting the text only where it has to
  it.each(allPresets().map((t) => [t.id, t] as const))(
    '%s paints',
    (_id, theme) => {
      const resolved = resolveMode(theme.mode, { preset: theme.id })
      if (!resolved.ok) throw new Error(resolved.error)
      const def = lookDefinition({ [theme.mode]: resolved.value })
      // Claude's own colors send no look at all
      if (!def.light && !def.dark) {
        expect(theme.id).toMatch(/^claude-/)
        return
      }
      const { problems, adjusted } = fitLook(def, makeColors)
      expect(
        problems.filter((l) => l.startsWith("Desktop won't paint")),
      ).toEqual([])
      // Only these two presets' text is too dim for one of Claude's highlights
      expect(adjusted.length > 0).toBe(
        ['github-dark-dimmed', 'min-dark'].includes(theme.id),
      )
    },
  )

  it('keeps the code theme of the preset', () => {
    const solarized = resolveMode('light', { preset: 'solarized-light' })
    const vsDark = resolveMode('dark', { preset: 'vs-code-dark' })
    if (!solarized.ok || !vsDark.ok) throw new Error('no preset')
    expect(
      lookDefinition({ light: solarized.value, dark: vsDark.value }).codeTheme,
    ).toEqual({ light: 'solarized-light', dark: 'vscode-dark' })
  })

  it('reads every web share link as the web tuner does', () => {
    const tuned = handleSetColor(
      handlePickPreset(model, 'dracula'),
      'light',
      'accent',
      '#c0009f',
    )
    const link = `https://rinn7e.com/claude-desktop-theme-tuner/${linkHash(presetOf(tuned))}`
    const parsed = parseSetup(link)
    if (!parsed.ok) throw new Error(parsed.error)
    const modes = resolveSetup(parsed.value)
    expect(modes.light?.palette).toEqual(tuned.light.theme.palette)
    expect(modes.dark?.palette).toEqual(tuned.dark.theme.palette)
  })

  it('applies the /tuner command the web tuner copies', () => {
    const command = modCommandOf(
      handlePickPreset(model, 'nord'),
      'https://rinn7e.com/claude-desktop-theme-tuner/',
    )
    expect(command).toMatch(
      /^\/tuner https:\/\/rinn7e\.com\/claude-desktop-theme-tuner\/#theme=/,
    )
    const parsed = parseSetup(command.replace(/^\/tuner /, ''))
    if (!parsed.ok) throw new Error(parsed.error)
    expect(parsed.value).toEqual({
      light: { preset: 'solarized-light' },
      dark: { preset: 'nord' },
    })
  })

  it.each([
    ['nope', 'No preset "nope"'],
    ['{"light": {"preset": "dracula"}}', '"dracula" is a dark preset.'],
    ['{bad', "The theme isn't valid JSON."],
    ['', 'Nothing to apply.'],
  ])('refuses %j', (text, error) => {
    const parsed = parseSetup(text)
    expect(parsed.ok ? '' : parsed.error).toContain(error)
  })
})
