/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { themeCss } from '../src/theme/css'
import { presetById } from '../src/theme/presets'
import {
  REVERT_COMMAND,
  STYLE_ID,
  templateLiteral,
  themeSnippet,
} from '../src/theme/snippet'
import { deriveTokens } from '../src/theme/tokens'

const solarized = presetById('solarized-light')!
const dracula = presetById('dracula')!

describe('deriveTokens', () => {
  // The values universal-theme-tuner's hand-written Solarized theme set
  it('reproduces the hand-written Solarized Light theme', () => {
    const { root, frame } = deriveTokens(solarized.palette)
    expect(root['--cds-surface-0']).toBe('#eee8d5')
    expect(root['--cds-surface-1']).toBe('#fdf6e3')
    expect(root['--cds-surface-3']).toBe('#f5efdc')
    expect(root['--cds-border']).toBe('rgba(88, 110, 117, 0.22)')
    expect(root['--cds-alpha-1']).toBe('rgba(181, 137, 0, 0.07)')
    expect(root['--cds-fill-ghost-hover']).toBe('rgba(223, 202, 136, 0.27)')
    expect(root['--cds-fizzy-lake-color-sidebar']).toBe('#eee8d5')
    expect(root['--bg-000']).toBe('43.8 86.7% 94.1%')
    expect(root['--text-200']).toBe('194.1 19.8% 33.7%')
    expect(frame['--df-z0']).toBe('43.8 86.7% 94.1%')
    expect(frame['--df-selected']).toBe('#dfca88')
  })

  it('pins the docked sidebar tint, which Claude sets with a stronger selector', () => {
    const { frame } = deriveTokens(dracula.palette)
    expect(frame['--df-sidebar-tint']).toBe('#21222c !important')
    expect(frame['--df-sidebar-tint-share']).toBe('100% !important')
  })

  it('sets the text on accent buttons', () => {
    expect(deriveTokens(dracula.palette).root['--cds-on-accent']).toBe(
      '#282a36',
    )
  })
})

describe('themeCss', () => {
  it('themes both modes, each under its own and the system selectors', () => {
    const css = themeCss({ light: solarized, dark: dracula })
    expect(css).toContain('light: Solarized Light, dark: Dracula')
    expect(css).toContain('html.cds-root[data-mode="light"]')
    expect(css).toContain('html.cds-root[data-mode="dark"]')
    expect(css).toContain('@media (prefers-color-scheme: light)')
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    expect(css).toContain('html[data-mode="dark"] .dframe-root .dframe-sidebar')
    expect(css).toContain('html[data-mode="system"] .dframe-root')
  })

  it('leaves a mode without a theme stock', () => {
    const css = themeCss({ light: solarized, dark: null })
    expect(css).toContain('dark: stock')
    expect(css).not.toContain('html.cds-root[data-mode="dark"]')
    expect(css).not.toContain('prefers-color-scheme: dark')
  })

  it('balances its braces', () => {
    const css = themeCss({ light: solarized, dark: dracula })
    expect(css.split('{').length).toBe(css.split('}').length)
  })
})

describe('themeSnippet', () => {
  it('is runnable JavaScript that installs the CSS under one id', () => {
    const js = themeSnippet('a{color:red}')
    expect(() => new Function(js)).not.toThrow()
    expect(js).toContain(JSON.stringify(STYLE_ID))
    expect(js).toContain('`a{color:red}`')
  })

  it('keeps the CSS readable, one rule per line', () => {
    expect(themeSnippet('a {\n  color: red;\n}')).toContain(
      'a {\n  color: red;\n}',
    )
  })

  it('embeds any text inertly in its template literal', () => {
    const nasty = 'a\\b `tick` ${alert(1)} \\${x} end'
    expect(new Function(`return ${templateLiteral(nasty)}`)()).toBe(nasty)
  })

  it('removes the older Solarized snippet so the two never stack', () => {
    expect(themeSnippet('')).toContain('user-solarized-light-theme')
  })

  it('reverts by removing that id', () => {
    expect(REVERT_COMMAND).toContain(STYLE_ID)
  })
})
