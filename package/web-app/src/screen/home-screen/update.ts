/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { Cmd } from 'tea-cup-fp'

import { type Model, type Msg } from './type'

export const init = (): [Model, Cmd<Msg>] => [
  { isBannerShown: true },
  Cmd.none(),
]

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'DismissBanner':
      return [{ ...model, isBannerShown: false }, Cmd.none()]
  }
}
