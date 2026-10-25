/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React, { type CSSProperties } from 'react'

import { type Palette } from '../theme/palette'
import { deriveTokens } from '../theme/tokens'

// A mock of the Claude desktop app (Code tab: sidebar, chat, composer, side
// panel), painted only with Claude's own variables, set from the same tokens
// the snippet writes. What it shows is what the snippet does, as far as a
// mock can.
const tokenStyle = (palette: Palette): CSSProperties => {
  const { root, frame } = deriveTokens(palette)
  return { ...root, ...frame } as CSSProperties
}

const SESSIONS = [
  'api-refactor',
  'theme-tuner',
  'weekend-game',
  'docs-site',
  'release-prep',
  'bug-hunt',
  'design-notes',
]
const SELECTED = 1
const HOVERED = 3

const trafficLightsView = () => (
  <div className='flex items-center gap-[6px]'>
    {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
      <span
        key={c}
        className='h-[10px] w-[10px] rounded-full'
        style={{ background: c }}
      />
    ))}
  </div>
)

const navRowView = (icon: string, label: string) => (
  <div
    key={label}
    className='flex items-center gap-[8px] rounded-md px-[8px] py-[4px] text-[0.75rem] text-[var(--cds-text-secondary)]'
  >
    <span className='w-[12px] text-center text-[var(--cds-text-muted)]'>
      {icon}
    </span>
    {label}
  </div>
)

const sessionRowView = (name: string, i: number) => (
  <div
    key={name}
    className='truncate rounded-md px-[8px] py-[4px] text-[0.75rem]'
    style={{
      background:
        i === SELECTED
          ? 'var(--df-selected)'
          : i === HOVERED
            ? 'var(--df-hover)'
            : undefined,
      color:
        i === SELECTED
          ? 'var(--cds-text-primary)'
          : 'var(--cds-text-secondary)',
    }}
  >
    [{name}]
  </div>
)

const sidebarView = () => (
  <aside className='flex w-[11rem] shrink-0 flex-col gap-[14px] p-[12px] bg-[var(--cds-fizzy-lake-color-sidebar)] border-r border-[var(--cds-border)]'>
    {trafficLightsView()}
    <div className='flex flex-col gap-[2px]'>
      {navRowView('+', 'New')}
      {navRowView('⌕', 'Search')}
      {navRowView('⋯', 'More')}
    </div>
    <div className='flex flex-col gap-[2px]'>
      <div className='px-[8px] pb-[2px] text-[0.6875rem] text-[var(--cds-text-muted)]'>
        Projects ▾
      </div>
      {SESSIONS.map(sessionRowView)}
    </div>
    <div className='flex flex-1 items-end'>
      <div className='flex items-center gap-[8px] px-[8px] text-[0.75rem] text-[var(--cds-text-secondary)]'>
        <span className='flex h-[20px] w-[20px] items-center justify-center rounded-full text-[0.625rem] bg-[var(--cds-bg-neutral-hover)] text-[var(--cds-text-primary)]'>
          Y
        </span>
        You · Max
      </div>
    </div>
  </aside>
)

const topBarView = () => (
  <div className='flex items-center justify-between border-b border-[var(--cds-border)] px-[16px] py-[10px]'>
    <span className='text-[0.8125rem] text-[var(--cds-text-primary)]'>
      [theme-tuner] ▾
    </span>
    <div className='flex items-center gap-[10px] text-[0.75rem] text-[var(--cds-text-muted)]'>
      <span>▤</span>
      <span>›_</span>
      <span>⊕</span>
    </div>
  </div>
)

const chatView = () => (
  <div className='mock-scroll flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[24px] py-[18px] text-[0.8125rem] leading-relaxed'>
    <div className='flex justify-end'>
      <div className='max-w-[80%] rounded-xl px-[12px] py-[8px] bg-[var(--cds-bg-user-message)] text-[var(--cds-text-primary)]'>
        the docked sidebar is still white, can you fix it?
      </div>
    </div>
    <div className='flex flex-col gap-[8px] text-[var(--cds-text-primary)]'>
      {/* Claude draws its thinking in the secondary color, so the preview
          shows how far it sits from the reply */}
      <span className='text-[0.75rem] text-[var(--cds-text-muted)]'>
        Thought for 8s ⌄
      </span>
      <p className='text-[var(--cds-text-secondary)]'>
        The sidebar is themed, so something paints over it when docked. Let me
        check which variable the docked state reads.
      </p>
      {/* An expanded tool group: one command open, the other collapsed */}
      <span className='text-[0.75rem] text-[var(--cds-text-muted)]'>
        Ran 2 commands ▾
      </span>
      <div className='rounded-lg border border-[var(--cds-border)] text-[0.75rem]'>
        <div className='flex flex-col gap-[6px] px-[12px] py-[8px]'>
          <span className='text-[var(--cds-text-secondary)]'>
            Searched the sidebar styles ▾
          </span>
          <code className='font-mono text-[0.6875rem] text-[var(--cds-text-primary)]'>
            $ grep -rn "sidebar-tint" src
          </code>
          <code className='font-mono text-[0.6875rem] text-[var(--cds-text-secondary)]'>
            src/sidebar.css:12: --df-sidebar-tint
          </code>
        </div>
        <div className='border-t border-[var(--cds-border)] px-[12px] py-[6px] text-[var(--cds-text-secondary)]'>
          Checked the docked layout ▸
        </div>
      </div>
      <p>
        Found it: the docked sidebar mixes{' '}
        <code className='rounded px-[4px] py-[1px] text-[0.75rem] bg-[var(--cds-bg-neutral)]'>
          --df-sidebar-tint
        </code>{' '}
        into its color. See the{' '}
        <span className='underline text-[var(--cds-text-accent)]'>
          Chromium source
        </span>{' '}
        for how vibrancy paints it.
      </p>
      <div className='rounded-lg border border-[var(--cds-border)] bg-[var(--cds-surface-3)] px-[12px] py-[8px] font-mono text-[0.6875rem] text-[var(--cds-text-secondary)]'>
        17afa84 Fix the docked sidebar of the Claude desktop theme
      </div>
      <p className='text-[var(--cds-text-secondary)]'>
        It's committed and pushed, and the tree is clean.
      </p>
    </div>
  </div>
)

const composerView = () => (
  <div className='px-[24px] pb-[16px]'>
    <div className='flex flex-col gap-[10px] rounded-2xl border border-[var(--cds-border-strong)] bg-[var(--cds-surface-3)] px-[14px] py-[10px]'>
      <span className='text-[0.8125rem] text-[var(--cds-text-muted)]'>
        Type / for commands
      </span>
      <div className='flex items-center justify-between'>
        <span className='rounded-md px-[8px] py-[2px] text-[0.6875rem] bg-[var(--cds-bg-accent)] text-[var(--cds-text-accent)]'>
          Auto
        </span>
        <span className='flex h-[24px] w-[24px] items-center justify-center rounded-lg text-[0.75rem] bg-[var(--cds-role-accent-400)] text-[var(--cds-on-accent)]'>
          ↑
        </span>
      </div>
    </div>
  </div>
)

const panelCardView = (title: string, body: React.ReactNode) => (
  <div
    key={title}
    className='flex flex-col gap-[8px] rounded-lg border border-[var(--cds-border)] bg-[var(--cds-surface-panel)] p-[10px]'
  >
    <span className='text-[0.6875rem] font-medium text-[var(--cds-text-primary)]'>
      {title} ▾
    </span>
    {body}
  </div>
)

const sidePanelView = () => (
  <div className='flex w-[9.5rem] shrink-0 flex-col gap-[10px] border-l border-[var(--cds-border)] p-[10px]'>
    {panelCardView(
      'Environment',
      <div className='flex flex-col gap-[4px] text-[0.6875rem] text-[var(--cds-text-secondary)]'>
        <span>This computer</span>
        <span>theme-tuner</span>
        <span>master</span>
      </div>,
    )}
    {panelCardView(
      'Context',
      <div className='flex flex-col gap-[6px] text-[0.6875rem] text-[var(--cds-text-secondary)]'>
        <span>29% used</span>
        <div className='h-[4px] overflow-hidden rounded-full bg-[var(--cds-bg-neutral-hover)]'>
          <div className='h-full w-[29%] bg-[var(--cds-role-accent-400)]' />
        </div>
        <span className='text-[var(--cds-text-muted)]'>Messages 25.5%</span>
      </div>,
    )}
  </div>
)

export const claudeMockView = (palette: Palette) => (
  <div
    className='flex h-[28rem] w-full min-w-[38rem] shrink-0 overflow-hidden lg:h-full rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/10 bg-[var(--cds-surface-1)]'
    style={tokenStyle(palette)}
  >
    {sidebarView()}
    <main className='flex min-w-0 flex-1 flex-col'>
      {topBarView()}
      {chatView()}
      {composerView()}
    </main>
    {sidePanelView()}
  </div>
)
