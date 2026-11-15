/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { type Screen } from './common/destination'
import type * as Home from './screen/home-screen/type'
import type * as Legacy from './screen/legacy-screen/type'

// The screen shown, with its own model
export type ScreenModel =
  | { readonly _tag: 'HomeScreen'; model: Home.Model }
  | { readonly _tag: 'LegacyScreen'; model: Legacy.Model }
  | { readonly _tag: 'NotFoundScreen' }

export interface Model {
  screen: ScreenModel
}

export type Msg =
  | { _tag: 'HomeMsg'; msg: Home.Msg }
  | { _tag: 'LegacyMsg'; msg: Legacy.Msg }
  // A link in the app: opens the screen and pushes its URL
  | { _tag: 'Navigate'; screen: Screen }
  // The browser's back and forward: opens the screen the URL names
  | { _tag: 'UrlChanged'; screen: Screen }
  | { _tag: 'NoOp' }
