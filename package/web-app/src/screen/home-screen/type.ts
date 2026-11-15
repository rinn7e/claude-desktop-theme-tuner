/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// The home screen: designs a theme for the Theme Tuner mod
export interface Model {
  // The banner that points people from the video and old links to /legacy
  isBannerShown: boolean
}

export type Msg = { _tag: 'DismissBanner' }
