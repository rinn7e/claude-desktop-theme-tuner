/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { ProgramWithNav } from 'react-tea-cup'
import { type Dispatcher, Sub } from 'tea-cup-fp'

import { parseScreen } from './common/destination'
import { subscriptions as legacySubscriptions } from './screen/legacy-screen/subscription'
import { type Model, type Msg } from './type'
import { init, update } from './update'
import { RootView } from './view'

const appView = (dispatch: Dispatcher<Msg>, model: Model) => (
  <RootView model={model} dispatch={dispatch} />
)

// Only the screen shown listens: the legacy screen to its hash
const subscriptions = (model: Model): Sub<Msg> =>
  model.screen._tag === 'LegacyScreen'
    ? legacySubscriptions().map((msg): Msg => ({ _tag: 'LegacyMsg', msg }))
    : Sub.none()

export const AppProgram = () => (
  <ProgramWithNav<Model, Msg>
    // The browser's back and forward (the app's own URL writes fire no
    // `popstate`)
    onUrlChange={(location): Msg => ({
      _tag: 'UrlChanged',
      screen: parseScreen(location.href),
    })}
    init={init}
    update={update}
    view={appView}
    subscriptions={subscriptions}
  />
)
