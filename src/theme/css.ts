/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { type Mode, type Theme } from './palette'
import { deriveTokens } from './tokens'

// The themes a snippet carries: one per mode, or none to leave that mode stock
export interface ThemePair {
  light: Theme | null
  dark: Theme | null
}

const other = (mode: Mode): Mode => (mode === 'light' ? 'dark' : 'light')

const block = (
  selectors: string[],
  decls: Record<string, string>,
  indent = '',
) =>
  `${indent}${selectors.join(`,\n${indent}`)} {\n` +
  Object.entries(decls)
    .map(([k, v]) => `${indent}  ${k}: ${v};`)
    .join('\n') +
  `\n${indent}}`

// A mode applies when the app is set to it, or set to follow the system while
// the system is in it. The selectors repeat the app's own structure under
// html[data-mode] so they win on specificity.
const rootSelectors = (mode: Mode) => [
  `html.cds-root[data-mode="${mode}"]`,
  `html[data-mode="${mode}"] .cds-root:not([data-mode="${other(mode)}"]):not([data-mode="system"])`,
]
const systemRootSelectors = [
  'html.cds-root[data-mode="system"]',
  'html[data-mode="system"] .cds-root:not([data-mode="light"]):not([data-mode="dark"])',
]
// The Code tab frame re-sets its variables on these, so they are set there too
const frameScopes = [
  '.dframe-root',
  '.dframe-root .dframe-sidebar',
  '.dframe-root[data-variant] .dframe-sidebar',
  '.dframe-root .dframe-card',
  '.dframe-root .df-session-list',
  '.dframe-root .df-session-list[data-list-section]',
]
const frameSelectors = (dataMode: string) =>
  frameScopes.map((s) => `html[data-mode="${dataMode}"] ${s}`)

const modeCss = (mode: Mode, theme: Theme) => {
  const { root, frame } = deriveTokens(theme.palette)
  const rootDecls = { ...root, 'accent-color': theme.palette.accent }
  return [
    `/* ---------- ${mode}: ${theme.name} ---------- */`,
    block(rootSelectors(mode), rootDecls),
    block(frameSelectors(mode), frame),
    `@media (prefers-color-scheme: ${mode}) {`,
    block(systemRootSelectors, rootDecls, '  '),
    block(frameSelectors('system'), frame, '  '),
    '}',
  ].join('\n')
}

export const themeCss = (pair: ThemePair): string => {
  const parts = (['light', 'dark'] as const).flatMap((mode) => {
    const theme = pair[mode]
    return theme ? [modeCss(mode, theme)] : []
  })
  const names = (['light', 'dark'] as const)
    .map((mode) => `${mode}: ${pair[mode]?.name ?? 'stock'}`)
    .join(', ')
  const header = `/* Claude desktop theme (${names}), made with Claude Desktop Theme Tuner.
 * Overrides the app's own design-system variables, the approach of the Clay
 * theme by Maxime Bories (MIT). */`
  return [header, ...parts].join('\n\n') + '\n'
}
