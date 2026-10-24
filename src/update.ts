/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { Cmd, Task } from 'tea-cup-fp'

import diagnoseSnippet from '../snippets/diagnose.snippet.js?raw'
import { type Stored, loadStored, saveStored } from './storage/storage'
import { isHex } from './theme/color'
import { themeCss } from './theme/css'
import { type Mode, type PaletteKey, type Theme } from './theme/palette'
import { PRESETS, presetById } from './theme/presets'
import { REVERT_COMMAND, themeSnippet } from './theme/snippet'
import { type CopyTarget, type Model, type Msg, type Slot } from './type'

// How long a copy button says "Copied"
const COPIED_MS = 1600

const copyOf = (theme: Theme): Theme => ({
  ...theme,
  palette: { ...theme.palette },
})

const firstPreset = (mode: Mode): Theme => {
  const preset = PRESETS.find((t) => t.mode === mode)
  if (!preset) throw new Error(`no ${mode} preset`)
  return preset
}

// Solarized Light themed, dark mode left stock until a dark theme is picked
export const defaultStored: Stored = {
  light: { enabled: true, theme: copyOf(firstPreset('light')) },
  dark: { enabled: false, theme: copyOf(firstPreset('dark')) },
  reduceMotion: false,
}

const storedOf = (model: Model): Stored => ({
  light: model.light,
  dark: model.dark,
  reduceMotion: model.reduceMotion,
})

// Whether a slot's colors still match the preset it came from
export const isEdited = (slot: Slot): boolean => {
  const preset = presetById(slot.theme.id)
  if (!preset) return true
  return Object.entries(preset.palette).some(
    ([k, v]) =>
      slot.theme.palette[k as PaletteKey].toLowerCase() !== v.toLowerCase(),
  )
}

// The snippet for the current model: the enabled slots, the rest stock
export const snippetOf = (model: Model): string =>
  themeSnippet(
    themeCss({
      light: model.light.enabled ? model.light.theme : null,
      dark: model.dark.enabled ? model.dark.theme : null,
    }),
    { reduceMotion: model.reduceMotion },
  )

export const textFor = (model: Model, target: CopyTarget): string =>
  target === 'theme'
    ? snippetOf(model)
    : target === 'diagnose'
      ? diagnoseSnippet
      : REVERT_COMMAND

export const init = (): [Model, Cmd<Msg>] => {
  const stored = loadStored(defaultStored)
  return [
    {
      ...stored,
      shown: 'theme',
      copied: null,
      copyFailed: null,
      helpOpen: false,
    },
    Cmd.none(),
  ]
}

const saveCmd = (model: Model): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      saveStored(storedOf(model))
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

// The older way to copy, for when the Clipboard API is refused (an unfocused
// or insecure page)
const legacyCopy = (text: string): boolean => {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}

const writeClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    if (!legacyCopy(text)) throw new Error('copy refused')
  }
}

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

// Sub-updaters, pure and tested in test/update.test.ts

const withSlot = (model: Model, mode: Mode, slot: Slot): Model => ({
  ...model,
  [mode]: slot,
})

export const handleToggleSlot = (model: Model, mode: Mode): Model =>
  withSlot(model, mode, { ...model[mode], enabled: !model[mode].enabled })

export const handleToggleReduceMotion = (model: Model): Model => ({
  ...model,
  reduceMotion: !model.reduceMotion,
})

// A preset goes to the slot of its own mode, and turns it on: choosing a
// theme means wanting it
export const handlePickPreset = (model: Model, id: string): Model => {
  const preset = presetById(id)
  if (!preset) return model
  return withSlot(model, preset.mode, {
    enabled: true,
    theme: copyOf(preset),
  })
}

export const handleSetColor = (
  model: Model,
  mode: Mode,
  key: PaletteKey,
  value: string,
): Model => {
  if (!isHex(value)) return model
  const slot = model[mode]
  return withSlot(model, mode, {
    ...slot,
    theme: {
      ...slot.theme,
      palette: { ...slot.theme.palette, [key]: value.toLowerCase() },
    },
  })
}

export const handleResetSlot = (model: Model, mode: Mode): Model => {
  const slot = model[mode]
  const preset = presetById(slot.theme.id)
  return preset
    ? withSlot(model, mode, { ...slot, theme: copyOf(preset) })
    : model
}

const saved = (model: Model): [Model, Cmd<Msg>] => [model, saveCmd(model)]

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'ToggleReduceMotion':
      return saved(handleToggleReduceMotion(model))
    case 'ToggleSlot':
      return saved(handleToggleSlot(model, msg.mode))
    case 'PickPreset':
      return saved(handlePickPreset(model, msg.id))
    case 'SetColor':
      return saved(handleSetColor(model, msg.mode, msg.key, msg.value))
    case 'ResetSlot':
      return saved(handleResetSlot(model, msg.mode))
    case 'Copy':
      return [model, copyCmd(textFor(model, msg.target), msg.target)]
    case 'Copied':
      return [
        { ...model, copied: msg.target, copyFailed: null },
        clearCopiedCmd(msg.target),
      ]
    case 'CopyFailed':
      return [{ ...model, copyFailed: msg.target }, Cmd.none()]
    case 'OpenHelp':
      return [{ ...model, helpOpen: true }, Cmd.none()]
    case 'CloseHelp':
      return [{ ...model, helpOpen: false }, Cmd.none()]
    case 'ShowCode':
      return [{ ...model, shown: msg.target, copyFailed: null }, Cmd.none()]
    case 'ClearCopied':
      // A later copy keeps its own confirmation
      return [
        model.copied === msg.target ? { ...model, copied: null } : model,
        Cmd.none(),
      ]
    case 'NoOp':
      return [model, Cmd.none()]
  }
}
