/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { type Mode, type PaletteKey, type Theme } from './theme/palette'

// One mode's theme: the preset it started from, edited in place
export interface Slot {
  enabled: boolean
  theme: Theme
}

export type CopyTarget = 'theme' | 'revert'

export interface Model {
  light: Slot
  dark: Slot
  // Whether the snippet also turns off the app's looping animations
  reduceMotion: boolean
  // The previews on the left and the customizer on the right, on wide screens
  swapped: boolean
  // The code shown in the snippet panel, and copied by its button
  shown: CopyTarget
  // What was just copied, for the button's confirmation
  copied: CopyTarget | null
  // What the browser refused to copy: the panel asks to copy it by hand
  copyFailed: CopyTarget | null
  // The "How to apply" dialog
  helpOpen: boolean
  // The settings menu under the gear button
  menuOpen: boolean
}

export type Msg =
  | { _tag: 'ToggleSlot'; mode: Mode }
  | { _tag: 'ToggleReduceMotion' }
  | { _tag: 'ToggleSwapped' }
  | { _tag: 'PickPreset'; id: string }
  | { _tag: 'SetColor'; mode: Mode; key: PaletteKey; value: string }
  | { _tag: 'ResetSlot'; mode: Mode }
  | { _tag: 'Copy'; target: CopyTarget }
  | { _tag: 'Copied'; target: CopyTarget }
  | { _tag: 'CopyFailed'; target: CopyTarget }
  | { _tag: 'ShowCode'; target: CopyTarget }
  | { _tag: 'OpenHelp' }
  | { _tag: 'CloseHelp' }
  | { _tag: 'ToggleMenu' }
  | { _tag: 'CloseMenu' }
  | { _tag: 'ClearCopied'; target: CopyTarget }
  | { _tag: 'NoOp' }
