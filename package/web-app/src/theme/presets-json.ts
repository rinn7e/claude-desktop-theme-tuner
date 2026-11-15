/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { allPresets } from './presets'

// Every preset's 13 colors as JSON, served next to the page as
// public/presets.json (kept in sync by test/presets-json.test.ts), so an AI
// agent can start from a preset and check its contrast without a browser.
// public/llms.txt documents it.
export const presetsJson = (): string =>
  JSON.stringify(
    allPresets().map(({ id, name, mode, palette }) => ({
      id,
      name,
      mode,
      palette,
    })),
    null,
    2,
  ) + '\n'
