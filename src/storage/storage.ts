/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { isRight } from 'fp-ts/Either'
import * as t from 'io-ts'

import { isHex } from '../theme/color'
import { type Palette } from '../theme/palette'
import { type Slot } from '../type'

// The two slots are kept in localStorage, so edits survive a reload
const STORAGE_KEY = 'claude-theme-tuner:v1'

interface HexBrand {
  readonly Hex: unique symbol
}
const Hex = t.brand(
  t.string,
  (s): s is t.Branded<string, HexBrand> => isHex(s),
  'Hex',
)

const PaletteCodec = t.type({
  frame: Hex,
  canvas: Hex,
  raised: Hex,
  pressed: Hex,
  text: Hex,
  textSecondary: Hex,
  textMuted: Hex,
  line: Hex,
  accent: Hex,
  accentHover: Hex,
  onAccent: Hex,
  selected: Hex,
  wash: Hex,
})

const CreditCodec = t.type({ name: t.string, url: t.string, license: t.string })

const ThemeCodec = t.intersection([
  t.type({
    id: t.string,
    name: t.string,
    mode: t.union([t.literal('light'), t.literal('dark')]),
    palette: PaletteCodec,
  }),
  t.partial({ credit: CreditCodec }),
])

const SlotCodec = t.type({ enabled: t.boolean, theme: ThemeCodec })

// The options came later, so older stored data without them still decodes
export const StoredCodec = t.intersection([
  t.type({ light: SlotCodec, dark: SlotCodec }),
  t.partial({ reduceMotion: t.boolean, swapped: t.boolean }),
])

export interface Stored {
  light: Slot
  dark: Slot
  reduceMotion: boolean
  swapped: boolean
}

// Decodes stored data, falling back when it is missing or no longer valid
export const decodeStored = (raw: unknown, fallback: Stored): Stored => {
  const result = StoredCodec.decode(raw)
  if (!isRight(result)) return fallback
  const { light, dark, reduceMotion = false, swapped = false } = result.right
  const plain = (slot: typeof light): Slot => ({
    enabled: slot.enabled,
    theme: { ...slot.theme, palette: { ...slot.theme.palette } as Palette },
  })
  return { light: plain(light), dark: plain(dark), reduceMotion, swapped }
}

// localStorage can be missing or throw (private windows, blocked storage);
// the app then simply starts from the defaults each time
export const loadStored = (fallback: Stored): Stored => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? decodeStored(JSON.parse(raw), fallback) : fallback
  } catch {
    return fallback
  }
}

export const saveStored = (stored: Stored): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Not persisted; the theme still works for this visit
  }
}
