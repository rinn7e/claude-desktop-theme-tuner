/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { type Screen, legacyScreen } from '../../common/destination'
import { Link } from '../../component/link'
import { type Model, type Msg } from './type'

export interface HomeViewProps {
  model: Model
  dispatch: Dispatcher<Msg>
  navigate: (screen: Screen) => void
}

// For people from the video, a post or an old link, who expect the first
// tuner: it lives on at /legacy
const bannerView = ({ model, dispatch, navigate }: HomeViewProps) =>
  model.isBannerShown ? (
    <div
      role='status'
      className='flex items-center justify-center gap-[12px] border-b border-ui-line bg-ui-field px-[16px] py-[8px] text-center text-xs text-ui-ink-muted'
    >
      <span>
        Here from the video or an old link? The first tuner, with its DevTools
        snippet, is now at{' '}
        <Link
          screen={legacyScreen}
          navigate={navigate}
          className='font-medium text-ui-ink underline'
        >
          /legacy
        </Link>
        .
      </span>
      <button
        type='button'
        onClick={() => dispatch({ _tag: 'DismissBanner' })}
        className='shrink-0 text-ui-ink-faint hover:text-ui-ink'
      >
        Dismiss
      </button>
    </div>
  ) : null

export const HomeView = (props: HomeViewProps) => (
  <div className='flex min-h-full flex-col bg-ui-page'>
    {bannerView(props)}
    <main className='flex flex-1 flex-col items-center justify-center gap-[12px] p-[24px] text-center'>
      <h1 className='text-xl font-semibold text-ui-ink'>
        Claude Desktop Theme Tuner
      </h1>
      <p className='max-w-[32rem] text-sm text-ui-ink-muted'>
        Design a theme for the Theme Tuner mod of Claude Code.
      </p>
    </main>
  </div>
)
