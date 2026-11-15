/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// Whether a banner was dismissed, kept in localStorage so it stays away on
// the next visit. Each screen names its own banner. A private window may
// refuse storage: the banner then shows again, and the page works.
const keyOf = (banner: string) =>
  `claude-theme-tuner:banner-dismissed:${banner}`

export const isBannerDismissed = (banner: string): boolean => {
  try {
    return window.localStorage.getItem(keyOf(banner)) === 'true'
  } catch {
    return false
  }
}

export const rememberBannerDismissed = (banner: string): Promise<void> => {
  try {
    window.localStorage.setItem(keyOf(banner), 'true')
  } catch {
    // Storage refused: the banner shows again next time
  }
  return Promise.resolve()
}
