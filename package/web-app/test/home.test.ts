/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { type Setup, checkSetup, parseSetup } from '../../claude-mod/hooks/look'
import {
  backdropCss,
  codeThemesOf,
  lookOf,
  presetsOf,
  previewPalette,
} from '../src/screen/home-screen/look'
import { type Model, type Msg } from '../src/screen/home-screen/type'
import {
  DEFAULT_SETUP,
  canResetMode,
  decodeSetup,
  editMode,
  pickPreset,
  readJson,
  resetMode,
  setKnob,
  setModeOn,
  setupOfHash,
  tunerCommand,
  update,
} from '../src/screen/home-screen/update'

const model: Model = {
  isBannerShown: true,
  setup: DEFAULT_SETUP,
  parked: {},
  jsonDraft: null,
  jsonError: null,
  copied: null,
  copyFailed: null,
}

const run = (msgs: Msg[], from: Model = model): Model =>
  msgs.reduce((m, msg) => update(msg, m)[0], from)

describe('the stored setup', () => {
  it('falls back to the default when there is none or it is broken', () => {
    expect(decodeSetup(null)).toEqual(DEFAULT_SETUP)
    expect(decodeSetup('{not json')).toEqual(DEFAULT_SETUP)
    expect(decodeSetup('{"light":{"preset":"dracula"}}')).toEqual(DEFAULT_SETUP)
  })

  it('keeps a setup the mod accepts', () => {
    const setup: Setup = {
      dark: { preset: 'nord', roles: { danger: '#ff0000' } },
    }
    expect(decodeSetup(JSON.stringify(setup))).toEqual(setup)
  })
})

describe('editing a mode', () => {
  it('sets a knob lowercased, and drops the record when the last is reset', () => {
    const set = editMode(DEFAULT_SETUP, 'dark', (c) =>
      setKnob(c, { group: 'roles', key: 'danger' }, '#FF5555'),
    )
    expect(set.dark).toEqual({
      preset: 'dracula',
      roles: { danger: '#ff5555' },
    })
    const reset = editMode(set, 'dark', (c) =>
      setKnob(c, { group: 'roles', key: 'danger' }, null),
    )
    expect(reset.dark).toEqual({ preset: 'dracula' })
  })

  it('leaves a mode out of the theme, and brings it back with its edits', () => {
    const edited = editMode(
      pickPreset(DEFAULT_SETUP, 'dark', 'nord'),
      'dark',
      (c) => setKnob(c, { group: 'roles', key: 'danger' }, '#ff0000'),
    )
    const off = setModeOn(edited, {}, 'dark', false)
    expect(off.setup.dark).toBeUndefined()
    const on = setModeOn(off.setup, off.parked, 'dark', true)
    expect(on.setup).toEqual(edited)
    expect(on.parked).toEqual({})
    // A mode never themed comes back as the default
    const light = setModeOn(
      setModeOn(DEFAULT_SETUP, {}, 'light', false).setup,
      {},
      'light',
      true,
    )
    expect(light.setup.light).toEqual(DEFAULT_SETUP.light)
  })

  it('drops a parked mode when a preset themes it again', () => {
    const off = run([{ _tag: 'SetModeOn', mode: 'dark', isOn: false }])
    expect(off.parked.dark).toEqual(DEFAULT_SETUP.dark)
    const picked = run([{ _tag: 'PickPreset', mode: 'dark', id: 'nord' }], off)
    expect(picked.setup.dark).toEqual({ preset: 'nord' })
    expect(picked.parked).toEqual({})
  })

  it('starts the mode afresh with a preset', () => {
    const edited = run([
      {
        _tag: 'SetKnob',
        mode: 'dark',
        knob: { group: 'anchors', key: 'surface-0' },
        value: '#101010',
      },
      { _tag: 'PickPreset', mode: 'dark', id: 'nord' },
    ])
    expect(edited.setup.dark).toEqual({ preset: 'nord' })
    expect(edited.setup.light).toEqual(DEFAULT_SETUP.light)
  })

  it('drops a code theme taken back to the preset, and keeps a name from JSON', () => {
    const named = readJson(
      DEFAULT_SETUP,
      '{"light":{"preset":"solarized-light","name":"Paper"}}',
    ).setup
    const edited = run(
      [{ _tag: 'SetCodeTheme', mode: 'light', value: 'github-light' }],
      {
        ...model,
        setup: named,
      },
    )
    expect(edited.setup.light).toEqual({
      preset: 'solarized-light',
      name: 'Paper',
      codeTheme: 'github-light',
    })
    const back = run(
      [{ _tag: 'SetCodeTheme', mode: 'light', value: null }],
      edited,
    )
    expect(back.setup.light).toEqual({
      preset: 'solarized-light',
      name: 'Paper',
    })
  })

  it('makes only setups the mod accepts', () => {
    const edited = run([
      {
        _tag: 'SetKnob',
        mode: 'dark',
        knob: { group: 'git', key: 'added' },
        value: '#50fa7b',
      },
      { _tag: 'SetCodeTheme', mode: 'dark', value: 'nord' },
      { _tag: 'SetContrast', isMore: true },
      {
        _tag: 'SetBackdrop',
        backdrop: { gradient: { stops: ['#000000', '#222222'], angle: 90 } },
      },
    ])
    const checked = checkSetup(JSON.parse(JSON.stringify(edited.setup)))
    expect(checked).toEqual({ ok: true, value: edited.setup })
    const off = run(
      [
        { _tag: 'SetContrast', isMore: false },
        { _tag: 'SetBackdrop', backdrop: null },
      ],
      edited,
    )
    expect(off.setup.contrast).toBeUndefined()
    expect(off.setup.backdrop).toBeUndefined()
  })
})

describe('reset to the preset', () => {
  it('drops every knob set over the preset, and keeps the name', () => {
    const setup: Setup = {
      light: {
        preset: 'solarized-light',
        name: 'Paper',
        anchors: { 'surface-0': '#ede7d4' },
        roles: { danger: '#ff0000' },
        codeTheme: 'github-light',
      },
    }
    expect(canResetMode(setup, 'light')).toBe(true)
    const reset = resetMode(setup, 'light')
    expect(reset.light).toEqual({ preset: 'solarized-light', name: 'Paper' })
    expect(canResetMode(reset, 'light')).toBe(false)
  })

  it('is not offered without a preset or a mode', () => {
    expect(canResetMode({}, 'dark')).toBe(false)
    expect(canResetMode(DEFAULT_SETUP, 'dark')).toBe(false)
  })
})

describe('the Theme JSON box', () => {
  it('merges preset ids into the modes they name', () => {
    const read = readJson(DEFAULT_SETUP, 'nord')
    expect(read).toEqual({
      setup: { light: DEFAULT_SETUP.light, dark: { preset: 'nord' } },
      error: null,
    })
  })

  it('replaces the setup with JSON', () => {
    expect(readJson(DEFAULT_SETUP, '{"dark":{"preset":"nord"}}').setup).toEqual(
      { dark: { preset: 'nord' } },
    )
  })

  it('keeps the setup and the text typed while it is not a setup', () => {
    const typing = run([{ _tag: 'EditJson', text: '{"dark":' }])
    expect(typing.setup).toBe(DEFAULT_SETUP)
    expect(typing.jsonDraft).toBe('{"dark":')
    expect(typing.jsonError).not.toBeNull()
    // Leaving keeps the text to fix; once it is a setup, the box follows it
    expect(run([{ _tag: 'LeaveJson' }], typing)).toBe(typing)
    const fixed = run(
      [
        { _tag: 'EditJson', text: '{"dark":{"preset":"nord"}}' },
        { _tag: 'LeaveJson' },
      ],
      typing,
    )
    expect(fixed.jsonDraft).toBeNull()
    expect(fixed.setup).toEqual({ dark: { preset: 'nord' } })
  })

  it('reads the setup of a link, as the mod pane links here', () => {
    const setup: Setup = { dark: { preset: 'nord' } }
    const hash = `#theme=${encodeURIComponent(JSON.stringify(setup))}`
    expect(setupOfHash(hash)).toEqual(setup)
    expect(setupOfHash('')).toBeNull()
    expect(setupOfHash('#theme=%7Bbroken')).toBeNull()
  })

  it('writes a command the mod reads back', () => {
    const setup: Setup = {
      dark: { preset: 'nord', anchors: { 'surface-0': '#101010' } },
      contrast: 'more',
    }
    const command = tunerCommand(setup)
    expect(command.startsWith('/tuner {')).toBe(true)
    expect(parseSetup(command.slice('/tuner '.length))).toEqual({
      ok: true,
      value: setup,
    })
  })
})

describe('the look of a setup', () => {
  it('paints the default setup', () => {
    const look = lookOf(DEFAULT_SETUP)
    expect(look.error).toBeNull()
    expect(look.modes.light?.knobs.length).toBeGreaterThan(0)
    expect(look.modes.dark?.derived['role-danger-400']).toMatch(/^#/)
  })

  it('shows a knob set here, and draws it in the preview', () => {
    const setup = editMode(DEFAULT_SETUP, 'light', (c) =>
      setKnob(c, { group: 'anchors', key: 'surface-0' }, '#ede7d4'),
    )
    const look = lookOf(setup)
    expect(look.modes.light?.knobs).toContainEqual({
      knob: 'surface-0',
      value: '#ede7d4',
      from: 'set',
    })
    expect(previewPalette(look, 'light').frame).toBe('#ede7d4')
  })

  it('says why Claude refuses a look, without throwing', () => {
    const setup = editMode(DEFAULT_SETUP, 'dark', (c) =>
      setKnob(c, { group: 'anchors', key: 'surface-0' }, '#ede7d4'),
    )
    const look = lookOf(setup)
    expect(look.error).toMatch(/surface-0/)
    expect(previewPalette(look, 'dark').frame).toBe('#ede7d4')
  })

  it("previews Claude's own colors for a stock or left-out mode", () => {
    const stock = presetsOf('light').find((p) => p.id === 'claude-light')
    const look = lookOf({ light: { preset: 'claude-light' } })
    expect(look.modes.light?.isStock).toBe(true)
    expect(previewPalette(look, 'light')).toEqual(stock?.palette)
    expect(previewPalette(look, 'dark')).toEqual(
      presetsOf('dark').find((p) => p.id === 'claude-dark')?.palette,
    )
  })

  it('takes surface-2 along with a surface-1 set alone, so Claude paints it', () => {
    const setup = editMode(DEFAULT_SETUP, 'dark', (c) =>
      setKnob(c, { group: 'anchors', key: 'surface-1' }, '#2e303e'),
    )
    const look = lookOf(setup)
    expect(look.error).toBeNull()
    expect(look.modes.dark?.knobs).toContainEqual({
      knob: 'surface-2',
      value: '#2e303e',
      from: 'surface-1',
    })
  })

  it("shows the values of Claude's own colors, though it sends none", () => {
    const look = lookOf({ light: { preset: 'claude-light' } })
    expect(look.definition.light).toBeUndefined()
    expect(look.definition.codeTheme).toBeUndefined()
    expect(look.modes.light?.knobs.map((k) => k.knob)).toContain('surface-0')
  })

  it('draws the backdrop in the preview as CSS', () => {
    expect(backdropCss(undefined)).toBeUndefined()
    expect(backdropCss({ color: '#112233' })).toBe('#112233')
    expect(backdropCss({ color: 'surface-0' })).toBe('var(--cds-surface-0)')
    expect(
      backdropCss({ gradient: { stops: ['#000000', '#ffffff'], angle: 90 } }),
    ).toBe('linear-gradient(90deg, #000000, #ffffff)')
    expect(
      backdropCss({
        gradient: { stops: ['#000000', '#ffffff'], shape: 'radial' },
      }),
    ).toBe('radial-gradient(circle, #000000, #ffffff)')
  })

  it('offers the code themes of each mode once', () => {
    const light = codeThemesOf('light')
    expect(light).toContain('solarized-light')
    expect(light).not.toContain('dracula')
    expect(new Set(light).size).toBe(light.length)
  })
})
