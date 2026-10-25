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
  // What loading a preset file or a link did: shown under the title bar
  presetNotice: PresetNotice | null
  // Only the previews, for screenshots: opened with #view=preview
  previewOnly: boolean
}

export interface PresetNotice {
  kind: 'loaded' | 'error'
  text: string
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
  | { _tag: 'SavePreset' }
  | { _tag: 'HashChanged'; hash: string }
  | { _tag: 'CopyLink' }
  | { _tag: 'LinkCopied' }
  | { _tag: 'LinkCopyFailed' }
  | { _tag: 'LoadPresetFile'; file: File }
  | { _tag: 'PresetFileRead'; fileName: string; text: string }
  | { _tag: 'PresetFileUnreadable'; fileName: string }
  | { _tag: 'ClearPresetNotice'; text: string }
  | { _tag: 'ClearCopied'; target: CopyTarget }
  | { _tag: 'NoOp' }
