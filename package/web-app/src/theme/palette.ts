/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// The colors a theme is made of. Every Claude variable the snippet sets is
// derived from these (see tokens.ts).
export interface Palette {
  frame: string
  canvas: string
  raised: string
  pressed: string
  text: string
  textSecondary: string
  textMuted: string
  line: string
  accent: string
  accentHover: string
  onAccent: string
  selected: string
  wash: string
}

export type PaletteKey = keyof Palette

export type Mode = 'light' | 'dark'

export interface Credit {
  name: string
  url: string
  license: string
}

export interface Theme {
  id: string
  name: string
  mode: Mode
  palette: Palette
  // The color scheme the preset follows, credited in the app
  credit?: Credit
}

// Groups and labels for the customizer, in display order
export const PALETTE_GROUPS: {
  title: string
  keys: { key: PaletteKey; label: string; note: string }[]
}[] = [
  {
    title: 'Surfaces',
    keys: [
      { key: 'frame', label: 'Frame', note: 'sidebar, title bar, menus' },
      { key: 'canvas', label: 'Canvas', note: 'chat, composer, panes' },
      { key: 'raised', label: 'Raised', note: 'cards, inputs' },
      { key: 'pressed', label: 'Pressed', note: 'stronger fills' },
    ],
  },
  {
    title: 'Text',
    keys: [
      { key: 'text', label: 'Primary', note: 'messages, titles' },
      { key: 'textSecondary', label: 'Secondary', note: 'labels, rows' },
      { key: 'textMuted', label: 'Muted', note: 'hints, timestamps' },
    ],
  },
  {
    title: 'Accent and lines',
    keys: [
      { key: 'accent', label: 'Accent', note: 'links, buttons, focus' },
      { key: 'accentHover', label: 'Accent hover', note: 'hovered accent' },
      { key: 'onAccent', label: 'On accent', note: 'text on buttons' },
      { key: 'line', label: 'Lines', note: 'borders, at 22% and 40%' },
    ],
  },
  {
    title: 'Lists and washes',
    keys: [
      {
        key: 'selected',
        label: 'Selected',
        note: 'selected row; hover at 27%',
      },
      { key: 'wash', label: 'Wash', note: 'your messages, neutral tints' },
    ],
  },
]

// Pairs that must stay readable, with the WCAG level they aim for (4.5 for
// text, 3 for large or non-text UI)
export const CONTRAST_CHECKS: {
  fg: PaletteKey
  bg: PaletteKey
  min: number
}[] = [
  { fg: 'text', bg: 'canvas', min: 4.5 },
  { fg: 'text', bg: 'frame', min: 4.5 },
  { fg: 'textSecondary', bg: 'canvas', min: 4.5 },
  { fg: 'textSecondary', bg: 'frame', min: 4.5 },
  { fg: 'textMuted', bg: 'canvas', min: 4.5 },
  { fg: 'textMuted', bg: 'frame', min: 4.5 },
  { fg: 'accent', bg: 'canvas', min: 4.5 },
  { fg: 'onAccent', bg: 'accent', min: 4.5 },
  { fg: 'text', bg: 'selected', min: 4.5 },
]
