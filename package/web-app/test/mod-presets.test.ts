/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest'

import { modPresetsSource } from '../src/theme/mod-presets'

describe('mod/hooks/presets.ts', () => {
  // The mod's copy of the presets. After changing a preset, regenerate it
  // with `pnpm test -u`
  it('matches the presets', async () => {
    await expect(modPresetsSource()).toMatchFileSnapshot(
      '../../claude-mod/hooks/presets.ts',
    )
  })
})
