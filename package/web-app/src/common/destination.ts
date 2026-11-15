/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import {
  type Parser,
  Route,
  end,
  format,
  lit,
  parse,
  zero,
} from '@rinn7e/fp-ts-routing'

import { BASE_URL } from './env'

// The screens of the app and the URLs they live at. The only code that
// knows how a screen is spelled in the URL: `parseScreen` reads it at boot
// and on the browser's back and forward, `urlOf` writes it on a move.
export type Screen =
  // `/`: designs a theme for the Theme Tuner mod
  | { readonly _tag: 'HomeScreen' }
  // `/legacy`: the first tuner, which writes a DevTools snippet
  | { readonly _tag: 'LegacyScreen' }
  | { readonly _tag: 'NotFoundScreen' }

export const homeScreen: Screen = { _tag: 'HomeScreen' }
export const legacyScreen: Screen = { _tag: 'LegacyScreen' }
export const notFoundScreen: Screen = { _tag: 'NotFoundScreen' }

const homeMatch = end
const legacyMatch = lit('legacy').and(end)

const screenParser: Parser<Screen> = zero<Screen>()
  .alt(homeMatch.parser.map(() => homeScreen))
  .alt(legacyMatch.parser.map(() => legacyScreen))

// The path of `href` below the base, with its query: what the routes read
export const removeBaseUrl = (href: string): string => {
  const url = new URL(href)
  const base = BASE_URL.replace(/\/$/, '')
  const path =
    base !== '' && url.pathname.startsWith(base)
      ? url.pathname.slice(base.length)
      : url.pathname
  return (path === '' ? '/' : path) + url.search
}

const addBaseUrl = (path: string): string =>
  `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

// `href`: a full URL, the page's `location.href`; any other path is not found
export const parseScreen = (href: string): Screen =>
  parse(screenParser, Route.parse(removeBaseUrl(href)), notFoundScreen)

// The URL of a screen, under the base. Not found has none of its own: a move
// there keeps the URL the person typed.
export const urlOf = (screen: Screen): string | undefined => {
  switch (screen._tag) {
    case 'HomeScreen':
      return addBaseUrl(format(homeMatch.formatter, {}))
    case 'LegacyScreen':
      return addBaseUrl(format(legacyMatch.formatter, {}))
    case 'NotFoundScreen':
      return undefined
  }
}
