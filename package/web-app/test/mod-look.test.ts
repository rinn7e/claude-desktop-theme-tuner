/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import {
  checkSetup,
  fitLook,
  knobsOf,
  lookDefinition,
  parseSetup,
  resolveMode,
  resolveSetup,
  sidebarBase,
} from '../../claude-mod/hooks/look'
import { makeColors } from '../../claude-mod/hooks/make-colors.js'
import { type Model } from '../src/screen/legacy-screen/type'
import {
  defaultStored,
  handlePickPreset,
  handleSetColor,
  modCommandOf,
  presetOf,
} from '../src/screen/legacy-screen/update'
import { linkHash } from '../src/storage/share-link'
import { allPresets } from '../src/theme/presets'

const model: Model = {
  ...defaultStored,
  shown: 'theme',
  copied: null,
  copyFailed: null,
  helpOpen: false,
  menuOpen: false,
  presetNotice: null,
  previewOnly: false,
  isBannerShown: true,
}

describe('the sidebar of a light look', () => {
  it('mixes with the canvas back into the frame', () => {
    expect(sidebarBase('#eee8d5', '#fdf6e3')).toBe('#dfdac7')
    // Each channel stays within 0 to 255
    expect(sidebarBase('#101010', '#f0f0f0')).toBe('#000000')
  })
})

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
      // Only these presets need a fit: two have text too dim for one of
      // Claude's highlights, two an accent step Claude refuses
      expect(adjusted).toEqual(
        {
          'github-dark-dimmed': [
            'dark text made stronger so Claude paints the theme',
          ],
          'min-dark': ['dark text made stronger so Claude paints the theme'],
          'one-light': [
            "light accent links left to Claude's ramp so Claude paints the theme",
          ],
          'catppuccin-latte': [
            "light accent button hover left to Claude's ramp so Claude paints the theme",
          ],
        }[theme.id] ?? [],
      )
    },
  )

  it('lists the knobs it sends, by the names of Claude', () => {
    const dimmed = resolveMode('dark', { preset: 'github-dark-dimmed' })
    if (!dimmed.ok) throw new Error(dimmed.error)
    const { definition } = fitLook(
      lookDefinition({ dark: dimmed.value }),
      makeColors,
    )
    const knobs = knobsOf('dark', dimmed.value, definition)
    expect(knobs.map((k) => k.knob)).toEqual([
      'surface-0',
      'surface-1',
      'surface-2',
      'text-primary',
      'text-secondary',
      'text-muted',
      'roles.accent',
      'codeTheme',
    ])
    expect(knobs[0]).toEqual({
      knob: 'surface-0',
      value: dimmed.value.palette.frame,
      from: 'frame',
    })
    // Its text is lifted so Claude paints the look, and says so
    expect(knobs[3]?.from).toBe('text, made stronger to paint')
    expect(knobs[3]?.value).not.toBe(dimmed.value.palette.text)
    expect(knobs[7]?.value).toBe('github-dark-dimmed')
  })

  it('sends the knobs a mode sets directly over the palette', () => {
    const checked = checkSetup({
      light: {
        preset: 'solarized-light',
        // In light mode surface-3 must match surface-2: only dark sets it
        anchors: { 'text-primary': '#002B36' },
        roles: { danger: '#dc322f' },
        git: { added: '#859900' },
        codeTheme: 'github-light',
      },
      dark: { preset: 'nord', anchors: { 'surface-3': '#353c4a' } },
      contrast: 'more',
    })
    if (!checked.ok) throw new Error(checked.error)
    const modes = resolveSetup(checked.value)
    const def = lookDefinition(modes, { contrast: checked.value.contrast })
    expect(def.light?.gray.anchors).toMatchObject({
      // As far below the frame (#eee8d5) as the canvas (#fdf6e3) is above:
      // Claude mixes the two half and half into the sidebar
      'surface-0': '#dfdac7',
      'text-primary': '#002b36',
    })
    expect(def.dark?.gray.anchors['surface-3']).toBe('#353c4a')
    // The accent of the palette, with the steps Claude paints links (600),
    // buttons (450) and their hover (400) with pinned to the palette's
    expect(def.light?.roles).toEqual({
      accent: {
        seed: '#ad461b',
        stops: { '600': '#ad461b', '450': '#ad461b', '400': '#94421f' },
      },
      danger: '#dc322f',
    })
    expect(def.light?.git).toEqual({ added: '#859900' })
    expect(def.codeTheme).toEqual({ light: 'github-light', dark: 'nord' })
    expect(def.contrast).toBe('more')
    const light = modes.light
    if (!light) throw new Error('no light mode')
    const knobs = knobsOf('light', light, def)
    expect(knobs.find((k) => k.knob === 'text-primary')?.from).toBe('set')
    expect(knobs.find((k) => k.knob === 'roles.danger')?.from).toBe('set')
    expect(knobs.find((k) => k.knob === 'git.added')?.value).toBe('#859900')
    expect(knobs.find((k) => k.knob === 'codeTheme')?.from).toBe('set')
    // It still paints, as the presets do
    expect(() => fitLook(def, makeColors)).not.toThrow()
  })

  it("tunes Claude's own colors once a knob is set", () => {
    const own = resolveSetup({ dark: { preset: 'claude-dark' } })
    expect(lookDefinition(own).dark).toBeUndefined()
    const tuned = resolveSetup({
      dark: { preset: 'claude-dark', roles: { accent: '#ff79c6' } },
    })
    expect(lookDefinition(tuned).dark?.roles.accent).toBe('#ff79c6')
  })

  it.each([
    [
      { light: { preset: 'solarized-light', anchors: { page: '#ffffff' } } },
      'Unknown anchor "page"',
    ],
    [
      { light: { preset: 'solarized-light', roles: { danger: 'red' } } },
      'invalid color (danger)',
    ],
    [{ contrast: 'less' }, 'The contrast is "more"'],
    [{ backdrop: { gradient: { stops: ['#ffffff'] } } }, '2 to 16 colors'],
    [{ backdrop: { color: 'url(evil)' } }, 'backdrop color'],
  ])('refuses the knobs of %j', (raw, error) => {
    const checked = checkSetup(raw)
    expect(checked.ok ? '' : checked.error).toContain(error)
  })

  it('keeps a backdrop, a color or a gradient', () => {
    const checked = checkSetup({
      backdrop: { gradient: { stops: ['#FDF6E3', '#eee8d5'], angle: 135 } },
    })
    expect(checked.ok && checked.value.backdrop).toEqual({
      gradient: { stops: ['#fdf6e3', '#eee8d5'], angle: 135 },
    })
    const named = checkSetup({ backdrop: { color: 'surface-0' } })
    expect(named.ok && named.value.backdrop).toEqual({ color: 'surface-0' })
  })

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
