/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// The graph that turns a mod look into Claude's design system tokens, and
// the resolver that walks it, cut from Claude's own make-colors.js
// (package/claude-mod/hooks/make-colors.js), which exports neither. The home
// preview paints its mock with what they give, as Claude does. Kept in sync
// by test/claude-graph.test.ts, which writes src/theme/claude-graph.js.

const between = (text: string, from: string, to: string): string => {
  const start = text.indexOf(from)
  const end = text.indexOf(to, start)
  if (start < 0 || end < 0)
    throw new Error(
      `make-colors.js no longer has "${from}" before "${to}": update claude-graph-source.ts`,
    )
  return text.slice(start, end).trimEnd()
}

export const claudeGraphSource = (makeColors: string): string =>
  [
    '// Generated from package/claude-mod/hooks/make-colors.js (the design',
    '// system graph of Claude and its resolver) by test/claude-graph.test.ts:',
    '// do not edit. `pnpm test -u` writes it again.',
    '',
    between(makeColors, 'var THEME_GRAPH = {', 'var THEME_PAIRS'),
    '',
    between(makeColors, 'var RGB = [0, 1, 2];', 'var THEME_INPUT_GROUPS'),
    '',
    'export { THEME_GRAPH, evaluator }',
    '',
  ].join('\n')
