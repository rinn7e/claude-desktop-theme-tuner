/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import {
  ANCHOR_KEYS,
  GIT_KEYS,
  type LookDefinition,
  type Mode,
  PALETTE_KEYS,
  ROLE_KEYS,
  type Setup,
  checkSetup,
  fitLook,
  isPresetList,
  knobsOf,
  lookDefinition,
  lookOptionsOf,
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
// sent as Claude's look at every session start. /theme-tuner opens the
// pane, /theme-tuner <setup, link or preset ids> applies one, and the model
// can set one with the set_theme tool. /tuner is a short alias: command
// names have no namespace, so if another plugin takes /tuner, /theme-tuner
// still works.

// The commands (theme-tuner, tuner) and the tool (set_theme) are written as
// literals where they are registered and matched, so `claude plugin
// validate` reads them
const PANE = 'rinn7e-theme-tuner'
// The store key of the setup, the same in every session
const SETUP_KEY = 'setup'
const WEB = 'https://rinn7e.com/claude-desktop-theme-tuner/'
const OFF = "Theme off: Claude's own colors."
// The pickers' entry for a look no preset names (a theme from a file, or
// Claude's own colors tuned)
const CUSTOM = 'custom'

const setupState = atom(
  { plugin: 'rinn7e-theme-tuner', key: 'setup' } as const,
  {},
  {
    shape: 'setup-1',
  },
)
const notice = atom(
  { plugin: 'rinn7e-theme-tuner', key: 'notice' } as const,
  null as string | null,
)

const TOOL_DESCRIPTION = `Sets the theme of the Claude desktop app (Claude Code sessions, light and dark mode) and keeps it for later sessions. Give a preset per mode, and optionally colors that override it.

Light presets: ${PRESETS.filter((p) => p.mode === 'light')
  .map((p) => p.id)
  .join(', ')}.
Dark presets: ${PRESETS.filter((p) => p.mode === 'dark')
  .map((p) => p.id)
  .join(', ')}.
claude-light and claude-dark are Claude's own colors. A mode left out keeps Claude's own colors.

Colors are #rrggbb by palette role: frame (sidebar), canvas (chat area), text, textSecondary (labels, Claude's thinking), textMuted (hints), accent (links, buttons). Keep text at 7:1 on frame and canvas, textSecondary dimmer than text, and the accent readable as link text (4.5:1 on canvas): darken a bright accent. Without a preset all 13 roles are needed (also raised, pressed, line, accentHover, onAccent, selected, wash). A mode can also set the knobs of Claude directly: anchors (surface-0 to surface-3, text-primary, text-secondary, text-muted), roles (accent, danger, success, warning, pro) and git colors, and the setup contrast "more" and a backdrop. The same JSON as the Claude Desktop Theme Tuner writes (${WEB}llms.txt).`

// A misspelled key is refused, not dropped
// A record of #rrggbb colors under the given keys
const hexKnobs = (keys: readonly string[], description: string) => ({
  type: 'object',
  description,
  propertyNames: { enum: [...keys] },
  additionalProperties: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
})

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
    anchors: hexKnobs(
      ANCHOR_KEYS,
      'Knobs of Claude set directly: surfaces (0 page and sidebar, 1 cards, 2 panels, 3 menus) and texts.',
    ),
    roles: hexKnobs(
      ROLE_KEYS,
      'Role colors: accent (links, buttons), danger, success, warning, pro; they also color code.',
    ),
    git: hexKnobs(GIT_KEYS, 'Git colors for diffs and pull request states.'),
    codeTheme: {
      type: ['string', 'null'],
      description:
        "A code theme id of Claude, such as solarized-light; null sends none, so Claude's own picker stays free.",
    },
  },
}

const BACKDROP_SCHEMA = {
  description:
    'What is behind the conversation: { color } or { gradient: { stops, angle, shape } }.',
  type: 'object',
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
  const def = lookDefinition(resolveSetup(setup), lookOptionsOf(setup))
  const backdrop: Pick<ThemeSetArgs, 'backdrop'> = setup.backdrop
    ? { backdrop: setup.backdrop as ThemeSetArgs['backdrop'] }
    : {}
  if (!def.light && !def.dark)
    return setup.backdrop
      ? { look: backdrop, label: 'Backdrop', adjusted: [] }
      : { look: null, label: '', adjusted: [] }
  const { theme, adjusted } = fitLook(def, makeColors)
  return { look: { colors: theme, ...backdrop }, label: def.label, adjusted }
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

// What /theme-tuner (or its alias /tuner) does with its arguments: none opens
// the pane
const runCommand = async ($: EngineInterface, raw: string): Promise<string> => {
  const args = raw.trim()
  if (args === '') {
    await $.ui.open({ id: PANE, title: 'Theme Tuner' })
    return 'Theme Tuner opened.'
  }
  if (args === 'list') return presetList()
  if (args === 'off' || args === 'reset') return turnOff($)
  return chooseText($, args)
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
      name: 'theme-tuner',
      description:
        'Theme Claude: open the Theme Tuner, or apply a setup, link or presets (/theme-tuner solarized-light dracula), /theme-tuner off',
      argumentHint: '[setup | link | presets | list | off]',
    })
    await $.command.register({
      name: 'tuner',
      description: 'Short for /theme-tuner',
      argumentHint: '[setup | link | presets | list | off]',
    })
    await $.tool.register({
      name: 'set_theme',
      description: TOOL_DESCRIPTION,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          light: MODE_SCHEMA,
          dark: MODE_SCHEMA,
          contrast: {
            enum: ['more'],
            description: 'Stronger borders and focus rings.',
          },
          compensateGlass: {
            type: 'boolean',
            description:
              'On by default: the light sidebar is aimed at the frame color as it shows through the translucent macOS sidebar glass. false sends the frame as it is (for Reduce transparency).',
          },
          backdrop: BACKDROP_SCHEMA,
        },
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

  on('command.run', { command: 'theme-tuner' }, async ($, e) => ({
    text: await runCommand($, e.args),
  }))
  on('command.run', { command: 'tuner' }, async ($, e) => ({
    text: await runCommand($, e.args),
  }))

  // The tool's input fields arrive on the event itself, beside `tool`
  on(
    'tool.call',
    { tool: 'mcp__rinn7e-theme-tuner__set_theme' },
    async ($, e) => {
      const { light, dark, contrast, backdrop, compensateGlass } = e as Record<
        string,
        unknown
      >
      const checked = checkSetup({
        light,
        dark,
        contrast,
        backdrop,
        compensateGlass,
      })
      if (!checked.ok) return { result: checked.error }
      const said = await choose($, checked.value)
      return {
        result: `${said} The person can fine-tune it in the web tuner: ${tunerLink(WEB, checked.value)}`,
      }
    },
  ).catch(() => ({
    result:
      'The Theme Tuner could not set the theme. Try `/theme-tuner` instead.',
  }))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Input, Link, Select, Text } = $.ui.resolve(e)
    const setup = await read($, setupState)
    const said = await read($, notice)

    // A preset picked for a mode starts from its own colors. It starts from
    // the stored setup, not the one drawn, so an edit in another session is
    // not lost
    const pick = async (m: Mode, id: string) => {
      if (id === CUSTOM) return
      const next = { ...(await storedSetup($)) }
      if (id === '') delete next[m]
      else next[m] = { preset: id }
      await choose($, next)
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

    // What the mod sends Claude now, after the fit, shown knob by knob
    let sentLook: LookDefinition | null = null
    try {
      const def = lookDefinition(resolveSetup(setup), lookOptionsOf(setup))
      if (def.light || def.dark) sentLook = fitLook(def, makeColors).definition
    } catch {
      sentLook = null
    }

    // A mode's picker over the knobs it sends: a row per knob with its
    // swatch, its name in Claude, the value sent and the palette color it
    // comes from
    const modeView = (m: Mode) => {
      const choice = setup[m]
      const resolved = choice ? resolveMode(m, choice) : undefined
      const sent = sentLook
      return (
        <Box key={`${m}-mode`} flexDirection='column' gap={1}>
          <Select
            key={m}
            label={m === 'light' ? 'Light' : 'Dark'}
            options={presetOptions(m)}
            value={valueOf(m)}
            onSelect={(v) => void pick(m, v)}
          />
          {resolved?.ok && sent?.[m] ? (
            <Box flexDirection='column'>
              {knobsOf(m, resolved.value, sent).map(({ knob, value, from }) => (
                <Box key={`${m}-${knob}`} gap={1}>
                  <Text
                    backgroundColor={value.startsWith('#') ? value : undefined}
                  >
                    {'    '}
                  </Text>
                  <Box width={15}>
                    <Text mono>{knob}</Text>
                  </Box>
                  <Box width={9}>
                    <Text mono>{value}</Text>
                  </Box>
                  <Text dimColor>{from}</Text>
                </Box>
              ))}
            </Box>
          ) : (
            <Text dimColor>Claude's own colors</Text>
          )}
        </Box>
      )
    }

    return (
      <Box flexDirection='column' gap={1}>
        <Box flexWrap='wrap' columnGap={6} rowGap={1}>
          {modeView('light')}
          {modeView('dark')}
        </Box>
        <Text dimColor>
          These are the knobs sent to Claude. It derives the rest (menus,
          borders, hover, selection) from them, and draws the sidebar
          translucent over the macOS glass.
        </Text>
        {/* The whole setup as JSON, the format of a web tuner link: edit or
            paste it and press Enter. A link or preset ids work here too */}
        <Input
          key='json'
          label='Theme JSON'
          value={JSON.stringify(setup, null, 2)}
          rows={10}
          placeholder='{ "light": { "preset": "solarized-light", "colors": { "accent": "#c0009f" } } }'
          submitLabel='apply'
          onSubmit={(v) => void chooseText($, v)}
        />
        <Text dimColor>
          Paste JSON copied from the web tuner, a tuner link, or preset ids, and
          press Enter. Colors are #rrggbb by role: frame, canvas, text,
          textSecondary, textMuted, accent.
        </Text>
        <Box gap={1}>
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
