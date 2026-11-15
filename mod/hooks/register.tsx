/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import {
  type Mode,
  PALETTE_KEYS,
  type PaletteKey,
  type Setup,
  checkSetup,
  fitLook,
  isPresetList,
  lookDefinition,
  parseSetup,
  presetById,
  resolveMode,
  resolveSetup,
  tunerLink,
} from './look'
import { makeColors } from './make-colors.js'
import { PRESETS } from './presets'

// The Theme Tuner as a mod: the setup a person picks (a preset and colors
// per mode, the JSON of a web tuner share link) is kept in the store and
// sent as Claude's look at every session start. /tuner opens the pane,
// /tuner <link or preset ids> applies one, and the model can set one with
// the set_theme tool.

// The command (tuner) and the tool (set_theme) are written as literals where
// they are registered and matched, so `claude plugin validate` reads them
const PANE = 'theme-tuner'
// The store key of the setup, the same in every session
const SETUP_KEY = 'setup'
const WEB = 'https://rinn7e.com/claude-desktop-theme-tuner/'
const OFF = "Theme off: Claude's own colors."
// The pickers' entry for a look no preset names (a theme from a file, or
// Claude's own colors tuned)
const CUSTOM = 'custom'

const setupState = atom(
  { plugin: 'theme-tuner', key: 'setup' } as const,
  {},
  {
    shape: 'setup-1',
  },
)
const editing = atom(
  { plugin: 'theme-tuner', key: 'editing' } as const,
  'light' as Mode,
)
const notice = atom(
  { plugin: 'theme-tuner', key: 'notice' } as const,
  null as string | null,
)

// The colors the look uses, in the order the pane lists them, with what
// each paints in Claude
const FIELDS: { key: PaletteKey; label: string }[] = [
  { key: 'frame', label: 'Sidebar' },
  { key: 'canvas', label: 'Chat' },
  { key: 'text', label: 'Text' },
  { key: 'textSecondary', label: 'Secondary text' },
  { key: 'textMuted', label: 'Muted text' },
  { key: 'accent', label: 'Accent' },
]

const HEX = /^#[0-9a-f]{6}$/i

const TOOL_DESCRIPTION = `Sets the theme of the Claude desktop app (Claude Code sessions, light and dark mode) and keeps it for later sessions. Give a preset per mode, and optionally colors that override it.

Light presets: ${PRESETS.filter((p) => p.mode === 'light')
  .map((p) => p.id)
  .join(', ')}.
Dark presets: ${PRESETS.filter((p) => p.mode === 'dark')
  .map((p) => p.id)
  .join(', ')}.
claude-light and claude-dark are Claude's own colors. A mode left out keeps Claude's own colors.

Colors are #rrggbb by palette role: frame (sidebar), canvas (chat area), text, textSecondary (labels, Claude's thinking), textMuted (hints), accent (links, buttons). Keep text at 7:1 on frame and canvas, textSecondary dimmer than text, and the accent readable as link text (4.5:1 on canvas): darken a bright accent. Without a preset all 13 roles are needed (also raised, pressed, line, accentHover, onAccent, selected, wash). The same JSON as a Claude Desktop Theme Tuner link (${WEB}llms.txt).`

// A misspelled key is refused, not dropped
const MODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    preset: { type: 'string', description: 'A preset id of this mode.' },
    name: { type: 'string', description: 'A name for the theme.' },
    colors: {
      type: 'object',
      description: 'Colors that override the preset, as #rrggbb by role.',
      propertyNames: { enum: [...PALETTE_KEYS] },
      additionalProperties: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    },
  },
}

// The setup the store holds now: every session shares it, so an edit starts
// from it rather than from what this session read earlier
const storedSetup = async ($: EngineInterface): Promise<Setup> => {
  const checked = checkSetup((await $.store.get(SETUP_KEY)) ?? {})
  return checked.ok ? checked.value : {}
}

// The look for a setup, built before anything is kept: null where every
// mode is Claude's own colors. Throws where Claude would not paint it.
type Prepared = {
  look: ThemeSetArgs | null
  label: string
  adjusted: string[]
}

const prepare = (setup: Setup): Prepared => {
  const def = lookDefinition(resolveSetup(setup))
  if (!def.light && !def.dark) return { look: null, label: '', adjusted: [] }
  const { theme, adjusted } = fitLook(def, makeColors)
  return { look: { colors: theme }, label: def.label, adjusted }
}

// Sends a prepared look and says what came of it
const send = async (
  $: EngineInterface,
  { look, label, adjusted }: Prepared,
): Promise<string> => {
  if (look === null) {
    await $.theme.clear()
    return OFF
  }
  const set = await $.theme.set(look)
  const said = set.isDrawn
    ? `Theme set: ${label}.`
    : `Theme saved: ${label}. Nothing draws it here: ${set.reason.replace(/[.\s]*$/, '.')}`
  return [said, ...adjusted.map((a) => `(${a}.)`)].join(' ')
}

// What the person or the model chose: checked and built first, then kept
// for every session, then sent, and what came of it shown in the pane.
// Clearing the theme here is the person's own ask.
const choose = async ($: EngineInterface, setup: Setup): Promise<string> => {
  let prepared: Prepared
  try {
    prepared = prepare(setup)
  } catch (error) {
    const said = error instanceof Error ? error.message : String(error)
    await update($, notice, () => said)
    return said
  }
  await $.store.set(SETUP_KEY, setup)
  await update($, setupState, () => setup)
  const said = await send($, prepared)
  await update($, notice, () => said)
  return said
}

const turnOff = async ($: EngineInterface): Promise<string> => {
  await $.store.delete(SETUP_KEY)
  await update($, setupState, () => ({}))
  await $.theme.clear()
  await update($, notice, () => OFF)
  return OFF
}

// A setup from a link or JSON replaces the whole setup; preset ids replace
// only the modes they name
const chooseText = async (
  $: EngineInterface,
  text: string,
): Promise<string> => {
  const parsed = parseSetup(text)
  if (!parsed.ok) {
    await update($, notice, () => parsed.error)
    return parsed.error
  }
  const setup = isPresetList(text)
    ? { ...(await storedSetup($)), ...parsed.value }
    : parsed.value
  return choose($, setup)
}

const presetList = (): string =>
  (['light', 'dark'] as const)
    .map(
      (mode) =>
        `${mode === 'light' ? 'Light' : 'Dark'}: ${PRESETS.filter(
          (p) => p.mode === mode,
        )
          .map((p) => p.id)
          .join(', ')}`,
    )
    .join('\n')

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'tuner',
      description:
        'Theme Claude: open the Theme Tuner, or apply a tuner link or presets (/tuner solarized-light dracula), /tuner off',
      argumentHint: '[link | presets | list | off]',
    })
    await $.tool.register({
      name: 'set_theme',
      description: TOOL_DESCRIPTION,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { light: MODE_SCHEMA, dark: MODE_SCHEMA },
      },
    })
    const setup = await storedSetup($)
    await update($, setupState, () => setup)
    // Only a look is sent here: clearing at a start would wipe another
    // mod's theme in every session
    try {
      const prepared = prepare(setup)
      if (prepared.look !== null) await send($, prepared)
    } catch (error) {
      $.ui.status(
        `Theme Tuner: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
    return next(e)
  })

  on('command.run', { command: 'tuner' }, async ($, e) => {
    const args = e.args.trim()
    if (args === '') {
      await $.ui.open({ id: PANE, title: 'Theme Tuner' })
      return { text: 'Theme Tuner opened.' }
    }
    if (args === 'list') return { text: presetList() }
    if (args === 'off' || args === 'reset') return { text: await turnOff($) }
    return { text: await chooseText($, args) }
  })

  // The tool's input fields arrive on the event itself, beside `tool`
  on('tool.call', { tool: 'mcp__theme-tuner__set_theme' }, async ($, e) => {
    const { light, dark } = e as { light?: unknown; dark?: unknown }
    const checked = checkSetup({ light, dark })
    if (!checked.ok) return { result: checked.error }
    const said = await choose($, checked.value)
    return {
      result: `${said} The person can fine-tune it in the web tuner: ${tunerLink(WEB, checked.value)}`,
    }
  }).catch(() => ({
    result: 'The Theme Tuner could not set the theme. Try `/tuner` instead.',
  }))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Input, Link, Select, Text } = $.ui.resolve(e)
    const setup = await read($, setupState)
    const mode = await read($, editing)
    const said = await read($, notice)
    const choice = setup[mode]
    const resolved = choice ? resolveMode(mode, choice) : undefined
    const palette = resolved?.ok ? resolved.value.palette : undefined

    // The handlers start from the stored setup, not the one drawn: two quick
    // edits, or an edit in another session, are not lost

    // A preset picked for a mode starts from its own colors
    const pick = async (m: Mode, id: string) => {
      if (id === CUSTOM) return
      const next = { ...(await storedSetup($)) }
      if (id === '') delete next[m]
      else next[m] = { preset: id }
      await choose($, next)
    }

    // A color typed for the mode being edited overrides its preset's
    const setColor = async (key: PaletteKey, value: string) => {
      const hex = value.trim().toLowerCase()
      if (!HEX.test(hex)) {
        await update($, notice, () => `"${value}" is not a #rrggbb color.`)
        return
      }
      const latest = await storedSetup($)
      const current = latest[mode] ?? {
        preset: mode === 'light' ? 'claude-light' : 'claude-dark',
      }
      await choose($, {
        ...latest,
        [mode]: { ...current, colors: { ...current.colors, [key]: hex } },
      })
    }

    const resetColors = async () => {
      const latest = await storedSetup($)
      const preset = latest[mode]?.preset
      if (preset) await choose($, { ...latest, [mode]: { preset } })
    }

    // A mode's picker: Claude's own colors, its presets, and the look
    // applied now where no preset names it
    const isCustom = (m: Mode) => {
      const c = setup[m]
      return (
        c !== undefined &&
        (!c.preset || (c.preset === `claude-${m}` && c.colors !== undefined))
      )
    }
    const presetOptions = (m: Mode) => [
      { value: '', label: "Claude's own colors" },
      ...(isCustom(m)
        ? [
            {
              value: CUSTOM,
              label: `Custom: ${setup[m]?.name ?? 'your colors'}`,
            },
          ]
        : []),
      ...PRESETS.filter((p) => p.mode === m && p.id !== `claude-${m}`).map(
        (p) => ({ value: p.id, label: p.name }),
      ),
    ]
    const valueOf = (m: Mode) => {
      if (isCustom(m)) return CUSTOM
      const id = setup[m]?.preset
      return id && presetById(id) && id !== `claude-${m}` ? id : ''
    }

    return (
      <Box flexDirection='column' gap={1}>
        <Select
          key='light'
          label='Light'
          options={presetOptions('light')}
          value={valueOf('light')}
          onSelect={(v) => void pick('light', v)}
        />
        <Select
          key='dark'
          label='Dark'
          options={presetOptions('dark')}
          value={valueOf('dark')}
          onSelect={(v) => void pick('dark', v)}
        />
        <Select
          key='editing'
          label='Colors of'
          options={[
            { value: 'light', label: 'Light mode' },
            { value: 'dark', label: 'Dark mode' },
          ]}
          value={mode}
          onSelect={(v) => void update($, editing, () => v as Mode)}
        />
        {palette ? (
          <Box flexDirection='column'>
            {FIELDS.map(({ key, label }) => (
              <Input
                key={`${mode}-${key}`}
                label={label}
                value={palette[key]}
                placeholder='#rrggbb'
                submitLabel='set'
                onSubmit={(v) => void setColor(key, v)}
              />
            ))}
          </Box>
        ) : (
          <Text dimColor>
            {mode === 'light' ? 'Light' : 'Dark'} mode keeps Claude's own
            colors: pick a preset to tune it.
          </Text>
        )}
        <Input
          key='paste'
          label='Apply'
          placeholder='A tuner link, or presets: solarized-light dracula'
          submitLabel='apply'
          onSubmit={(v) => void chooseText($, v)}
        />
        <Box gap={1}>
          {choice?.preset && choice.colors ? (
            <Button
              key='reset'
              label='Reset colors'
              onPress={() => void resetColors()}
            />
          ) : null}
          <Button key='off' label='Turn off' onPress={() => void turnOff($)} />
        </Box>
        <Link
          href={tunerLink(WEB, setup)}
          label='Fine-tune every color in the web tuner'
        />
        {said ? <Text dimColor>{said}</Text> : null}
      </Box>
    )
  })
}
