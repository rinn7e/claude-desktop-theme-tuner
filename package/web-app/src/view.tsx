/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { type Screen, homeScreen } from './common/destination'
import { Link } from './component/link'
import { HomeView } from './screen/home-screen/view'
import { App as LegacyView } from './screen/legacy-screen/view'
import { type Model, type Msg } from './type'

const notFoundView = (navigate: (screen: Screen) => void) => (
  <main className='flex min-h-full flex-col items-center justify-center gap-[12px] bg-ui-page p-[24px] text-center'>
    <h1 className='text-xl font-semibold text-ui-ink'>Page not found</h1>
    <Link
      screen={homeScreen}
      navigate={navigate}
      className='text-sm text-ui-ink underline'
    >
      Go to the Theme Tuner
    </Link>
  </main>
)

// The screen shown, its messages wrapped as the root's
export const RootView = ({
  model,
  dispatch,
}: {
  model: Model
  dispatch: Dispatcher<Msg>
}) => {
  const navigate = (screen: Screen) => dispatch({ _tag: 'Navigate', screen })
  const { screen } = model
  switch (screen._tag) {
    case 'HomeScreen':
      return (
        <HomeView
          model={screen.model}
          dispatch={(msg) => dispatch({ _tag: 'HomeMsg', msg })}
          navigate={navigate}
        />
      )
    case 'LegacyScreen':
      return (
        <LegacyView
          model={screen.model}
          dispatch={(msg) => dispatch({ _tag: 'LegacyMsg', msg })}
        />
      )
    case 'NotFoundScreen':
      return notFoundView(navigate)
  }
}
