/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'

import { type Screen, urlOf } from '../common/destination'

export interface LinkProps {
  screen: Screen
  navigate: (screen: Screen) => void
  className?: string
  children: React.ReactNode
}

// A real anchor: a plain left click moves in the app, a click with a
// modifier key or another button keeps the browser's own behaviour (a new
// tab, copying the link)
export const Link = ({ screen, navigate, className, children }: LinkProps) => (
  <a
    href={urlOf(screen)}
    className={className}
    onClick={(e) => {
      if (
        e.button === 0 &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault()
        navigate(screen)
      }
    }}
  >
    {children}
  </a>
)
