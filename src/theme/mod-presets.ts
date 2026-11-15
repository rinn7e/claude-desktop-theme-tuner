/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { allPresets } from './presets'

// The ids Claude gives its code themes ("Code appearance"), where they differ
// from the preset's: read from Claude 4.16336.0's own list. A preset Claude
// has no code theme for (Gruvbox, Groovy Lambda Black, Meadow Light) keeps
// the app's code highlighting.
const CODE_THEME_IDS: Record<string, string> = {
  'vs-code-light': 'vscode-light',
  'vs-code-dark': 'vscode-dark',
  'one-dark': 'one-dark-pro',
}
const WITHOUT_CODE_THEME = [
  'gruvbox-light',
  'gruvbox-dark',
  'groovy-lambda-black',
  'meadow-light',
]

export const codeThemeOf = (id: string): string | undefined =>
  WITHOUT_CODE_THEME.includes(id) ? undefined : (CODE_THEME_IDS[id] ?? id)

// mod/hooks/presets.ts: every preset for the Theme Tuner mod, which cannot
// import the web app. Kept in sync by test/mod-presets.test.ts.
export const modPresetsSource = (): string => {
  const presets = allPresets().map(({ id, name, mode, palette }) => {
    const codeTheme = codeThemeOf(id)
    return { id, name, mode, ...(codeTheme ? { codeTheme } : {}), palette }
  })
  return `/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// Generated from the web tuner's presets (src/theme/mod-presets.ts) by
// test/mod-presets.test.ts: do not edit. \`pnpm test -u\` writes it again.

import type { Mode, Palette } from './look'

export interface Preset {
  id: string
  name: string
  mode: Mode
  codeTheme?: string
  palette: Palette
}

export const PRESETS: readonly Preset[] = ${JSON.stringify(presets, null, 2)}
`
}
