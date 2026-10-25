/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { Program } from 'react-tea-cup'
import { type Dispatcher, Port } from 'tea-cup-fp'

import { App } from './app'
import { type Model, type Msg } from './type'
import { init, update } from './update'

// A link opened in a tab that already has the tuner only changes the hash,
// which reloads nothing; the port passes it on
const hashChanges = new Port<string>()
window.addEventListener('hashchange', () =>
  hashChanges.send(window.location.hash),
)

const appView = (dispatch: Dispatcher<Msg>, model: Model) => (
  <App model={model} dispatch={dispatch} />
)

export const AppProgram = () => (
  <Program<Model, Msg>
    init={init}
    update={update}
    view={appView}
    subscriptions={() =>
      hashChanges.subscribe((hash): Msg => ({ _tag: 'HashChanged', hash }))
    }
  />
)
