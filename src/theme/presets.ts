/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { CODE_THEME_PRESETS } from './code-themes'
import { type Palette, type Theme } from './palette'

// Each preset maps a color scheme onto the palette roles. Surfaces and accents
// are the scheme's own colors; text and accent shades are adjusted only where
// the scheme's own fall below WCAG AA (4.5:1) as UI text (test/presets.test.ts).

// Hand-tuned presets; the other code themes are generated (code-themes.ts)
const HAND_TUNED: Theme[] = [
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    mode: 'light',
    credit: {
      name: 'Solarized by Ethan Schoonover',
      url: 'https://ethanschoonover.com/solarized/',
      license: 'MIT',
    },
    palette: {
      frame: '#eee8d5', // base2
      canvas: '#fdf6e3', // base3
      raised: '#f5efdc',
      pressed: '#e4ddc8',
      text: '#073642', // base02
      textSecondary: '#455f67', // base01, darkened for AA
      textMuted: '#516b74', // base00, darkened for AA
      line: '#586e75', // base01
      accent: '#ad461b', // orange, darkened for AA
      accentHover: '#94421f',
      onAccent: '#ffffff',
      selected: '#dfca88', // VS Code Solarized Light list selection
      wash: '#b58900', // yellow
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    mode: 'dark',
    credit: {
      name: 'Solarized by Ethan Schoonover',
      url: 'https://ethanschoonover.com/solarized/',
      license: 'MIT',
    },
    palette: {
      frame: '#00212b', // VS Code Solarized Dark sidebar
      canvas: '#002b36', // base03
      raised: '#073642', // base02
      pressed: '#0d4251',
      text: '#eee8d5', // base2
      textSecondary: '#93a1a1', // base1
      textMuted: '#839496', // base0
      line: '#93a1a1',
      accent: '#e0703f', // orange, lightened for AA
      accentHover: '#ea8a5e',
      onAccent: '#002b36',
      selected: '#005a6f', // VS Code Solarized Dark list selection
      wash: '#2aa198', // cyan
    },
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    mode: 'light',
    palette: {
      frame: '#f6f8fa',
      canvas: '#ffffff',
      raised: '#f6f8fa',
      pressed: '#eaeef2',
      text: '#1f2328',
      textSecondary: '#59636e',
      textMuted: '#656d76',
      line: '#59636e',
      accent: '#0969da',
      accentHover: '#0550ae',
      onAccent: '#ffffff',
      selected: '#ddf4ff',
      wash: '#0969da',
    },
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    mode: 'light',
    credit: {
      name: 'Gruvbox by Pavel Pertsev',
      url: 'https://github.com/morhetz/gruvbox',
      license: 'MIT',
    },
    palette: {
      frame: '#f2e5bc', // bg0_s
      canvas: '#fbf1c7', // bg0
      raised: '#f5ebc4',
      pressed: '#ebdbb2', // bg1
      text: '#3c3836', // fg
      textSecondary: '#59524d', // fg2; dimmed to stand apart from the text (was #504945)
      textMuted: '#665c54', // fg3
      line: '#7c6f64', // fg4
      accent: '#af3a03', // orange
      accentHover: '#9d0006', // red
      onAccent: '#ffffff',
      selected: '#d5c4a1', // bg2
      wash: '#b57614', // yellow
    },
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    mode: 'light',
    credit: {
      name: 'Catppuccin',
      url: 'https://github.com/catppuccin/catppuccin',
      license: 'MIT',
    },
    palette: {
      frame: '#e6e9ef', // mantle
      canvas: '#eff1f5', // base
      raised: '#e9ecf1',
      pressed: '#dce0e8', // crust
      text: '#4a4d67', // text; nudged to stand apart from the secondary (was #4c4f69)
      textSecondary: '#65687e', // subtext1; dimmed to stand apart from the text (was #5c5f77)
      textMuted: '#65687d', // subtext0, darkened for AA; dimmed below the secondary (was #5f6279)
      line: '#8c8fa1', // overlay2
      accent: '#8839ef', // mauve
      accentHover: '#7287fd', // lavender
      onAccent: '#ffffff',
      selected: '#ccd0da', // surface0
      wash: '#df8e1d', // yellow
    },
  },
  {
    id: 'monokai',
    name: 'Monokai',
    mode: 'dark',
    credit: {
      name: 'Monokai by Wimer Hazenberg',
      url: 'https://monokai.nl',
      license: 'color scheme',
    },
    palette: {
      frame: '#1e1f1c',
      canvas: '#272822',
      raised: '#3e3d32',
      pressed: '#49483e',
      text: '#f8f8f2',
      textSecondary: '#ccccbf', // dimmed to stand apart from the text (was #cfcfc2)
      textMuted: '#a59f85',
      line: '#75715e',
      accent: '#fd971f', // orange
      accentHover: '#e6db74', // yellow
      onAccent: '#272822',
      selected: '#49483e',
      wash: '#e6db74',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    mode: 'dark',
    credit: {
      name: 'Dracula',
      url: 'https://draculatheme.com',
      license: 'MIT',
    },
    palette: {
      frame: '#21222c',
      canvas: '#282a36', // background
      raised: '#343746',
      pressed: '#44475a', // current line
      text: '#f8f8f2', // foreground
      textSecondary: '#cacbd5', // dimmed to stand apart from the text (was #d6d7e1)
      textMuted: '#a4a9cc', // comment, lightened for AA
      line: '#6272a4', // comment
      accent: '#bd93f9', // purple
      accentHover: '#ff79c6', // pink
      onAccent: '#282a36',
      selected: '#44475a',
      wash: '#bd93f9',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    mode: 'dark',
    credit: {
      name: 'Nord by Arctic Ice Studio',
      url: 'https://www.nordtheme.com',
      license: 'MIT',
    },
    palette: {
      frame: '#272c36',
      canvas: '#2e3440', // nord0
      raised: '#3b4252', // nord1
      pressed: '#434c5e', // nord2
      text: '#eceff4', // nord6
      textSecondary: '#bdc3ce', // nord4; dimmed to stand apart from the text (was #d8dee9)
      textMuted: '#a7b1c2',
      line: '#4c566a', // nord3
      accent: '#88c0d0', // nord8
      accentHover: '#8fbcbb', // nord7
      onAccent: '#2e3440',
      selected: '#434c5e',
      wash: '#88c0d0',
    },
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    mode: 'dark',
    credit: {
      name: 'Gruvbox by Pavel Pertsev',
      url: 'https://github.com/morhetz/gruvbox',
      license: 'MIT',
    },
    palette: {
      frame: '#1d2021', // bg0_h
      canvas: '#282828', // bg0
      raised: '#32302f', // bg0_s
      pressed: '#3c3836', // bg1
      text: '#ebdbb2', // fg
      textSecondary: '#c3b295', // fg2; dimmed to stand apart from the text (was #d5c4a1)
      textMuted: '#a89984', // fg4
      line: '#665c54', // bg3
      accent: '#fe8019', // orange
      accentHover: '#fabd2f', // yellow
      onAccent: '#282828',
      selected: '#504945', // bg2
      wash: '#d79921',
    },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    mode: 'dark',
    credit: {
      name: 'Catppuccin',
      url: 'https://github.com/catppuccin/catppuccin',
      license: 'MIT',
    },
    palette: {
      frame: '#181825', // mantle
      canvas: '#1e1e2e', // base
      raised: '#313244', // surface0
      pressed: '#45475a', // surface1
      text: '#cdd6f4', // text
      textSecondary: '#a5adc8', // subtext1; dimmed to stand apart from the text (was #bac2de)
      textMuted: '#a6adc8', // subtext0
      line: '#6c7086', // overlay0
      accent: '#cba6f7', // mauve
      accentHover: '#b4befe', // lavender
      onAccent: '#1e1e2e',
      selected: '#45475a',
      wash: '#cba6f7',
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    mode: 'dark',
    credit: {
      name: 'Tokyo Night by enkia',
      url: 'https://github.com/enkia/tokyo-night-vscode-theme',
      license: 'MIT',
    },
    palette: {
      frame: '#16161e',
      canvas: '#1a1b26',
      raised: '#24283b',
      pressed: '#292e42',
      text: '#c0caf5',
      textSecondary: '#9da5c9', // dimmed to stand apart from the text (was #a9b1d6)
      textMuted: '#8b91b0', // lightened for AA
      line: '#3b4261',
      accent: '#7aa2f7', // blue
      accentHover: '#7dcfff', // cyan
      onAccent: '#1a1b26',
      selected: '#283457',
      wash: '#7aa2f7',
    },
  },
  {
    // Named like Claude's code theme; the id stays 'one-dark' so setups saved
    // before the rename still find it
    id: 'one-dark',
    name: 'One Dark Pro',
    mode: 'dark',
    credit: {
      name: 'One Dark Pro by Binaryify, after Atom One Dark',
      url: 'https://github.com/Binaryify/OneDark-Pro',
      license: 'MIT',
    },
    palette: {
      frame: '#21252b',
      canvas: '#282c34',
      raised: '#2c313a',
      pressed: '#3e4451',
      text: '#dcdfe4',
      textSecondary: '#abb2bf',
      textMuted: '#9da5b4',
      line: '#5c6370',
      accent: '#61afef', // blue
      accentHover: '#56b6c2', // cyan
      onAccent: '#282c34',
      selected: '#3e4451',
      wash: '#61afef',
    },
  },
  {
    id: 'groovy-lambda-black',
    name: 'Groovy Lambda Black',
    mode: 'dark',
    credit: {
      name: 'Groovy Lambda by sheaf',
      url: 'https://github.com/sheaf/groovy-lambda',
      license: 'MIT',
    },
    palette: {
      frame: '#151515', // the near-black of universal-theme-tuner's VS Code theme
      canvas: '#1b1b1b',
      raised: '#292828', // Groovy Lambda's background
      pressed: '#32302f',
      text: '#d4be98',
      textSecondary: '#a89984', // fg4: dimmer than the text, so thinking and labels stand apart
      textMuted: '#928374', // gray
      line: '#5a524c',
      accent: '#a9b665', // green
      accentHover: '#d8a657', // yellow
      onAccent: '#151515',
      selected: '#45403d',
      wash: '#d8a657',
    },
  },
]

export const presetById = (id: string): Theme | undefined =>
  allPresets().find((t) => t.id === id)

// The order of Claude's "Code appearance" lists (Claude 3.6556.2), so each
// app theme sits where its code theme does; presets Claude has no code theme
// for (Gruvbox, Groovy Lambda Black) come after
const CLAUDE_ORDER = [
  'claude-light',
  'github-light',
  'pierre-light',
  'vs-code-light',
  'one-light',
  'catppuccin-latte',
  'solarized-light',
  'vitesse-light',
  'min-light',
  'rose-pine-dawn',
  'slack-ochin',
  'claude-dark',
  'github-dark',
  'github-dark-dimmed',
  'pierre-dark',
  'vs-code-dark',
  'one-dark',
  'dracula',
  'dracula-soft',
  'catppuccin-mocha',
  'nord',
  'solarized-dark',
  'vitesse-dark',
  'min-dark',
  'monokai',
  'tokyo-night',
  'night-owl',
  'rose-pine',
  'ayu-dark',
  'slack-dark',
]
const rank = (theme: Theme): number => {
  const at = CLAUDE_ORDER.indexOf(theme.id)
  return at === -1 ? CLAUDE_ORDER.length : at
}

// Every preset after the Claude ones, in Claude's order
export const PRESETS: Theme[] = [...HAND_TUNED, ...CODE_THEME_PRESETS].sort(
  (a, b) => rank(a) - rank(b),
)

// Every preset, the Claude ones first in each mode's list
export const allPresets = (): Theme[] => [...CLAUDE_PRESETS, ...PRESETS]

// Claude's own defaults, measured in Claude 3.6556.2 with
// snippets/stock-colors.snippet.js. Claude paints text and washes with
// translucent black or white; here each is blended over its background, and
// lines and washes are solved so that, at the alpha tokens.ts applies (22% and
// 10%), they land on Claude's own (8% and 5%). Its muted text and blue accent
// fall below AA, and are kept as Claude ships them.
export const STOCK: Record<'light' | 'dark', Palette> = {
  light: {
    frame: '#f9f9f9', // --cds-surface-0; the sidebar is #fafafa
    canvas: '#ffffff',
    raised: '#ffffff', // --cds-surface-3 and popovers
    pressed: '#f2f2f2', // card hover
    text: '#1a1a1a', // black at 90%
    textSecondary: '#666666', // black at 60%
    textMuted: '#888888', // black at 47%
    line: '#a2a2a2', // at 22%: black at 8%
    accent: '#257de0', // --cds-fill-accent
    accentHover: '#1757ac', // --cds-text-accent
    onAccent: '#ffffff',
    selected: '#e1e1e1', // black at 10% on the sidebar
    wash: '#858585', // at 10%: #0b0b0b at 5%
  },
  dark: {
    frame: '#1f1f1f', // the sidebar; --cds-surface-0 is #0b0b0b
    canvas: '#191919',
    raised: '#262626', // between --cds-surface-3 (#1f1f1f) and popovers (#303030)
    pressed: '#303030',
    text: '#efefef', // white at 93%
    textSecondary: '#9c9c9c', // white at 57%
    textMuted: '#757575', // white at 40%
    line: '#424242', // at 22%: white at 4%
    accent: '#257de0',
    accentHover: '#338ced',
    onAccent: '#ffffff',
    selected: '#3c3c3c', // white at 15%
    wash: '#8c8c8c', // at 10%: white at 5%
  },
}

// The Claude desktop version the theme and these presets were checked
// against (macOS); shown in the tuner's title bar. Update it after testing a
// new release.
export const TESTED_CLAUDE_VERSION = '3.6556.2'

const claudeCredit = {
  name: "Claude's own defaults",
  url: 'https://claude.ai/download',
  license: `measured in Claude ${TESTED_CLAUDE_VERSION}`,
}

// The Claude presets: start from the app's own look and change one color
export const CLAUDE_PRESETS: Theme[] = [
  {
    id: 'claude-light',
    name: 'Claude Light',
    mode: 'light',
    credit: claudeCredit,
    palette: STOCK.light,
  },
  {
    id: 'claude-dark',
    name: 'Claude Dark',
    mode: 'dark',
    credit: claudeCredit,
    palette: STOCK.dark,
  },
]
