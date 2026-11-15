/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { expect, test } from 'claude-code/testing'

// Nothing sits beneath the mod: each hook here stands for the engine. A call
// on `$` is answered `{ value }`.

const PANE = {
  plugin: 'rinn7e-theme-tuner',
  component: 'Pane',
  requestId: 'rinn7e-theme-tuner',
  props: {
    title: 'Theme Tuner',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

// What the mod sent: every theme.set of a look, the sets of Claude's own
// colors (how the mod turns a look off), the store
type Sent = { sets: unknown[]; offs: number; store: Map<string, unknown> }

const engine = (
  on: Parameters<Parameters<typeof test>[1]>[1],
  stored?: unknown,
): Sent => {
  const sent: Sent = { sets: [], offs: 0, store: new Map() }
  if (stored !== undefined) sent.store.set('setup', stored)
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('tool.register', (_, e) => ({
    value: { tool: `mcp__rinn7e-theme-tuner__${e.name}` },
  }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('store.get', (_, e) => ({ value: sent.store.get(e.key) }))
  on('store.set', (_, e) => {
    sent.store.set(e.key, e.value)
    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    sent.store.delete(e.key)
    return { value: undefined }
  })
  on('theme.set', (_, e) => {
    if (JSON.stringify(e).includes(`"label":"Claude's own colors"`))
      sent.offs += 1
    else sent.sets.push(e)
    return { value: { isDrawn: true, requestId: 'theme' } }
  })
  return sent
}

const start = ($: Parameters<Parameters<typeof test>[1]>[0]) =>
  $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

test('a setup kept from an earlier session is sent at the start', async ($, on) => {
  const sent = engine(on, { light: { preset: 'solarized-light' } })
  await start($)
  expect(sent.sets).toHaveLength(1)
  expect(JSON.stringify(sent.sets[0])).toContain('Solarized Light')
})

test('nothing is sent when no setup was kept', async ($, on) => {
  const sent = engine(on)
  await start($)
  expect(sent.sets).toHaveLength(0)
  expect(sent.offs).toBe(0)
})

test('/theme-tuner applies presets by id, as its alias /tuner does', async ($, on) => {
  const sent = engine(on)
  await start($)
  const { text } = await $.command.run({
    command: 'theme-tuner',
    args: 'nord',
  })
  expect(text).toBe('Theme set: Nord.')
  expect(sent.store.get('setup')).toEqual({ dark: { preset: 'nord' } })
})

test('/tuner applies presets by id and keeps them', async ($, on) => {
  const sent = engine(on)
  await start($)
  const { text } = await $.command.run({
    command: 'tuner',
    args: 'solarized-light dracula',
  })
  expect(text).toBe('Theme set: Solarized Light / Dracula.')
  expect(sent.store.get('setup')).toEqual({
    light: { preset: 'solarized-light' },
    dark: { preset: 'dracula' },
  })
})

test('/tuner applies a web tuner share link', async ($, on) => {
  const sent = engine(on)
  await start($)
  const link =
    'https://rinn7e.com/claude-desktop-theme-tuner/#theme=' +
    encodeURIComponent(
      JSON.stringify({
        light: { preset: 'solarized-light', colors: { accent: '#C0009F' } },
      }),
    )
  await $.command.run({ command: 'tuner', args: link })
  expect(sent.store.get('setup')).toEqual({
    light: { preset: 'solarized-light', colors: { accent: '#c0009f' } },
  })
})

test('/tuner says why it refuses, and keeps nothing', async ($, on) => {
  const sent = engine(on)
  await start($)
  const { text } = await $.command.run({ command: 'tuner', args: 'nope' })
  expect(text).toContain('No preset "nope"')
  expect(sent.store.has('setup')).toBe(false)
  expect(sent.sets).toHaveLength(0)
})

test("/tuner off sends Claude's own colors and drops the kept setup", async ($, on) => {
  const sent = engine(on, { dark: { preset: 'nord' } })
  await start($)
  await $.command.run({ command: 'tuner', args: 'off' })
  expect(sent.offs).toBe(1)
  expect(sent.store.has('setup')).toBe(false)
})

test('the model sets a theme with the tool', async ($, on) => {
  const sent = engine(on)
  await start($)
  const ran = await $.tool.call({
    tool: 'mcp__rinn7e-theme-tuner__set_theme',
    dark: { preset: 'tokyo-night', colors: { accent: '#ff79c6' } },
  })
  expect(String(ran.result)).toContain('Theme set: Tokyo Night.')
  expect(String(ran.result)).toContain('#theme=')
  expect(sent.store.get('setup')).toEqual({
    dark: { preset: 'tokyo-night', colors: { accent: '#ff79c6' } },
  })
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the pane picks presets and applies JSON, on ${surface}`, async ($, on) => {
    const sent = engine(on)
    await start($)
    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.select({ key: 'light', value: 'github-light' })
    expect(sent.store.get('setup')).toEqual({
      light: { preset: 'github-light' },
    })
    // The knobs sent to Claude are listed with their values
    expect((await ui.find({ type: 'Text', text: /^surface-0$/ }))?.text).toBe(
      'surface-0',
    )
    expect(
      (await ui.find({ type: 'Text', text: /^github-light$/ }))?.text,
    ).toBe('github-light')
    // The JSON box applies a whole setup, colors included
    await ui.input({
      key: 'json',
      text: '{"light": {"preset": "github-light", "colors": {"accent": "#123456"}}, "dark": {"preset": "nord"}}',
    })
    expect(sent.store.get('setup')).toEqual({
      light: { preset: 'github-light', colors: { accent: '#123456' } },
      dark: { preset: 'nord' },
    })
    await ui.input({
      key: 'json',
      text: '{"light": {"preset": "github-light", "colors": {"accent": "blue"}}}',
    })
    expect((await ui.find({ type: 'Text', text: /invalid color/ }))?.text).toBe(
      'The light theme has an invalid color (accent).',
    )
    await ui.press({ key: 'off' })
    expect(sent.offs).toBe(1)
    expect(sent.store.has('setup')).toBe(false)
    await ui.unmount()
  })
}

test("a setup of Claude's own colors sends nothing at the start", async ($, on) => {
  // Sending at a start would replace another mod's theme in every session
  const sent = engine(on, { light: { preset: 'claude-light' } })
  await start($)
  expect(sent.sets).toHaveLength(0)
  expect(sent.offs).toBe(0)
})

test('preset ids replace only the modes they name', async ($, on) => {
  const sent = engine(on, { light: { preset: 'solarized-light' } })
  await start($)
  await $.command.run({ command: 'tuner', args: 'dracula' })
  expect(sent.store.get('setup')).toEqual({
    light: { preset: 'solarized-light' },
    dark: { preset: 'dracula' },
  })
  const { text } = await $.command.run({
    command: 'tuner',
    args: 'dracula nord',
  })
  expect(text).toBe('Two dark presets: give one per mode.')
})

test('long names still make a look Claude takes', async ($, on) => {
  // makeColors refuses a label over 64 characters
  const sent = engine(on)
  await start($)
  const name = 'A rather long name for my own theme of the day'
  await $.tool.call({
    tool: 'mcp__rinn7e-theme-tuner__set_theme',
    light: { preset: 'github-light', name },
    dark: { preset: 'github-dark', name },
  })
  expect(sent.sets).toHaveLength(1)
})

test('a look no preset names shows as Custom', async ($, on) => {
  const palette = {
    frame: '#eeeeee',
    canvas: '#ffffff',
    raised: '#f5f5f5',
    pressed: '#e0e0e0',
    text: '#111111',
    textSecondary: '#444444',
    textMuted: '#555555',
    line: '#888888',
    accent: '#0055aa',
    accentHover: '#004488',
    onAccent: '#ffffff',
    selected: '#dddddd',
    wash: '#888888',
  }
  engine(on, { light: { name: 'Mine', colors: palette } })
  await start($)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const light = await ui.find({ type: 'Select', key: 'light' })
  expect(light?.props.value).toBe('custom')
  expect(
    String((await ui.find({ type: 'Input', key: 'json' }))?.props.value),
  ).toContain('"name": "Mine"')
  await ui.unmount()
})

test('the model sets every knob, and the backdrop reaches Claude', async ($, on) => {
  const sent = engine(on)
  await start($)
  await $.tool.call({
    tool: 'mcp__rinn7e-theme-tuner__set_theme',
    light: {
      preset: 'solarized-light',
      roles: { danger: '#dc322f' },
    },
    dark: { preset: 'nord', anchors: { 'surface-3': '#353c4a' } },
    contrast: 'more',
    backdrop: { gradient: { stops: ['#fdf6e3', '#eee8d5'], angle: 135 } },
  })
  const set = sent.sets[0] as {
    backdrop?: unknown
    colors?: { contrast?: string }
  }
  expect(set.backdrop).toEqual({
    gradient: { stops: ['#fdf6e3', '#eee8d5'], angle: 135 },
  })
  expect(set.colors?.contrast).toBe('more')
  expect(sent.store.get('setup')).toMatchObject({ contrast: 'more' })
})

test("a code theme of null leaves Claude's picker free for the mode", async ($, on) => {
  const sent = engine(on)
  await start($)
  await $.tool.call({
    tool: 'mcp__rinn7e-theme-tuner__set_theme',
    light: { preset: 'solarized-light', codeTheme: null },
    dark: { preset: 'dracula' },
  })
  const set = sent.sets[0] as {
    colors?: { codeTheme?: { light?: string; dark?: string } }
  }
  expect(set.colors?.codeTheme?.light).toBeUndefined()
  expect(set.colors?.codeTheme?.dark).toBe('dracula')
  expect(sent.store.get('setup')).toMatchObject({
    light: { preset: 'solarized-light', codeTheme: null },
  })
})
