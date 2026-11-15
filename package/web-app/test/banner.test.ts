/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it, vi } from 'vitest'

import {
  isBannerDismissed,
  rememberBannerDismissed,
} from '../src/common/banner'

describe('a dismissed banner', () => {
  it('stays dismissed on the next visit, each banner on its own', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      },
    })
    expect(isBannerDismissed('home')).toBe(false)
    await rememberBannerDismissed('home')
    expect(isBannerDismissed('home')).toBe(true)
    expect(isBannerDismissed('legacy')).toBe(false)
    vi.unstubAllGlobals()
  })

  it('shows again where the browser refuses storage', async () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('refused')
        },
        setItem: () => {
          throw new Error('refused')
        },
      },
    })
    await rememberBannerDismissed('home')
    expect(isBannerDismissed('home')).toBe(false)
    vi.unstubAllGlobals()
  })
})
