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
// The variables the mock paints with: derived from the palette (as the
// snippet sets them), with any design system tokens given on top (preview v2
// passes the ones Claude computes for a mod look)
const tokenStyle = (
  palette: Palette,
  tokens: Record<string, string> = {},
): CSSProperties => {
  const { root, frame } = deriveTokens(palette)
  return { ...root, ...frame, ...tokens } as CSSProperties
}

// Preview v2 (the home) shows every knob a mod look sets: a diff and pull
// request states for the git colors, status marks for the roles, a Pro chip,
// and code in the colors of the code theme
export interface CodeColors {
  fg: string
  comment: string
  keyword: string
  storage: string
  string: string
  number: string
  func: string
  type: string
  variable: string
}

export interface Showcase {
  code: CodeColors
  // The name of the code theme, shown on the code block
  codeTheme: string
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

// A disclosure arrow, open (down) or closed (right): Claude's filled
// triangle, or with the Thin arrows option its thin chevron, which Claude
// turns a quarter for open rows (src/theme/arrows.ts)
const caretView = (open: boolean, thin: boolean) =>
  thin ? (
    <span
      aria-hidden='true'
      className='inline-block'
      style={{ rotate: open ? '90deg' : '0deg' }}
    >
      ›
    </span>
  ) : (
    <span aria-hidden='true'>{open ? '▾' : '▸'}</span>
  )

const sidebarView = (thin: boolean, showcase?: Showcase) => (
  <aside className='flex w-[11rem] shrink-0 flex-col gap-[14px] p-[12px] bg-[var(--cds-fizzy-lake-color-sidebar)] border-r border-[var(--cds-border)]'>
    {trafficLightsView()}
    <div className='flex flex-col gap-[2px]'>
      {navRowView('+', 'New')}
      {navRowView('⌕', 'Search')}
      {navRowView('⋯', 'More')}
    </div>
    <div className='flex flex-col gap-[2px]'>
      <div className='px-[8px] pb-[2px] text-[0.6875rem] text-[var(--cds-text-muted)]'>
        Projects {caretView(true, thin)}
      </div>
      {SESSIONS.map(sessionRowView)}
    </div>
    <div className='flex flex-1 items-end'>
      <div className='flex items-center gap-[8px] px-[8px] text-[0.75rem] text-[var(--cds-text-secondary)]'>
        <span className='flex h-[20px] w-[20px] items-center justify-center rounded-full text-[0.625rem] bg-[var(--cds-bg-neutral-hover)] text-[var(--cds-text-primary)]'>
          Y
        </span>
        You · Max
        {showcase ? (
          <span className='rounded px-[4px] text-[0.5625rem] font-semibold bg-[var(--cds-bg-pro)] text-[var(--cds-text-pro)]'>
            Pro
          </span>
        ) : null}
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

// An edit, as Claude shows one: the file, its counts, and the lines
const diffView = () => {
  const line = (kind: 'added' | 'removed', text: string) => (
    <div
      key={text}
      className='flex gap-[8px] px-[12px] text-[var(--cds-text-primary)]'
      style={{ background: `var(--cds-bg-git-${kind})` }}
    >
      <span style={{ color: `var(--cds-text-git-${kind})` }}>
        {kind === 'added' ? '+' : '-'}
      </span>
      {text}
    </div>
  )
  return (
    <div className='overflow-hidden rounded-lg border border-[var(--cds-border)] text-[0.75rem]'>
      <div className='flex justify-between px-[12px] py-[6px] text-[var(--cds-text-secondary)]'>
        <span className='font-mono text-[0.6875rem]'>src/sidebar.css</span>
        <span className='font-mono text-[0.6875rem]'>
          <span className='text-[var(--cds-text-git-added)]'>+1</span>{' '}
          <span className='text-[var(--cds-text-git-removed)]'>-1</span>
        </span>
      </div>
      <div className='flex flex-col border-t border-[var(--cds-border)] py-[4px] font-mono text-[0.6875rem]'>
        {line('removed', 'background: var(--df-sidebar-tint);')}
        {line('added', 'background: var(--df-sidebar-bg);')}
      </div>
    </div>
  )
}

// Code in the colors of the code theme of the look
const codeBlockView = ({ code, codeTheme }: Showcase) => {
  const t = (color: keyof CodeColors, text: string) => (
    <span style={{ color: code[color] }}>{text}</span>
  )
  return (
    <div className='rounded-lg border border-[var(--cds-border)] bg-[var(--cds-surface-3)] px-[12px] py-[6px] font-mono text-[0.6875rem] leading-relaxed'>
      {/* Two lines with every kind of code the code theme colors; the name
          of the code theme on the right of the comment */}
      <div style={{ color: code.fg }}>
        <div className='flex justify-between gap-[8px]'>
          {t('comment', '// Mix the frame into the sidebar')}
          <span className='truncate font-sans text-[0.625rem] text-[var(--cds-text-muted)]'>
            {codeTheme}
          </span>
        </div>
        <div className='truncate'>
          {t('keyword', 'export')} {t('storage', 'const')} {t('variable', 'bg')}
          : {t('type', 'Color')} = {t('func', 'mix')}({t('variable', 'fg')},{' '}
          {t('string', "'#eee'")}, {t('number', '0.5')})
        </div>
      </div>
    </div>
  )
}

const legacyChatView = (thin: boolean) => (
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
        Thought for 8s {caretView(true, thin)}
      </span>
      <p className='text-[var(--cds-text-secondary)]'>
        The sidebar is themed, so something paints over it when docked. Let me
        check which variable the docked state reads.
      </p>
      {/* An expanded tool group: one command open, the other collapsed */}
      <span className='text-[0.75rem] text-[var(--cds-text-muted)]'>
        Ran 2 commands {caretView(true, thin)}
      </span>
      <div className='rounded-lg border border-[var(--cds-border)] text-[0.75rem]'>
        <div className='flex flex-col gap-[6px] px-[12px] py-[8px]'>
          <span className='text-[var(--cds-text-secondary)]'>
            Searched the sidebar styles {caretView(true, thin)}
          </span>
          <code className='font-mono text-[0.6875rem] text-[var(--cds-text-primary)]'>
            $ grep -rn "sidebar-tint" src
          </code>
          <code className='font-mono text-[0.6875rem] text-[var(--cds-text-secondary)]'>
            src/sidebar.css:12: --df-sidebar-tint
          </code>
        </div>
        <div className='border-t border-[var(--cds-border)] px-[12px] py-[6px] text-[var(--cds-text-secondary)]'>
          Checked the docked layout {caretView(false, thin)}
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

// Preview v2: the same session, shorter, with an edit (the git colors) and
// code (the code theme), so every knob shows without scrolling
const showcaseChatView = (showcase: Showcase) => (
  <div className='mock-scroll flex min-h-0 flex-1 flex-col gap-[10px] overflow-y-auto px-[24px] py-[12px] text-[0.8125rem] leading-relaxed'>
    <div className='flex justify-end'>
      <div className='max-w-[80%] rounded-xl px-[12px] py-[6px] bg-[var(--cds-bg-user-message)] text-[var(--cds-text-primary)]'>
        the docked sidebar is still white, can you fix it?
      </div>
    </div>
    <div className='flex flex-col gap-[8px] text-[var(--cds-text-primary)]'>
      <p className='text-[var(--cds-text-secondary)]'>
        It mixes{' '}
        <code className='rounded px-[4px] py-[1px] text-[0.75rem] bg-[var(--cds-bg-neutral)] text-[var(--cds-text-primary)]'>
          --df-sidebar-tint
        </code>{' '}
        in, see the{' '}
        <span className='underline text-[var(--cds-text-accent)]'>
          Chromium source
        </span>
        .
      </p>
      {diffView()}
      {codeBlockView(showcase)}
    </div>
  </div>
)

const chatView = (thin: boolean, showcase?: Showcase) =>
  showcase ? showcaseChatView(showcase) : legacyChatView(thin)

const composerView = () => (
  <div className='px-[24px] pb-[16px]'>
    <div className='flex flex-col gap-[10px] rounded-2xl border border-[var(--cds-border-strong)] bg-[var(--mock-composer,var(--cds-surface-3))] px-[14px] py-[10px]'>
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

const panelCardView = (title: string, body: React.ReactNode, thin: boolean) => (
  <div
    key={title}
    className='flex flex-col gap-[8px] rounded-lg border border-[var(--cds-border)] bg-[var(--cds-surface-panel)] p-[10px]'
  >
    <span className='text-[0.6875rem] font-medium text-[var(--cds-text-primary)]'>
      {title} {caretView(true, thin)}
    </span>
    {body}
  </div>
)

// The changes of the session and the state of its pull request, in the git
// colors
const changesCardView = (thin: boolean) =>
  panelCardView(
    'Changes',
    <div className='flex flex-col gap-[6px] text-[0.6875rem] text-[var(--cds-text-secondary)]'>
      <span className='font-mono'>
        <span className='text-[var(--cds-text-git-added)]'>+12</span>{' '}
        <span className='text-[var(--cds-text-git-removed)]'>-3</span>
      </span>
      <span>
        <span className='font-mono text-[var(--cds-text-git-modified)]'>M</span>{' '}
        sidebar.css
      </span>
      <div className='flex flex-wrap gap-[4px]'>
        {(
          [
            ['added', 'Open'],
            ['merged', 'Merged'],
            ['closed', 'Closed'],
            ['draft', 'Draft'],
            ['conflicting', 'Conflict'],
          ] as const
        ).map(([state, label]) => (
          <span
            key={state}
            className='rounded px-[4px] text-[0.5625rem]'
            style={{
              background: `var(--cds-bg-git-${state})`,
              color: `var(--cds-text-git-${state})`,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>,
    thin,
  )

// What a run ended with, in the role colors
const checksCardView = (thin: boolean) =>
  panelCardView(
    'Checks',
    <div className='flex flex-col items-start gap-[4px] text-[0.6875rem]'>
      {(
        [
          ['success', '✓ 12 passed'],
          ['danger', '✕ 1 failed'],
          ['warning', '! 2 warnings'],
        ] as const
      ).map(([role, text]) => (
        <span
          key={role}
          className='rounded px-[5px]'
          style={{
            background: `var(--cds-bg-${role})`,
            color: `var(--cds-text-${role})`,
          }}
        >
          {text}
        </span>
      ))}
    </div>,
    thin,
  )

const sidePanelView = (thin: boolean, showcase?: Showcase) => (
  <div className='flex w-[9.5rem] shrink-0 flex-col gap-[10px] border-l border-[var(--cds-border)] p-[10px]'>
    {showcase ? changesCardView(thin) : null}
    {showcase ? checksCardView(thin) : null}
    {showcase
      ? null
      : panelCardView(
          'Environment',
          <div className='flex flex-col gap-[4px] text-[0.6875rem] text-[var(--cds-text-secondary)]'>
            <span>This computer</span>
            <span>theme-tuner</span>
            <span>master</span>
          </div>,
          thin,
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
      thin,
    )}
  </div>
)

// `fill` takes the parent's height at any width (the screenshot view);
// otherwise a fixed height on narrow screens, where the panes stack.
// `thinArrows` draws the arrows the way the Thin arrows option does.
// `backdrop` (a CSS background) is drawn behind the conversation, where a
// mod look's backdrop shows. `tokens` (CSS variables) win over the ones the
// palette gives. `showcase` (preview v2) swaps parts of the session for ones
// that show the git colors, the roles and the code theme
export const claudeMockView = (
  palette: Palette,
  {
    fill = false,
    thinArrows = false,
    backdrop,
    tokens,
    showcase,
  }: {
    fill?: boolean
    thinArrows?: boolean
    backdrop?: string
    tokens?: Record<string, string>
    showcase?: Showcase
  } = {},
) => (
  <div
    className={`flex ${fill ? 'h-full' : 'h-[28rem] lg:h-full'} w-full min-w-[38rem] shrink-0 overflow-hidden rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/10 bg-[var(--cds-surface-1)]`}
    style={tokenStyle(palette, tokens)}
  >
    {sidebarView(thinArrows, showcase)}
    {/* A div, not <main>: the page's main content is the tuner, and text
        readers (and agents) that pick <main> should land there */}
    <div
      className='flex min-w-0 flex-1 flex-col'
      style={backdrop ? { background: backdrop } : undefined}
    >
      {topBarView()}
      {chatView(thinArrows, showcase)}
      {composerView()}
    </div>
    {sidePanelView(thinArrows, showcase)}
  </div>
)
