/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { Cmd, Task } from 'tea-cup-fp'

import { type Screen, parseScreen, urlOf } from './common/destination'
import * as Home from './screen/home-screen/update'
import * as Legacy from './screen/legacy-screen/update'
import { type Model, type Msg, type ScreenModel } from './type'

// Opens a screen afresh: its own `init`, its messages wrapped as the root's
export const openScreen = (screen: Screen): [ScreenModel, Cmd<Msg>] => {
  switch (screen._tag) {
    case 'HomeScreen': {
      const [model, cmd] = Home.init()
      return [
        { _tag: 'HomeScreen', model },
        cmd.map((msg): Msg => ({ _tag: 'HomeMsg', msg })),
      ]
    }
    case 'LegacyScreen': {
      const [model, cmd] = Legacy.init()
      return [
        { _tag: 'LegacyScreen', model },
        cmd.map((msg): Msg => ({ _tag: 'LegacyMsg', msg })),
      ]
    }
    case 'NotFoundScreen':
      return [{ _tag: 'NotFoundScreen' }, Cmd.none()]
  }
}

export const init = (location: Pick<Location, 'href'>): [Model, Cmd<Msg>] => {
  const [screen, cmd] = openScreen(parseScreen(location.href))
  return [{ screen }, cmd]
}

const pushUrlCmd = (url: string): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      window.history.pushState(null, '', url)
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  const { screen } = model
  switch (msg._tag) {
    case 'Navigate': {
      const [next, cmd] = openScreen(msg.screen)
      const url = urlOf(msg.screen)
      return [
        { screen: next },
        url === undefined ? cmd : Cmd.batch([pushUrlCmd(url), cmd]),
      ]
    }
    case 'UrlChanged': {
      // A change of the hash alone fires it too: the screen stays, and the
      // legacy screen reads a pasted link from its own hash subscription
      if (msg.screen._tag === screen._tag) return [model, Cmd.none()]
      const [next, cmd] = openScreen(msg.screen)
      return [{ screen: next }, cmd]
    }
    case 'HomeMsg': {
      if (screen._tag !== 'HomeScreen') return [model, Cmd.none()]
      const [next, cmd] = Home.update(msg.msg, screen.model)
      return [
        { screen: { ...screen, model: next } },
        cmd.map((m): Msg => ({ _tag: 'HomeMsg', msg: m })),
      ]
    }
    case 'LegacyMsg': {
      if (screen._tag !== 'LegacyScreen') return [model, Cmd.none()]
      const [next, cmd] = Legacy.update(msg.msg, screen.model)
      return [
        { screen: { ...screen, model: next } },
        cmd.map((m): Msg => ({ _tag: 'LegacyMsg', msg: m })),
      ]
    }
    case 'NoOp':
      return [model, Cmd.none()]
  }
}
