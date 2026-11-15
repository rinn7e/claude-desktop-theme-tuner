/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
// The controls both tuners share, so the home and /legacy look alike
import React from 'react'

import { type Palette } from '../theme/palette'

export const SectionTitle = ({
  title,
  note,
}: {
  title: string
  note?: string
}) => (
  <div className='flex flex-col gap-[2px]'>
    <h2 className='text-xs font-semibold tracking-wide text-ui-ink-faint uppercase'>
      {title}
    </h2>
    {note ? <p className='text-xs text-ui-ink-faint'>{note}</p> : null}
  </div>
)

// The card at the top of a mode's column: its name, what it shows, and
// whether the theme sets it
export const ModeHeader = ({
  label,
  subtitle,
  isOn,
  onToggle,
}: {
  label: string
  subtitle: string
  isOn: boolean
  onToggle: () => void
}) => (
  <label className='flex cursor-pointer items-center justify-between gap-[12px] rounded-lg bg-ui-field px-[12px] py-[10px]'>
    <span className='flex min-w-0 flex-col gap-[2px]'>
      <span className='text-sm font-semibold'>{label}</span>
      <span className='truncate text-xs text-ui-ink-faint'>{subtitle}</span>
    </span>
    <input
      type='checkbox'
      aria-label={`Theme ${label.toLowerCase()}`}
      checked={isOn}
      onChange={onToggle}
      className='h-[18px] w-[18px] shrink-0 accent-ui-brand'
    />
  </label>
)

// An option for both modes, on or off
export const OptionToggle = ({
  label,
  note,
  isOn,
  onToggle,
}: {
  label: string
  note: React.ReactNode
  isOn: boolean
  onToggle: () => void
}) => (
  <label className='flex cursor-pointer items-center justify-between gap-[12px] rounded-lg border border-ui-line px-[12px] py-[10px]'>
    <span className='flex flex-col gap-[2px]'>
      <span className='text-sm font-medium'>{label}</span>
      <span className='text-xs text-ui-ink-faint'>{note}</span>
    </span>
    <input
      type='checkbox'
      checked={isOn}
      onChange={onToggle}
      className='h-[18px] w-[18px] shrink-0 accent-ui-brand'
    />
  </label>
)

type SwatchColors = Pick<Palette, 'canvas' | 'frame' | 'text' | 'accent'>

interface ChipPreset {
  id: string
  name: string
  palette: SwatchColors
}

const swatchView = (palette: SwatchColors) => (
  <span className='flex h-[14px] w-[40px] shrink-0 overflow-hidden rounded-full ring-1 ring-black/10'>
    {(['canvas', 'frame', 'text', 'accent'] as const).map((k) => (
      <span key={k} className='flex-1' style={{ background: palette[k] }} />
    ))}
  </span>
)

// The presets of a mode as chips, each with a swatch of its colors
export const PresetChips = ({
  presets,
  activeId,
  onPick,
}: {
  presets: readonly ChipPreset[]
  activeId: string | undefined
  onPick: (id: string) => void
}) => (
  <div className='flex flex-wrap gap-[6px]'>
    {presets.map((t) => {
      const active = t.id === activeId
      return (
        <button
          key={t.id}
          type='button'
          onClick={() => onPick(t.id)}
          aria-pressed={active}
          className={`flex items-center gap-[6px] rounded-full border py-[4px] pr-[10px] pl-[5px] text-xs transition-colors ${
            active
              ? 'border-ui-brand bg-ui-field ring-1 ring-ui-brand'
              : 'border-ui-line hover:border-ui-ink-faint'
          }`}
        >
          {swatchView(t.palette)}
          {/* An invisible bold copy keeps the width of the selected (bold)
              name, so picking a chip does not shift its row */}
          <span className='grid'>
            <span
              aria-hidden='true'
              className='invisible col-start-1 row-start-1 font-medium'
            >
              {t.name}
            </span>
            <span
              className={`col-start-1 row-start-1 ${active ? 'font-medium' : ''}`}
            >
              {t.name}
            </span>
          </span>
        </button>
      )
    })}
  </div>
)

// The two panel bars (the editor's title bar and the code panel's tab bar)
// share one shape, so they are the same height
export const BAR =
  'flex min-h-[56px] flex-wrap items-center justify-between gap-[12px] px-[20px] py-[8px]'
// The title bar keeps to one line: the subtitle truncates instead of wrapping
export const TITLE_BAR =
  '@container flex min-h-[56px] items-center justify-between gap-[12px] px-[20px] py-[8px]'

export const LINK_BUTTON =
  'flex items-center gap-[6px] rounded-lg border border-ui-line bg-ui-panel px-[12px] py-[6px] text-xs whitespace-nowrap hover:border-ui-ink-faint'

export const MENU_ITEM =
  'flex w-full items-center gap-[8px] rounded-md px-[10px] py-[6px] text-left text-xs whitespace-nowrap'

// The GitHub mark, for the source link
const GithubMark = () => (
  <svg
    aria-hidden='true'
    viewBox='0 0 16 16'
    className='h-[14px] w-[14px] fill-current'
  >
    <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' />
  </svg>
)

// A gear: eight teeth around a ring
export const Gear = () => (
  <svg
    aria-hidden='true'
    viewBox='0 0 16 16'
    className='h-[14px] w-[14px] fill-current'
  >
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <rect
        key={angle}
        x='6.75'
        y='0.5'
        width='2.5'
        height='3.5'
        rx='0.75'
        transform={`rotate(${angle} 8 8)`}
      />
    ))}
    <circle
      cx='8'
      cy='8'
      r='4.25'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
    />
  </svg>
)

// At the right of the title bar: the agent guide, who built the tuner, and
// the sponsor and source links
export const HeaderLinks = ({ agentGuide }: { agentGuide: string }) => (
  <>
    {/* A real link on purpose: an agent driving a browser reads the
          rendered links (not index.html's head), so this is how it finds the
          guide. Quiet text beside "Built by", but visible at every width:
          tools that list a page's links skip one with nothing visible */}
    <span className='flex items-center gap-[6px] text-xs whitespace-nowrap text-ui-ink-faint'>
      <a
        href={`${import.meta.env.BASE_URL}llms.txt`}
        target='_blank'
        rel='noreferrer'
        aria-label={agentGuide}
        title={agentGuide}
        className='text-ui-ink-muted hover:text-ui-ink hover:underline'
      >
        Agent guide
      </a>
      <span className='hidden @4xl:inline'>
        · Built by{' '}
        <a
          href='https://github.com/rinn7e'
          target='_blank'
          rel='noreferrer'
          className='text-ui-ink-muted hover:text-ui-ink hover:underline'
        >
          rinn7e
        </a>
      </span>
    </span>
    <a
      href='https://github.com/sponsors/rinn7e'
      target='_blank'
      rel='noreferrer'
      title='Like the tuner? Help keep it going by sponsoring rinn7e on GitHub'
      className={LINK_BUTTON}
    >
      <span aria-hidden='true' className='text-[#db2777]'>
        ♥
      </span>
      <span className='hidden @3xl:inline'>Sponsor</span>
    </a>
    <a
      href='https://github.com/rinn7e/claude-desktop-theme-tuner'
      target='_blank'
      rel='noreferrer'
      title='Source code on GitHub'
      className={LINK_BUTTON}
    >
      <GithubMark />
      <span className='hidden @3xl:inline'>Source</span>
    </a>
  </>
)

// A dialog over a backdrop; closes on the backdrop, the Close button or
// Escape
export const Dialog = ({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) => (
  <div
    className='fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-[16px]'
    onClick={onClose}
  >
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='dialog-title'
      className='flex max-h-full w-full max-w-[40rem] flex-col gap-[14px] app-scroll overflow-y-auto rounded-xl bg-ui-panel p-[22px] shadow-2xl ring-1 ring-ui-line'
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className='flex items-center justify-between'>
        <h2 id='dialog-title' className='text-base font-semibold'>
          {title}
        </h2>
        <button
          type='button'
          autoFocus
          onClick={onClose}
          className='rounded-md px-[8px] py-[2px] text-sm text-ui-ink-faint hover:text-ui-ink'
        >
          Close
        </button>
      </div>
      {children}
    </div>
  </div>
)

// The logo of the tuner with a badge on its corner that names the version
// (V2 on the home, legacy on the first tuner). The logo lives in public/,
// served next to the page
export const LogoBadge = ({ badge }: { badge: string }) => (
  <span className='relative shrink-0'>
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt=''
      width={32}
      height={32}
      className='h-[32px] w-[32px]'
    />
    <span className='absolute -right-[6px] -bottom-[4px] rounded-full bg-ui-ink px-[4px] py-px text-[0.5625rem] leading-none font-semibold text-ui-page ring-2 ring-ui-panel'>
      {badge}
    </span>
  </span>
)
