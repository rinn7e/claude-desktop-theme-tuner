/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { presetsJson } from '../src/theme/presets-json'

describe('presets.json', () => {
  // Served next to the page for AI agents (public/llms.txt). After changing a
  // preset, regenerate it with `pnpm test -u`
  it('matches the presets', async () => {
    await expect(presetsJson()).toMatchFileSnapshot('../public/presets.json')
  })
})
