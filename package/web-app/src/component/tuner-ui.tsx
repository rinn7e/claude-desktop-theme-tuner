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
