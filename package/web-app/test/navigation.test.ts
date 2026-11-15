/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it, vi } from 'vitest'

import {
  homeScreen,
  legacyScreen,
  notFoundScreen,
  parseScreen,
  urlOf,
} from '../src/common/destination'
import { type Model } from '../src/type'
import { init, update } from '../src/update'

const at = (path: string) => `https://example.com${path}`

// The legacy screen reads a share link from the page's hash when it opens;
// the tests run outside a browser, on a page with none
vi.stubGlobal('window', {
  location: { hash: '', href: 'https://example.com/' },
  history: { pushState: () => {}, replaceState: () => {} },
})

describe('the URL of a screen', () => {
  it.each([
    ['/', homeScreen],
    ['/legacy', legacyScreen],
    ['/legacy/', legacyScreen],
    // A share link of the first tuner keeps its hash on the legacy screen
    ['/legacy#theme=%7B%7D&view=preview', legacyScreen],
    ['/nope', notFoundScreen],
    ['/legacy/nope', notFoundScreen],
  ])('reads %s', (path, screen) => {
    expect(parseScreen(at(path))).toEqual(screen)
  })

  it('writes what it reads', () => {
    for (const screen of [homeScreen, legacyScreen]) {
      const url = urlOf(screen)
      if (url === undefined) throw new Error('no URL')
      expect(parseScreen(at(url))).toEqual(screen)
    }
    // Not found keeps the URL the person typed
    expect(urlOf(notFoundScreen)).toBeUndefined()
  })
})

describe('moving between screens', () => {
  const [home] = init({ href: at('/') })

  it('opens the screen the URL names', () => {
    expect(home.screen._tag).toBe('HomeScreen')
    expect(init({ href: at('/legacy') })[0].screen._tag).toBe('LegacyScreen')
    expect(init({ href: at('/nope') })[0].screen._tag).toBe('NotFoundScreen')
  })

  it('opens the screen a link names', () => {
    const [moved] = update({ _tag: 'Navigate', screen: legacyScreen }, home)
    expect(moved.screen._tag).toBe('LegacyScreen')
  })

  it('keeps the screen when only the hash changed', () => {
    const [legacy] = init({ href: at('/legacy') })
    const [after] = update({ _tag: 'UrlChanged', screen: legacyScreen }, legacy)
    expect(after).toBe(legacy)
    const [back] = update({ _tag: 'UrlChanged', screen: homeScreen }, legacy)
    expect(back.screen._tag).toBe('HomeScreen')
  })

  it("drops a screen's message once another screen shows", () => {
    const [after] = update(
      { _tag: 'LegacyMsg', msg: { _tag: 'ToggleReduceMotion' } },
      home,
    )
    expect(after).toBe(home)
  })

  it('passes a message to the screen shown', () => {
    const [after]: [Model, unknown] = update(
      { _tag: 'HomeMsg', msg: { _tag: 'DismissBanner' } },
      home,
    )
    expect(after.screen).toMatchObject({
      _tag: 'HomeScreen',
      model: { isBannerShown: false },
    })
  })
})
