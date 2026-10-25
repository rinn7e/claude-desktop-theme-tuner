/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { Cmd, Task } from 'tea-cup-fp'

import {
  type PresetFile,
  decodePresetFile,
  encodePresetFile,
  presetFileName,
} from './storage/preset-file'
import {
  type LinkSetupResult,
  linkHash,
  parseLinkHash,
} from './storage/share-link'
import { type Stored, loadStored, saveStored } from './storage/storage'
import { isHex } from './theme/color'
import { themeCss } from './theme/css'
import { type Mode, type PaletteKey, type Theme } from './theme/palette'
import { presetById } from './theme/presets'
import { REVERT_COMMAND, themeSnippet } from './theme/snippet'
import { type CopyTarget, type Model, type Msg, type Slot } from './type'

// How long a copy button says "Copied"
const COPIED_MS = 1600

// How long the "Loaded" notice stays after loading a preset file
const LOADED_MS = 4000

const copyOf = (theme: Theme): Theme => ({
  ...theme,
  palette: { ...theme.palette },
})

const presetOrThrow = (id: string): Theme => {
  const preset = presetById(id)
  if (!preset) throw new Error(`no preset ${id}`)
  return preset
}

// Solarized Light themed, dark mode left stock until a dark theme is picked
export const defaultStored: Stored = {
  light: { enabled: true, theme: copyOf(presetOrThrow('solarized-light')) },
  dark: { enabled: false, theme: copyOf(presetOrThrow('solarized-dark')) },
  reduceMotion: false,
  swapped: false,
}

const storedOf = (model: Model): Stored => ({
  light: model.light,
  dark: model.dark,
  reduceMotion: model.reduceMotion,
  swapped: model.swapped,
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

// Whether Reset has a preset to go back to: an edited preset, not a custom
// theme from a preset file
export const canReset = (slot: Slot): boolean =>
  presetById(slot.theme.id) !== undefined && isEdited(slot)

// The snippet for the current model: the enabled slots, the rest stock
export const snippetOf = (model: Model): string =>
  themeSnippet(
    themeCss({
      light: model.light.enabled ? model.light.theme : null,
      dark: model.dark.enabled ? model.dark.theme : null,
    }),
    { reduceMotion: model.reduceMotion },
  )

// Whether the theme snippet would change anything: with both modes stock and
// motion untouched, it would only add an empty <style>
export const snippetDoesSomething = (model: Model): boolean =>
  model.light.enabled || model.dark.enabled || model.reduceMotion

export const textFor = (model: Model, target: CopyTarget): string =>
  target === 'theme' ? snippetOf(model) : REVERT_COMMAND

// The page's address without its hash, for share links
const pageUrl = (): string => window.location.href.replace(/#.*$/, '')

// Puts a setup from a link (#theme=...) in place of the stored one. In the
// full view it is saved and the hash cleared, so a reload keeps later edits;
// a preview-only page (#view=preview, for screenshots) changes nothing stored
const openHash = (model: Model, hash: string): [Model, Cmd<Msg>] => {
  const link = parseLinkHash(hash, presetOf(model))
  const viewed = { ...model, previewOnly: link.previewOnly }
  if (!link.setup) return [viewed, Cmd.none()]
  const next = handleLinkSetup(viewed, link.setup)
  if (link.previewOnly || next.presetNotice?.kind !== 'loaded')
    return [next, Cmd.none()]
  window.history.replaceState(null, '', pageUrl())
  return [
    next,
    Cmd.batch([saveCmd(next), clearNoticeCmd(next.presetNotice.text)]),
  ]
}

export const init = (): [Model, Cmd<Msg>] =>
  openHash(
    {
      ...loadStored(defaultStored),
      shown: 'theme',
      copied: null,
      copyFailed: null,
      helpOpen: false,
      menuOpen: false,
      presetNotice: null,
      previewOnly: false,
    },
    window.location.hash,
  )

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

export const handleToggleSwapped = (model: Model): Model => ({
  ...model,
  swapped: !model.swapped,
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

// The setup a preset file holds
export const presetOf = (model: Model): PresetFile => ({
  light: model.light,
  dark: model.dark,
  reduceMotion: model.reduceMotion,
})

// Puts a loaded preset file's setup in place of the current one
export const handleLoadPreset = (model: Model, preset: PresetFile): Model => ({
  ...model,
  light: preset.light,
  dark: preset.dark,
  reduceMotion: preset.reduceMotion,
})

// Offers the setup as a JSON file to download
const downloadCmd = (fileName: string, text: string): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      const url = URL.createObjectURL(
        new Blob([text], { type: 'application/json' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

const readFileCmd = (file: File): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => file.text()),
    (result): Msg =>
      result.tag === 'Ok'
        ? { _tag: 'PresetFileRead', fileName: file.name, text: result.value }
        : { _tag: 'PresetFileUnreadable', fileName: file.name },
  )

const clearNoticeCmd = (text: string): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(
      () => new Promise<void>((resolve) => setTimeout(resolve, LOADED_MS)),
    ),
    (): Msg => ({ _tag: 'ClearPresetNotice', text }),
  )

// Decodes a chosen preset file: its setup in place, or why it was refused
export const handlePresetFileRead = (
  model: Model,
  fileName: string,
  text: string,
): Model => {
  const result = decodePresetFile(text)
  return result.ok
    ? {
        ...handleLoadPreset(model, result.preset),
        presetNotice: { kind: 'loaded', text: `Loaded ${fileName}.` },
      }
    : {
        ...model,
        presetNotice: {
          kind: 'error',
          text: `Couldn't load ${fileName}: ${result.error}`,
        },
      }
}

// A setup from a link: in place, or why it was refused
export const handleLinkSetup = (model: Model, setup: LinkSetupResult): Model =>
  setup.ok
    ? {
        ...handleLoadPreset(model, setup.preset),
        presetNotice: {
          kind: 'loaded',
          text: 'Loaded the theme from the link.',
        },
      }
    : {
        ...model,
        presetNotice: {
          kind: 'error',
          text: `Couldn't load the link: ${setup.error}`,
        },
      }

// A link to the current setup
export const shareLinkOf = (model: Model, page: string): string =>
  page + linkHash(presetOf(model))

const copyLinkCmd = (model: Model): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => writeClipboard(shareLinkOf(model, pageUrl()))),
    (result): Msg =>
      result.tag === 'Ok' ? { _tag: 'LinkCopied' } : { _tag: 'LinkCopyFailed' },
  )

// When the browser refuses to copy, the link goes in the address bar instead
const showLinkCmd = (model: Model): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      window.history.replaceState(null, '', shareLinkOf(model, pageUrl()))
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

const saved = (model: Model): [Model, Cmd<Msg>] => [model, saveCmd(model)]

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'ToggleReduceMotion':
      return saved(handleToggleReduceMotion(model))
    case 'ToggleSwapped':
      // Picked from the settings menu, which closes with it
      return saved({ ...handleToggleSwapped(model), menuOpen: false })
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
    case 'ToggleMenu':
      return [{ ...model, menuOpen: !model.menuOpen }, Cmd.none()]
    case 'CloseMenu':
      return [{ ...model, menuOpen: false }, Cmd.none()]
    case 'SavePreset':
      return [
        { ...model, menuOpen: false },
        downloadCmd(
          presetFileName(presetOf(model)),
          encodePresetFile(presetOf(model)),
        ),
      ]
    case 'HashChanged':
      // A link pasted into a tab that already has the tuner open
      return openHash(model, msg.hash)
    case 'CopyLink':
      return [{ ...model, menuOpen: false }, copyLinkCmd(model)]
    case 'LinkCopied': {
      const text = 'Copied a link to this setup.'
      return [
        { ...model, presetNotice: { kind: 'loaded', text } },
        clearNoticeCmd(text),
      ]
    }
    case 'LinkCopyFailed':
      return [
        {
          ...model,
          presetNotice: {
            kind: 'error',
            text: "Couldn't copy the link: copy it from the address bar.",
          },
        },
        showLinkCmd(model),
      ]
    case 'LoadPresetFile':
      return [
        { ...model, menuOpen: false, presetNotice: null },
        readFileCmd(msg.file),
      ]
    case 'PresetFileRead': {
      const next = handlePresetFileRead(model, msg.fileName, msg.text)
      return next.presetNotice?.kind === 'loaded'
        ? [
            next,
            Cmd.batch([saveCmd(next), clearNoticeCmd(next.presetNotice.text)]),
          ]
        : [next, Cmd.none()]
    }
    case 'PresetFileUnreadable':
      return [
        {
          ...model,
          presetNotice: {
            kind: 'error',
            text: `Couldn't read ${msg.fileName}.`,
          },
        },
        Cmd.none(),
      ]
    case 'ClearPresetNotice':
      // Only the notice this timer was set for: a newer one stays
      return [
        model.presetNotice?.text === msg.text
          ? { ...model, presetNotice: null }
          : model,
        Cmd.none(),
      ]
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
