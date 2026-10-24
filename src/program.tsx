/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { Program } from 'react-tea-cup'
import { type Dispatcher, Sub } from 'tea-cup-fp'

import { App } from './app'
import { type Model, type Msg } from './type'
import { init, update } from './update'

const appView = (dispatch: Dispatcher<Msg>, model: Model) => (
  <App model={model} dispatch={dispatch} />
)

export const AppProgram = () => (
  <Program<Model, Msg>
    init={init}
    update={update}
    view={appView}
    subscriptions={() => Sub.none()}
  />
)
