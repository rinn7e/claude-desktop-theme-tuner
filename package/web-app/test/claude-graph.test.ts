/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { claudeGraphSource } from '../src/theme/claude-graph-source'

describe('src/theme/claude-graph.js', () => {
  // Cut from Claude's make-colors.js. After updating make-colors.js,
  // regenerate it with `pnpm test -u`
  it('matches the graph of make-colors.js', async () => {
    const makeColors = readFileSync(
      new URL('../../claude-mod/hooks/make-colors.js', import.meta.url),
      'utf8',
    )
    await expect(claudeGraphSource(makeColors)).toMatchFileSnapshot(
      '../src/theme/claude-graph.js',
    )
  })
})
