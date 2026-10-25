/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { isRight } from 'fp-ts/Either'
import * as t from 'io-ts'

import { type Mode, type Palette, type Theme } from '../theme/palette'
import { TESTED_CLAUDE_VERSION } from '../theme/presets'
import { type Slot } from '../type'
import { SlotCodec } from './storage'

// A saved setup, as a JSON file: both modes and the reduce-motion option.
// `format` and `version` tell a tuner file apart from any other JSON and let
// the format change later; `savedWith` records the Claude version it was
// tuned against.
const FORMAT = 'claude-desktop-theme-tuner'
const VERSION = 1

const PresetFileCodec = t.type({
  format: t.literal(FORMAT),
  version: t.literal(VERSION),
  light: SlotCodec,
  dark: SlotCodec,
  reduceMotion: t.boolean,
})

export interface PresetFile {
  light: Slot
  dark: Slot
  reduceMotion: boolean
}

export type PresetFileResult =
  { ok: true; preset: PresetFile } | { ok: false; error: string }

export const encodePresetFile = (preset: PresetFile): string =>
  JSON.stringify(
    {
      format: FORMAT,
      version: VERSION,
      savedWith: TESTED_CLAUDE_VERSION,
      light: preset.light,
      dark: preset.dark,
      reduceMotion: preset.reduceMotion,
    },
    null,
    2,
  ) + '\n'

const slug = (slot: Slot): string =>
  slot.enabled
    ? slot.theme.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'custom'
    : 'stock'

// e.g. claude-theme-solarized-light-solarized-dark.json
export const presetFileName = (preset: PresetFile): string =>
  `claude-theme-${slug(preset.light)}-${slug(preset.dark)}.json`

// A name from a file goes into the snippet's CSS comments, so it must not be
// able to close one ("*/") and inject CSS; control characters and length are
// trimmed too
export const safeName = (name: string): string =>
  name
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\*\/|\/\*/g, '')
    .trim()
    .slice(0, 60) || 'Custom'

// A credit link from a file is shown in the app, so only https links stay
const safeCredit = (credit: Theme['credit']): Theme['credit'] =>
  credit && /^https:\/\//.test(credit.url)
    ? {
        name: safeName(credit.name),
        url: credit.url,
        license: safeName(credit.license),
      }
    : undefined

const slotOf = (slot: t.TypeOf<typeof SlotCodec>): Slot => {
  const credit = safeCredit(slot.theme.credit)
  return {
    enabled: slot.enabled,
    theme: {
      id: slot.theme.id,
      name: safeName(slot.theme.name),
      mode: slot.theme.mode,
      palette: { ...slot.theme.palette } as Palette,
      ...(credit ? { credit } : {}),
    },
  }
}

// The first color key that failed to decode, for a precise error
const badColor = (errors: t.Errors): { mode: string; key: string } | null => {
  for (const error of errors) {
    const keys = error.context.map((c) => c.key)
    const at = keys.indexOf('palette')
    if (at !== -1 && keys[at + 1]) {
      const mode = keys.find((k) => k === 'light' || k === 'dark') ?? 'a'
      return { mode, key: keys[at + 1] }
    }
  }
  return null
}

export const decodePresetFile = (text: string): PresetFileResult => {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: "That file isn't JSON." }
  }
  const result = PresetFileCodec.decode(raw)
  if (!isRight(result)) {
    const color = badColor(result.left)
    return {
      ok: false,
      error: color
        ? `The ${color.mode} theme has an invalid color (${color.key}).`
        : "That's not a Claude Desktop Theme Tuner preset file.",
    }
  }
  const { light, dark, reduceMotion } = result.right
  for (const [mode, slot] of [
    ['light', light],
    ['dark', dark],
  ] as [Mode, typeof light][]) {
    if (slot.theme.mode !== mode)
      return {
        ok: false,
        error: `The ${mode} slot holds a ${slot.theme.mode} theme.`,
      }
  }
  return {
    ok: true,
    preset: { light: slotOf(light), dark: slotOf(dark), reduceMotion },
  }
}
