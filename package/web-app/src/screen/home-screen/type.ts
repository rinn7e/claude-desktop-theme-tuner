/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import {
  type AnchorKey,
  type Backdrop,
  type GitKey,
  type Mode,
  type ModeChoice,
  type RoleKey,
  type Setup,
} from '../../../../claude-mod/hooks/look'

export type CopyTarget = 'json' | 'command'

export type Parked = Partial<Record<Mode, ModeChoice>>

// The knobs a mode sets directly, by group
export type KnobGroup =
  | { group: 'anchors'; key: AnchorKey }
  | { group: 'roles'; key: RoleKey }
  | { group: 'git'; key: GitKey }

// The home screen: designs a theme for the Theme Tuner mod. The setup is the
// mod's own JSON (doc/mod-knobs.md), edited knob by knob
export interface Model {
  // The banner that points people from the video and old links to /legacy
  isBannerShown: boolean
  setup: Setup
  // The choices of the modes left out, kept until they are taken back
  parked: Parked
  // The Theme JSON as typed, while it is being edited; null shows the setup
  jsonDraft: string | null
  // Why the typed JSON is not a setup
  jsonError: string | null
  copied: CopyTarget | null
  copyFailed: CopyTarget | null
}

export type Msg =
  | { _tag: 'DismissBanner' }
  // Themes a mode, from its default preset, or leaves it to Claude
  | { _tag: 'SetModeOn'; mode: Mode; isOn: boolean }
  | { _tag: 'PickPreset'; mode: Mode; id: string }
  // null takes the knob back to what the palette gives
  | { _tag: 'SetKnob'; mode: Mode; knob: KnobGroup; value: string | null }
  | { _tag: 'SetCodeTheme'; mode: Mode; value: string | null }
  // Back to the preset: every knob set over it goes
  | { _tag: 'ResetMode'; mode: Mode }
  | { _tag: 'SetContrast'; isMore: boolean }
  | { _tag: 'SetBackdrop'; backdrop: Backdrop | null }
  | { _tag: 'EditJson'; text: string }
  | { _tag: 'LeaveJson' }
  | { _tag: 'Copy'; target: CopyTarget }
  | { _tag: 'Copied'; target: CopyTarget }
  | { _tag: 'CopyFailed'; target: CopyTarget }
  | { _tag: 'ClearCopied'; target: CopyTarget }
  | { _tag: 'NoOp' }
