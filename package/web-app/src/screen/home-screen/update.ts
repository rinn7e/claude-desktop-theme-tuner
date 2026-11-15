/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { Cmd, Task } from 'tea-cup-fp'

import {
  type Mode,
  type ModeChoice,
  type Setup,
  checkSetup,
  isPresetList,
  parseSetup,
} from '../../../../claude-mod/hooks/look'
import { writeClipboard } from '../../common/clipboard'
import {
  type CopyTarget,
  type KnobGroup,
  type Model,
  type Msg,
  type Parked,
} from './type'

// The setup is kept in localStorage, so edits survive a reload
const STORAGE_KEY = 'claude-theme-tuner:home:v1'
// How long a copy button says "Copied"
const COPIED_MS = 1600

// What a first visit shows: a theme for each mode, to start from
export const DEFAULT_SETUP: Setup = {
  light: { preset: 'solarized-light' },
  dark: { preset: 'dracula' },
}

// The stored setup, or the default when there is none or it no longer
// passes the mod's checks
export const decodeSetup = (raw: string | null): Setup => {
  if (raw === null) return DEFAULT_SETUP
  try {
    const checked = checkSetup(JSON.parse(raw))
    return checked.ok ? checked.value : DEFAULT_SETUP
  } catch {
    return DEFAULT_SETUP
  }
}

const loadSetup = (): Setup => {
  try {
    return decodeSetup(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_SETUP
  }
}

const saveCmd = (setup: Setup): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(setup))
      } catch {
        // A private window may refuse storage; the page works without it
      }
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

// What the copy buttons hand over: the JSON for the Theme JSON box of the
// mod (or for Claude to pass to its set_theme tool), and the same setup as a
// command to run in a session
export const themeJson = (setup: Setup): string =>
  JSON.stringify(setup, null, 2)

export const tunerCommand = (setup: Setup): string =>
  `/tuner ${JSON.stringify(setup)}`

const textFor = (setup: Setup, target: CopyTarget): string =>
  target === 'json' ? themeJson(setup) : tunerCommand(setup)

const copyCmd = (text: string, target: CopyTarget): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => writeClipboard(text)),
    (result): Msg =>
      result.tag === 'Ok'
        ? { _tag: 'Copied', target }
        : { _tag: 'CopyFailed', target },
  )

const clearCopiedCmd = (target: CopyTarget): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(
      () => new Promise<void>((resolve) => setTimeout(resolve, COPIED_MS)),
    ),
    (): Msg => ({ _tag: 'ClearCopied', target }),
  )

// A setup in the page's link (#theme=..., as the mod pane links here), or
// null when the link has none the mod accepts
export const setupOfHash = (hash: string): Setup | null => {
  if (!/(?:^#|&)theme=/.test(hash)) return null
  const read = parseSetup(hash)
  return read.ok ? read.value : null
}

const linkedSetup = (): Setup | null => {
  try {
    return setupOfHash(window.location.hash)
  } catch {
    return null
  }
}

// The link has done its work once the setup is stored: drop it, so a reload
// shows the edits made since
const dropHashCmd = (): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      const { pathname, search } = window.location
      window.history.replaceState(window.history.state, '', pathname + search)
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

export const init = (): [Model, Cmd<Msg>] => {
  const linked = linkedSetup()
  return [
    {
      isBannerShown: true,
      setup: linked ?? loadSetup(),
      parked: {},
      jsonDraft: null,
      jsonError: null,
      copied: null,
      copyFailed: null,
    },
    linked ? Cmd.batch([saveCmd(linked), dropHashCmd()]) : Cmd.none(),
  ]
}

// ---------- editing the setup, pure and tested in test/home.test.ts ----------

// A copy of the choice without the keys whose value is empty: an empty
// record, an empty name
const tidy = (choice: ModeChoice): ModeChoice =>
  Object.fromEntries(
    Object.entries(choice).filter(([, v]) =>
      typeof v === 'object' && v !== null
        ? Object.keys(v).length > 0
        : v !== undefined && v !== '',
    ),
  ) as ModeChoice

export const editMode = (
  setup: Setup,
  mode: Mode,
  edit: (choice: ModeChoice) => ModeChoice,
): Setup => {
  const choice = setup[mode]
  return choice ? { ...setup, [mode]: tidy(edit(choice)) } : setup
}

export const setKnob = (
  choice: ModeChoice,
  { group, key }: KnobGroup,
  value: string | null,
): ModeChoice => {
  const record: Record<string, string> = { ...choice[group] }
  if (value === null) delete record[key]
  else record[key] = value.toLowerCase()
  return { ...choice, [group]: record }
}

// Leaving a mode out parks its choice, and taking it back brings the choice
// back, edits and all, as the first tuner keeps a slot's colors
export const setModeOn = (
  setup: Setup,
  parked: Parked,
  mode: Mode,
  isOn: boolean,
): { setup: Setup; parked: Parked } => {
  if (isOn) {
    if (setup[mode]) return { setup, parked }
    const rest = { ...parked }
    delete rest[mode]
    return {
      setup: { ...setup, [mode]: parked[mode] ?? DEFAULT_SETUP[mode] ?? {} },
      parked: rest,
    }
  }
  const choice = setup[mode]
  if (!choice) return { setup, parked }
  const next = { ...setup }
  delete next[mode]
  return { setup: next, parked: { ...parked, [mode]: choice } }
}

// A preset starts the mode afresh: its colors, its code theme, and none of
// the knobs set over the last one
export const pickPreset = (setup: Setup, mode: Mode, id: string): Setup => ({
  ...setup,
  [mode]: { preset: id },
})

// What a mode sets over its preset; the name stays, as on the first tuner
const OVER_PRESET = ['colors', 'anchors', 'roles', 'git', 'codeTheme'] as const

export const canResetMode = (setup: Setup, mode: Mode): boolean => {
  const choice = setup[mode]
  return (
    choice?.preset !== undefined &&
    OVER_PRESET.some((key) => choice[key] !== undefined)
  )
}

export const resetMode = (setup: Setup, mode: Mode): Setup =>
  editMode(setup, mode, (c) => ({ preset: c.preset, name: c.name }))

// Preset ids name only the modes they change, as with `/tuner <ids>`;
// JSON or a link replaces the whole setup
export const readJson = (
  setup: Setup,
  text: string,
): { setup: Setup; error: string | null } => {
  const parsed = parseSetup(text)
  if (!parsed.ok) return { setup, error: parsed.error }
  return {
    setup: isPresetList(text) ? { ...setup, ...parsed.value } : parsed.value,
    error: null,
  }
}

// ---------- update ----------

const withSetup = (model: Model, setup: Setup): [Model, Cmd<Msg>] => [
  { ...model, setup },
  saveCmd(setup),
]

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  const { setup } = model
  switch (msg._tag) {
    case 'DismissBanner':
      return [{ ...model, isBannerShown: false }, Cmd.none()]
    case 'SetModeOn': {
      const next = setModeOn(setup, model.parked, msg.mode, msg.isOn)
      return withSetup({ ...model, parked: next.parked }, next.setup)
    }
    case 'PickPreset': {
      // A preset starts afresh, so a parked choice of the mode goes
      const parked = { ...model.parked }
      delete parked[msg.mode]
      return withSetup(
        { ...model, parked },
        pickPreset(setup, msg.mode, msg.id),
      )
    }
    case 'SetKnob':
      return withSetup(
        model,
        editMode(setup, msg.mode, (c) => setKnob(c, msg.knob, msg.value)),
      )
    case 'SetCodeTheme':
      return withSetup(
        model,
        editMode(setup, msg.mode, (c) => ({
          ...c,
          codeTheme: msg.value ?? undefined,
        })),
      )
    case 'ResetMode':
      return withSetup(model, resetMode(setup, msg.mode))
    case 'SetContrast': {
      const next = { ...setup }
      if (msg.isMore) next.contrast = 'more'
      else delete next.contrast
      return withSetup(model, next)
    }
    case 'SetBackdrop': {
      const next = { ...setup }
      if (msg.backdrop) next.backdrop = msg.backdrop
      else delete next.backdrop
      return withSetup(model, next)
    }
    case 'EditJson': {
      const read = readJson(setup, msg.text)
      const edited = { ...model, jsonDraft: msg.text, jsonError: read.error }
      return read.error === null
        ? withSetup(edited, read.setup)
        : [edited, Cmd.none()]
    }
    // Text that is not a setup stays, with its error, to be fixed
    case 'LeaveJson':
      return model.jsonError === null
        ? [{ ...model, jsonDraft: null }, Cmd.none()]
        : [model, Cmd.none()]
    case 'Copy':
      return [model, copyCmd(textFor(setup, msg.target), msg.target)]
    case 'Copied':
      return [
        { ...model, copied: msg.target, copyFailed: null },
        clearCopiedCmd(msg.target),
      ]
    case 'CopyFailed':
      return [{ ...model, copyFailed: msg.target }, Cmd.none()]
    case 'ClearCopied':
      return [
        model.copied === msg.target ? { ...model, copied: null } : model,
        Cmd.none(),
      ]
    case 'NoOp':
      return [model, Cmd.none()]
  }
}
