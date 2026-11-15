/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import {
  ANCHOR_KEYS,
  type AnchorKey,
  type Backdrop,
  GIT_KEYS,
  type GitKey,
  type Mode,
  ROLE_KEYS,
  type RoleKey,
  type Setup,
} from '../../../../claude-mod/hooks/look'
import { type Screen, legacyScreen } from '../../common/destination'
import { BASE_URL } from '../../common/env'
import { HexInput } from '../../component/hex-input'
import { Link } from '../../component/link'
import {
  BAR,
  Dialog,
  Gear,
  HeaderLinks,
  LINK_BUTTON,
  MENU_ITEM,
  ModeHeader,
  OptionToggle,
  PresetChips,
  SectionTitle,
  TITLE_BAR,
} from '../../component/tuner-ui'
import { claudeMockView } from '../../preview/claude-mock'
import { contrast } from '../../theme/color'
import { presetById as webPresetById } from '../../theme/presets'
import {
  type Look,
  MODES,
  backdropCss,
  claudeTokens,
  codeThemesOf,
  knobValue,
  lookOf,
  presetsOf,
  previewPalette,
} from './look'
import { type CodeTab, type KnobGroup, type Model, type Msg } from './type'
import { canResetMode, themeJson, tunerCommand } from './update'

export interface HomeViewProps {
  model: Model
  dispatch: Dispatcher<Msg>
  navigate: (screen: Screen) => void
}

const MODE_LABELS: Record<Mode, string> = { light: 'Light', dark: 'Dark' }

// The Theme Tuner mod, installed from this repository, which is its
// marketplace
const MARKETPLACE = 'rinn7e/claude-desktop-theme-tuner'
const INSTALL = `/plugin install theme-tuner --marketplace ${MARKETPLACE}`

// What each knob colors in Claude, by its name in Claude
const ANCHOR_INFO: Record<AnchorKey, string> = {
  'surface-0': 'sidebar, page',
  'surface-1': 'chat, cards',
  'surface-2': 'panels',
  'surface-3': 'menus',
  'text-primary': 'messages, titles',
  'text-secondary': 'labels, rows, thinking',
  'text-muted': 'hints, timestamps',
}

const ROLE_INFO: Record<RoleKey, string> = {
  accent: 'links, buttons; keywords',
  danger: 'errors; names',
  success: 'success; strings',
  warning: 'warnings; variables',
  pro: 'plan marks; literals',
}

const GIT_INFO: Record<GitKey, string> = {
  added: 'added lines',
  removed: 'removed lines',
  modified: 'modified files',
  merged: 'merged pull requests',
  closed: 'closed pull requests',
  conflicting: 'conflicting pull requests',
  draft: 'draft pull requests',
}

// Where a value comes from, in words, for a knob the mod sends
const fromWords = (from: string): string =>
  from === 'set'
    ? 'set here'
    : from === 'the preset'
      ? 'from the preset'
      : from.startsWith('set,')
        ? 'set here, made stronger so Claude paints it'
        : from.startsWith('text,')
          ? 'made stronger so Claude paints it'
          : from === 'surface-1'
            ? 'as surface-1'
            : from === 'frame, for the sidebar'
              ? 'from the preset (frame), darker: Claude mixes it with surface-1 into the sidebar'
              : `from the preset (${from})`

const sectionTitle = (title: string, note?: string) => (
  <SectionTitle title={title} note={note} />
)

// For people from the video, a post or an old link, who expect the first
// tuner: it lives on at /legacy
const bannerView = ({ model, dispatch, navigate }: HomeViewProps) =>
  model.isBannerShown ? (
    // Solid orange so nobody misses it; white on orange-700 keeps AA
    // contrast for its small text
    <div
      role='status'
      className='flex items-center justify-between gap-[12px] bg-orange-700 px-[20px] py-[10px] text-xs text-white'
    >
      <span>
        <b className='font-semibold'>
          Claude Desktop Theme Tuner is now updated to work with the new Claude
          mods!
        </b>{' '}
        The old version, with its DevTools snippet, is still at{' '}
        <Link
          screen={legacyScreen}
          navigate={navigate}
          className='font-semibold underline underline-offset-2 hover:text-orange-100'
        >
          /legacy
        </Link>
        .
      </span>
      <button
        type='button'
        onClick={() => dispatch({ _tag: 'DismissBanner' })}
        className='shrink-0 rounded-md px-[8px] py-[2px] text-white/85 hover:bg-white/15 hover:text-white'
      >
        Dismiss
      </button>
    </div>
  ) : null

// ---------- one knob ----------

interface KnobRow {
  knob: KnobGroup
  label: string
  note: string
  // The value sent, or what Claude derives when the knob is not sent
  value: string | undefined
  isSet: boolean
  from: string
  // Why the knob cannot be set, when it cannot
  lockedBecause?: string
}

// A knob as the first tuner draws a color: picker, hex, name and what it
// colors; a knob set over the preset can go back to it
const knobRowView = (dispatch: Dispatcher<Msg>, mode: Mode, row: KnobRow) => {
  const set = (value: string | null) =>
    dispatch({ _tag: 'SetKnob', mode, knob: row.knob, value })
  return (
    <div
      key={row.label}
      className='grid grid-cols-[2rem_5.5rem_1fr] items-center gap-[8px]'
    >
      {row.lockedBecause || row.value === undefined ? (
        <span
          aria-hidden='true'
          className='h-[28px] w-[32px] rounded-md border border-dashed border-ui-line'
        />
      ) : (
        <input
          type='color'
          aria-label={row.label}
          value={row.value}
          onChange={(e) => set(e.target.value)}
          className='h-[28px] w-[32px] cursor-pointer rounded-md border border-ui-line bg-transparent p-0'
        />
      )}
      {row.lockedBecause ? (
        <span className='px-[8px] text-xs text-ui-ink-faint'>derived</span>
      ) : (
        <HexInput
          label={`${row.label} hex`}
          value={row.value ?? ''}
          isEmptyOk
          onChange={(hex) => set(hex)}
        />
      )}
      <span className='flex min-w-0 flex-col'>
        <span className='flex min-w-0 items-baseline gap-[6px]'>
          <span className='truncate font-mono text-xs'>{row.label}</span>
          {row.isSet ? (
            <button
              type='button'
              onClick={() => set(null)}
              title={`Set here; back to what the preset gives`}
              className='shrink-0 text-[0.6875rem] text-ui-brand hover:underline'
            >
              reset
            </button>
          ) : null}
        </span>
        <span
          className='truncate text-[0.6875rem] text-ui-ink-faint'
          title={row.lockedBecause ?? `${row.note}; ${row.from}`}
        >
          {row.lockedBecause ?? row.note}
        </span>
      </span>
    </div>
  )
}

const anchorRows = (look: Look, model: Model, mode: Mode): KnobRow[] => {
  const choice = model.setup[mode] ?? {}
  return ANCHOR_KEYS.map((key) => {
    const sent = look.modes[mode]?.knobs.find((k) => k.knob === key)
    const isSet = choice.anchors?.[key] !== undefined
    // Claude wants surface-2 and surface-3 to match in light mode, and
    // surface-2 is always sent
    const lockedBecause =
      mode === 'light' && key === 'surface-3' && !isSet
        ? 'Menus; light mode uses surface-2'
        : undefined
    return {
      knob: { group: 'anchors', key },
      label: key,
      note: ANCHOR_INFO[key],
      value: sent?.value,
      isSet,
      from: sent ? fromWords(sent.from) : 'derived by Claude',
      lockedBecause,
    }
  })
}

const roleRows = (look: Look, model: Model, mode: Mode): KnobRow[] =>
  ROLE_KEYS.map((key) => {
    const sent = look.modes[mode]?.knobs.find((k) => k.knob === `roles.${key}`)
    return {
      knob: { group: 'roles', key },
      label: `roles.${key}`,
      note: ROLE_INFO[key],
      value:
        sent?.value ??
        look.modes[mode]?.derived[`role-${key}-400`] ??
        // warning has no 400 shade
        look.modes[mode]?.derived[`role-${key}-fill`],
      isSet: model.setup[mode]?.roles?.[key] !== undefined,
      from: sent
        ? sent.from === 'set'
          ? 'set here'
          : 'from the preset (accent)'
        : 'derived by Claude',
    }
  })

const gitRows = (look: Look, model: Model, mode: Mode): KnobRow[] =>
  GIT_KEYS.map((key) => {
    const value = knobValue(look, mode, `git.${key}`)
    return {
      knob: { group: 'git', key },
      label: `git.${key}`,
      note: GIT_INFO[key],
      value: value ?? look.modes[mode]?.derived[`text-git-${key}`],
      isSet: value !== undefined,
      from: value !== undefined ? 'set here' : 'derived by Claude',
    }
  })

// ---------- one mode ----------

const presetView = (model: Model, dispatch: Dispatcher<Msg>, mode: Mode) => {
  const choice = model.setup[mode]
  return (
    <section className='flex flex-col gap-[8px]'>
      {sectionTitle('Presets')}
      <PresetChips
        presets={presetsOf(mode)}
        activeId={choice?.preset}
        onPick={(id) => dispatch({ _tag: 'PickPreset', mode, id })}
      />
    </section>
  )
}

const presetName = (id: string | undefined): string =>
  presetsOf('light')
    .concat(presetsOf('dark'))
    .find((p) => p.id === id)?.name ?? 'Custom'

// The value of the None option: never a code theme id (ids have no colon)
const NO_CODE_THEME = ':none'

const codeThemeView = (model: Model, dispatch: Dispatcher<Msg>, mode: Mode) => {
  const choice = model.setup[mode]
  const fromPreset = presetsOf(mode).find(
    (p) => p.id === choice?.preset,
  )?.codeTheme
  return (
    <section className='flex flex-col gap-[8px]'>
      {sectionTitle(
        'Code theme',
        'The code highlighting. Claude locks its own picker for a mode the theme sets one for.',
      )}
      <select
        aria-label={`${MODE_LABELS[mode]} code theme`}
        value={
          choice?.codeTheme === null ? NO_CODE_THEME : (choice?.codeTheme ?? '')
        }
        onChange={(e) =>
          dispatch({
            _tag: 'SetCodeTheme',
            mode,
            value:
              e.target.value === NO_CODE_THEME
                ? null
                : e.target.value || undefined,
          })
        }
        className='rounded-md border border-ui-line bg-ui-field px-[8px] py-[6px] font-mono text-xs outline-none focus:border-ui-brand'
      >
        <option value=''>
          {fromPreset
            ? `From the preset (${fromPreset})`
            : 'None: the picker of Claude stays free'}
        </option>
        {/* With a preset that has a code theme, None is a choice of its own */}
        {fromPreset || choice?.codeTheme === null ? (
          <option value={NO_CODE_THEME}>
            None: the picker of Claude stays free
          </option>
        ) : null}
        {/* A code theme from pasted JSON that the list does not have */}
        {choice?.codeTheme && !codeThemesOf(mode).includes(choice.codeTheme) ? (
          <option value={choice.codeTheme}>{choice.codeTheme}</option>
        ) : null}
        {codeThemesOf(mode).map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </section>
  )
}

// Whether Claude's refusal is about this mode: its reason names the mode,
// or no mode at all
const refusalOf = (look: Look, mode: Mode): string | null =>
  look.error &&
  (look.error.includes(`${mode} mode`) || !/(light|dark) mode/.test(look.error))
    ? look.error
    : null

// The text pairs the first tuner checks, by the knobs that draw them
const CHECKS: {
  fg: 'text' | 'textSecondary' | 'textMuted' | 'accent'
  bg: 'frame' | 'canvas'
  label: string
  min: number
}[] = [
  { fg: 'text', bg: 'canvas', label: 'text-primary on surface-1', min: 4.5 },
  { fg: 'text', bg: 'frame', label: 'text-primary on surface-0', min: 4.5 },
  {
    fg: 'textSecondary',
    bg: 'canvas',
    label: 'text-secondary on surface-1',
    min: 4.5,
  },
  { fg: 'textMuted', bg: 'canvas', label: 'text-muted on surface-1', min: 3 },
  { fg: 'accent', bg: 'canvas', label: 'roles.accent on surface-1', min: 3 },
]

// Readability, as on the first tuner: the main text pairs and their
// contrast, then what Claude itself says of the mode: a refusal, what the fit
// changed, and the contrast notes it still paints with
const readabilityView = (look: Look, mode: Mode) => {
  const palette = previewPalette(look, mode)
  const refusal = refusalOf(look, mode)
  const notes = look.notes[mode]
  const adjusted = look.adjusted.filter((a) => a.startsWith(mode))
  return (
    <section className='@container flex flex-col gap-[8px]'>
      {sectionTitle('Readability (WCAG)')}
      <div className='grid grid-cols-1 gap-x-[24px] gap-y-[4px] @md:grid-cols-2'>
        {CHECKS.map(({ fg, bg, label, min }) => {
          const ratio = contrast(palette[fg], palette[bg])
          const ok = ratio >= min
          return (
            <div
              key={label}
              className='flex items-center justify-between gap-[8px] text-xs'
            >
              <span className='flex min-w-0 items-center gap-[6px] text-ui-ink-muted'>
                <span
                  className='flex h-[18px] w-[26px] shrink-0 items-center justify-center rounded text-[0.625rem] font-semibold ring-1 ring-black/10'
                  style={{ background: palette[bg], color: palette[fg] }}
                >
                  Aa
                </span>
                <span className='truncate font-mono'>{label}</span>
              </span>
              <span
                className={`shrink-0 font-mono ${ok ? 'text-ui-good' : 'text-ui-bad'}`}
              >
                {ratio.toFixed(1)} {ok ? 'AA' : `below ${min}`}
              </span>
            </div>
          )
        })}
      </div>
      {refusal ? (
        <p
          role='alert'
          className='rounded-md border border-ui-bad px-[10px] py-[6px] text-xs text-ui-ink'
        >
          Claude would paint none of this theme. {refusal}
        </p>
      ) : null}
      {adjusted.map((a, i) => (
        <p key={i} className='text-xs text-ui-ink-muted'>
          The {a}.
        </p>
      ))}
      {notes.length ? (
        <details className='text-xs text-ui-ink-faint'>
          <summary className='cursor-pointer'>
            {notes.length} contrast {notes.length === 1 ? 'note' : 'notes'} from
            Claude (it still paints)
          </summary>
          <ul className='app-scroll mt-[6px] flex max-h-[10rem] list-disc flex-col gap-[2px] overflow-y-auto pl-[18px] text-[0.6875rem]'>
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}

// Every knob of a mode, under the JSON group it goes in, with a way back to
// the preset as on the first tuner
const knobsView = (
  look: Look,
  model: Model,
  dispatch: Dispatcher<Msg>,
  mode: Mode,
) => {
  const anchors = anchorRows(look, model, mode)
  const groups: [string, KnobRow[]][] = [
    ['Surfaces', anchors.filter((r) => r.label.startsWith('surface'))],
    ['Text', anchors.filter((r) => r.label.startsWith('text'))],
    ['Roles', roleRows(look, model, mode)],
    ['Git', gitRows(look, model, mode)],
  ]
  return (
    <section className='@container flex flex-col gap-[14px]'>
      <div className='flex items-center justify-between gap-[8px]'>
        {sectionTitle('Knobs')}
        {canResetMode(model.setup, mode) ? (
          <button
            type='button'
            onClick={() => dispatch({ _tag: 'ResetMode', mode })}
            className='truncate text-xs text-ui-brand hover:underline'
          >
            Reset to {presetName(model.setup[mode]?.preset)}
          </button>
        ) : null}
      </div>
      {/* Each group is a column of its own, two side by side (Surfaces next
          to Text, Roles next to Git), one on narrow screens */}
      <div className='grid grid-cols-1 gap-x-[16px] gap-y-[18px] @md:grid-cols-2'>
        {groups.map(([title, rows]) => (
          <div key={title} className='flex min-w-0 flex-col gap-[8px]'>
            <h3 className='text-xs font-medium text-ui-ink-muted'>{title}</h3>
            {rows.map((row) => knobRowView(dispatch, mode, row))}
          </div>
        ))}
      </div>
    </section>
  )
}

// One mode, as a column: on or off, its preset, then each knob
const modeColumnView = (
  look: Look,
  model: Model,
  dispatch: Dispatcher<Msg>,
  mode: Mode,
) => {
  const isOn = model.setup[mode] !== undefined
  return (
    // Its five parts sit on the rows of the parent grid (subgrid), so each
    // part lines up with the other mode's, whatever their heights; a mode
    // left out keeps the rows, empty
    <div key={mode} className='row-span-5 grid min-w-0 grid-rows-subgrid'>
      <ModeHeader
        label={`${MODE_LABELS[mode]} mode`}
        subtitle={
          !isOn
            ? 'Stock, left as Claude ships it'
            : look.modes[mode]?.isStock
              ? "Claude's own colors"
              : (look.modes[mode]?.resolved.name ?? '')
        }
        isOn={isOn}
        onToggle={() => dispatch({ _tag: 'SetModeOn', mode, isOn: !isOn })}
      />
      {!isOn ? (
        <>
          {/* Picking a preset themes the mode again */}
          <div className='opacity-50'>{presetView(model, dispatch, mode)}</div>
          <div />
          <div />
          <div />
        </>
      ) : (
        <>
          <div className='flex min-w-0 flex-col gap-[8px]'>
            {presetView(model, dispatch, mode)}
            {look.modes[mode]?.isStock ? (
              <p className='text-xs text-ui-ink-muted'>
                Claude&apos;s own colors: the mod leaves this mode to Claude
                until a knob below changes.
              </p>
            ) : null}
          </div>
          {knobsView(look, model, dispatch, mode)}
          {codeThemeView(model, dispatch, mode)}
          {readabilityView(look, mode)}
        </>
      )}
    </div>
  )
}

// ---------- both modes ----------

const DEFAULT_GRADIENT: Backdrop = {
  gradient: { stops: ['#1e1e2e', '#45475a'], angle: 135, shape: 'linear' },
}

const backdropView = (setup: Setup, dispatch: Dispatcher<Msg>) => {
  const backdrop = setup.backdrop
  const set = (b: Backdrop | null) =>
    dispatch({ _tag: 'SetBackdrop', backdrop: b })
  const kind = !backdrop ? 'none' : 'color' in backdrop ? 'color' : 'gradient'
  const tab = (value: typeof kind, label: string, next: Backdrop | null) => (
    <button
      type='button'
      aria-pressed={kind === value}
      onClick={() => (kind === value ? undefined : set(next))}
      className={`rounded-md border px-[10px] py-[4px] text-xs ${
        kind === value
          ? 'border-ui-brand bg-ui-field font-medium text-ui-ink'
          : 'border-ui-line text-ui-ink-muted hover:text-ui-ink'
      }`}
    >
      {label}
    </button>
  )
  return (
    <section className='flex flex-col gap-[8px]'>
      {sectionTitle(
        'Backdrop',
        'What is behind the conversation; the preview draws it there too. Claude also frosts its panels over it.',
      )}
      <div className='flex gap-[6px]'>
        {tab('none', 'None', null)}
        {tab('color', 'Color', { color: '#1e1e2e' })}
        {tab('gradient', 'Gradient', DEFAULT_GRADIENT)}
      </div>
      {backdrop && 'color' in backdrop ? (
        <div className='flex items-center gap-[8px]'>
          {/^#[0-9a-f]{6}$/i.test(backdrop.color) ? (
            <input
              type='color'
              aria-label='Backdrop color'
              value={backdrop.color}
              onChange={(e) => set({ color: e.target.value })}
              className='h-[28px] w-[32px] cursor-pointer rounded-md border border-ui-line bg-transparent p-0'
            />
          ) : (
            <span className='font-mono text-xs text-ui-ink-muted'>
              {backdrop.color}
            </span>
          )}
          <HexInput
            label='Backdrop hex'
            // A design system name (surface-0) from pasted JSON is not a hex
            value={/^#[0-9a-f]{6}$/i.test(backdrop.color) ? backdrop.color : ''}
            isEmptyOk
            onChange={(hex) => set({ color: hex })}
          />
        </div>
      ) : null}
      {backdrop && 'gradient' in backdrop ? (
        <div className='flex flex-col gap-[8px]'>
          <div className='flex flex-wrap items-center gap-[6px]'>
            {backdrop.gradient.stops.map((stop, i) => (
              <span key={i} className='flex items-center gap-[2px]'>
                <input
                  type='color'
                  aria-label={`Gradient color ${i + 1}`}
                  value={stop}
                  onChange={(e) =>
                    set({
                      gradient: {
                        ...backdrop.gradient,
                        stops: backdrop.gradient.stops.map((s, j) =>
                          j === i ? e.target.value : s,
                        ),
                      },
                    })
                  }
                  className='h-[28px] w-[32px] cursor-pointer rounded-md border border-ui-line bg-transparent p-0'
                />
                {backdrop.gradient.stops.length > 2 ? (
                  <button
                    type='button'
                    aria-label={`Remove gradient color ${i + 1}`}
                    onClick={() =>
                      set({
                        gradient: {
                          ...backdrop.gradient,
                          stops: backdrop.gradient.stops.filter(
                            (_, j) => j !== i,
                          ),
                        },
                      })
                    }
                    className='px-[2px] text-xs text-ui-ink-faint hover:text-ui-ink'
                  >
                    x
                  </button>
                ) : null}
              </span>
            ))}
            {backdrop.gradient.stops.length < 16 ? (
              <button
                type='button'
                onClick={() =>
                  set({
                    gradient: {
                      ...backdrop.gradient,
                      stops: [
                        ...backdrop.gradient.stops,
                        backdrop.gradient.stops[
                          backdrop.gradient.stops.length - 1
                        ],
                      ],
                    },
                  })
                }
                className='rounded-md border border-ui-line px-[8px] py-[3px] text-xs text-ui-ink-muted hover:text-ui-ink'
              >
                Add color
              </button>
            ) : null}
          </div>
          <div className='flex items-center gap-[12px] text-xs text-ui-ink-muted'>
            <label className='flex items-center gap-[6px]'>
              Shape
              <select
                value={backdrop.gradient.shape ?? 'linear'}
                onChange={(e) =>
                  set({
                    gradient: {
                      ...backdrop.gradient,
                      shape: e.target.value === 'radial' ? 'radial' : 'linear',
                    },
                  })
                }
                className='rounded-md border border-ui-line bg-ui-field px-[6px] py-[3px] text-xs text-ui-ink'
              >
                <option value='linear'>Linear</option>
                <option value='radial'>Radial</option>
              </select>
            </label>
            {backdrop.gradient.shape === 'radial' ? null : (
              <label className='flex items-center gap-[6px]'>
                Angle
                <input
                  type='number'
                  min={0}
                  max={360}
                  value={backdrop.gradient.angle ?? 180}
                  onChange={(e) => {
                    // An emptied field is being retyped, not an angle of 0
                    if (e.target.value.trim() === '') return
                    const angle = Number(e.target.value)
                    if (Number.isFinite(angle) && angle >= 0 && angle <= 360)
                      set({ gradient: { ...backdrop.gradient, angle } })
                  }}
                  className='w-[4.5rem] rounded-md border border-ui-line bg-ui-field px-[6px] py-[3px] text-xs text-ui-ink'
                />
              </label>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

const bothModesView = (setup: Setup, dispatch: Dispatcher<Msg>) => (
  <div className='flex flex-col gap-[20px] border-t border-ui-line pt-[20px]'>
    <section className='flex flex-col gap-[8px]'>
      {sectionTitle('Both modes')}
      <OptionToggle
        label='More contrast'
        note={
          <>
            Stronger borders and focus rings (
            <code className='font-mono'>contrast: &quot;more&quot;</code>)
          </>
        }
        isOn={setup.contrast === 'more'}
        onToggle={() =>
          dispatch({ _tag: 'SetContrast', isMore: setup.contrast !== 'more' })
        }
      />
    </section>
    {backdropView(setup, dispatch)}
  </div>
)

// The mod API the home was built against
const TESTED_CLAUDE_CODE = '2.1.325'

// The agent guide link's name: what agents listing the page's links read
const AGENT_GUIDE =
  'Guide for AI agents (llms.txt): write the setup JSON and apply it with the mod, without filling in the color fields'

// The settings menu under the gear, as on the first tuner: saving the setup
// to a JSON file, loading one, copying a link to it or the /tuner command,
// and swapping the panes (wide screens only). A click outside or Escape
// closes it.
const settingsMenuView = (model: Model, dispatch: Dispatcher<Msg>) => (
  <div
    className='relative'
    onKeyDown={(e) => {
      if (e.key === 'Escape') dispatch({ _tag: 'CloseMenu' })
    }}
  >
    <button
      type='button'
      title='Settings'
      aria-label='Settings'
      aria-haspopup='menu'
      aria-expanded={model.menuOpen}
      onClick={() => dispatch({ _tag: 'ToggleMenu' })}
      className={LINK_BUTTON}
    >
      <Gear />
    </button>
    {model.menuOpen ? (
      <>
        <div
          className='fixed inset-0 z-10'
          onClick={() => dispatch({ _tag: 'CloseMenu' })}
        />
        <div
          role='menu'
          className='absolute top-[calc(100%+6px)] right-0 z-20 flex w-[13rem] flex-col rounded-lg bg-ui-panel p-[4px] shadow-lg ring-1 ring-ui-line'
        >
          <button
            type='button'
            role='menuitem'
            title='Download the setup JSON as a file'
            onClick={() => dispatch({ _tag: 'SavePreset' })}
            className={`${MENU_ITEM} hover:bg-ui-field`}
          >
            <span aria-hidden='true'>↓</span> Save Preset
          </button>
          {/* A label opens the hidden file picker; choosing a file loads it */}
          <label
            role='menuitem'
            title='Load a setup JSON file'
            className={`${MENU_ITEM} cursor-pointer hover:bg-ui-field`}
          >
            <span aria-hidden='true'>↑</span> Load Preset
            <input
              type='file'
              accept='.json,application/json'
              className='hidden'
              onChange={(e) => {
                const file = e.currentTarget.files?.[0]
                e.currentTarget.value = ''
                if (file) dispatch({ _tag: 'LoadPresetFile', file })
              }}
            />
          </label>
          <button
            type='button'
            role='menuitem'
            title='Copy a link that opens this page with this setup'
            onClick={() => dispatch({ _tag: 'Copy', target: 'link' })}
            className={`${MENU_ITEM} hover:bg-ui-field`}
          >
            <span aria-hidden='true'>🔗</span>{' '}
            {model.copied === 'link' ? 'Copied!' : 'Copy Share Link'}
          </button>
          <button
            type='button'
            role='menuitem'
            title='Copy the /tuner command that applies this setup with the Theme Tuner mod in Claude Code'
            onClick={() => dispatch({ _tag: 'Copy', target: 'command' })}
            className={`${MENU_ITEM} hover:bg-ui-field`}
          >
            <span aria-hidden='true'>⌘</span> Copy /tuner Command
          </button>
          <div className='hidden py-[4px] lg:block' role='separator'>
            <div className='h-px bg-ui-line' />
          </div>
          <button
            type='button'
            role='menuitem'
            autoFocus
            onClick={() => dispatch({ _tag: 'ToggleSwapped' })}
            className={`${MENU_ITEM} hidden hover:bg-ui-field lg:flex`}
          >
            <span aria-hidden='true'>⇄</span> Swap Left/Right Panes
          </button>
        </div>
      </>
    ) : null}
  </div>
)

// The title and what the page does on one line; at the right, who built it,
// the sponsor and source links, and the settings menu
const headerView = (model: Model, dispatch: Dispatcher<Msg>) => (
  <header className={TITLE_BAR}>
    <span className='flex min-w-0 items-center gap-[10px]'>
      {/* The logo lives in public/, served next to the page */}
      <img
        src={`${BASE_URL}logo.svg`}
        alt=''
        width={32}
        height={32}
        className='h-[32px] w-[32px] shrink-0'
      />
      <span className='flex min-w-0 items-baseline gap-[10px] overflow-hidden'>
        <h1 className='shrink-0 text-base font-semibold tracking-tight'>
          Claude Desktop Theme Tuner V2
        </h1>
        <span
          title={`Built against the mod API of Claude Code ${TESTED_CLAUDE_CODE}`}
          className='hidden shrink-0 rounded-md bg-ui-field px-[6px] py-[1px] font-mono text-[0.6875rem] text-ui-ink-muted @xl:inline'
        >
          Claude Code {TESTED_CLAUDE_CODE}
        </span>
        <span className='truncate text-xs text-ui-ink-faint'>
          Pick a theme, tune its knobs, copy the JSON for the mod.
        </span>
      </span>
    </span>
    <div className='flex shrink-0 items-center gap-[8px]'>
      <HeaderLinks agentGuide={AGENT_GUIDE} />
      {settingsMenuView(model, dispatch)}
    </div>
  </header>
)

// The top half of the left: the title bar, the banner, then both modes side
// by side when there is room, and what applies to both
const editorView = (look: Look, props: HomeViewProps) => {
  const { model, dispatch } = props
  return (
    <div className='flex flex-col lg:min-h-0 lg:flex-1'>
      <div className='border-b border-ui-line'>
        {headerView(model, dispatch)}
      </div>
      {bannerView(props)}
      <div className='@container app-scroll flex flex-col gap-[20px] p-[20px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto'>
        <div className='grid grid-cols-1 gap-x-[24px] gap-y-[20px] @2xl:grid-cols-2'>
          {MODES.map((mode) => modeColumnView(look, model, dispatch, mode))}
        </div>
        {bothModesView(model.setup, dispatch)}
      </div>
    </div>
  )
}

// ---------- the code panel ----------

const CODE_TABS: { target: CodeTab; label: string; note: string }[] = [
  {
    target: 'json',
    label: 'Theme JSON',
    note: 'The setup for the mod. Edit it here too: paste a setup, a link or preset ids.',
  },
  {
    target: 'command',
    label: '/tuner command',
    note: 'Send it in a Claude Code session with the mod to apply this setup.',
  },
]

// The bottom half of the left, as the snippet panel of the first tuner: the
// Theme JSON (which can be edited) or the /tuner command, how to apply it,
// and Copy
const codePanelView = (model: Model, dispatch: Dispatcher<Msg>) => {
  const tab = CODE_TABS.find((t) => t.target === model.shown) ?? CODE_TABS[0]
  const isBad =
    model.jsonError !== null ||
    (model.copyFailed !== null && model.copyFailed === tab.target)
  const note = model.jsonError
    ? model.jsonError
    : model.copyFailed === tab.target
      ? 'The browser blocked copying: select the text below and copy it.'
      : tab.note
  return (
    <section className='flex max-h-[32rem] flex-col border-t border-ui-line bg-ui-panel lg:max-h-none lg:min-h-0 lg:flex-1'>
      <div className={BAR}>
        <div className='flex gap-[4px] rounded-lg bg-ui-field p-[3px]'>
          {CODE_TABS.map(({ target, label }) => (
            <button
              key={target}
              type='button'
              onClick={() => dispatch({ _tag: 'ShowCode', target })}
              className={`rounded-md px-[10px] py-[4px] text-xs transition-colors ${
                model.shown === target
                  ? 'bg-[var(--color-panel)] font-medium shadow-sm'
                  : 'text-ui-ink-muted hover:text-ui-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* What the shown text is, between the tabs and the buttons;
            truncated when narrow, in full on hover */}
        <p
          role={model.jsonError ? 'alert' : undefined}
          className={`min-w-0 flex-1 truncate text-xs ${isBad ? 'text-ui-bad' : 'text-ui-ink-faint'}`}
          title={note}
        >
          {note}
        </p>
        <div className='flex items-center gap-[8px]'>
          <button
            type='button'
            onClick={() => dispatch({ _tag: 'OpenHelp' })}
            className='rounded-lg border border-ui-line bg-[var(--color-panel)] px-[12px] py-[6px] text-xs hover:border-ui-ink-faint'
          >
            How to apply
          </button>
          <button
            type='button'
            onClick={() => dispatch({ _tag: 'Copy', target: tab.target })}
            className='rounded-lg bg-ui-brand px-[14px] py-[6px] text-xs font-semibold text-ui-brand-ink hover:opacity-90'
          >
            {model.copied === tab.target ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      {tab.target === 'json' ? (
        <textarea
          aria-label='Theme JSON'
          spellCheck={false}
          value={model.jsonDraft ?? themeJson(model.setup)}
          onChange={(e) => dispatch({ _tag: 'EditJson', text: e.target.value })}
          onBlur={() => dispatch({ _tag: 'LeaveJson' })}
          className={`app-scroll min-h-[12rem] flex-1 resize-none border-t bg-ui-field px-[16px] py-[12px] font-mono text-[0.75rem] leading-relaxed outline-none ${
            model.jsonError ? 'border-ui-bad' : 'border-ui-line'
          }`}
        />
      ) : (
        <pre className='app-scroll min-h-0 flex-1 overflow-auto border-t border-ui-line bg-ui-field px-[16px] py-[12px] font-mono text-[0.75rem] leading-relaxed whitespace-pre-wrap wrap-anywhere'>
          {tunerCommand(model.setup)}
        </pre>
      )}
    </section>
  )
}

// A menu path or key, set apart from the prose around it
const ui = (text: string) => <b className='font-semibold text-ui-ink'>{text}</b>

const code = (text: string) => (
  <code className='rounded bg-ui-panel px-[5px] py-[1px] font-mono text-[0.75rem] text-ui-ink wrap-anywhere'>
    {text}
  </code>
)

// How to apply the setup with the mod, as the first tuner's dialog does for
// its snippet
const helpDialogView = (props: HomeViewProps) => {
  const { model, dispatch, navigate } = props
  if (!model.helpOpen) return null
  const steps: React.ReactNode[] = [
    <span key={1}>
      Install the mod once. In a terminal session run {code(INSTALL)}; in the
      desktop app click {ui('+')} next to the prompt, then {ui('Plugins')},{' '}
      {ui('Add marketplace')} with {code(MARKETPLACE)}, then {ui('Add plugin')}.
    </span>,
    <span key={2}>
      {ui('Copy')} the {ui('/tuner command')} tab and send it in a Claude Code
      session. Or run {code('/tuner')} to open the pane of the mod and paste the{' '}
      {ui('Theme JSON')} in its box, or hand the JSON to Claude and ask it to
      set the theme (the mod gives Claude a {code('set_theme')} tool).
    </span>,
    <span key={3}>
      The theme stays across restarts and shows on mobile too.{' '}
      {code('/tuner off')} goes back to the colors of Claude.
    </span>,
  ]
  return (
    <Dialog
      title='How to apply the theme'
      onClose={() => dispatch({ _tag: 'CloseHelp' })}
    >
      <ol className='flex shrink-0 flex-col divide-y divide-ui-line text-sm text-ui-ink-muted'>
        {steps.map((text, i) => (
          <li key={i} className='flex gap-[12px] py-[16px]'>
            <span className='flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-ui-brand text-xs font-semibold text-ui-brand-ink'>
              {i + 1}
            </span>
            <p className='min-w-0 flex-1 pt-[2px] leading-relaxed'>{text}</p>
          </li>
        ))}
      </ol>
      <div className='flex flex-col gap-[6px] rounded-lg bg-ui-field p-[12px] text-xs text-ui-ink-muted'>
        <span>
          <b className='text-ui-ink'>The whole app?</b> The mod themes Claude
          Code sessions. To theme the Chat tab and the full sidebar too, use the
          DevTools snippet of the{' '}
          <Link
            screen={legacyScreen}
            navigate={navigate}
            className='underline hover:text-ui-ink'
          >
            first tuner
          </Link>
          .
        </span>
      </div>
    </Dialog>
  )
}

// ---------- the previews ----------

// Where the colors of a preset come from, as the first tuner credits them
const creditView = (presetId: string | undefined) => {
  const credit = presetId ? webPresetById(presetId)?.credit : undefined
  return credit ? (
    <span>
      Colors from{' '}
      <a
        href={credit.url}
        target='_blank'
        rel='noreferrer'
        className='underline hover:text-ui-ink'
      >
        {credit.name}
      </a>{' '}
      ({credit.license})
    </span>
  ) : null
}

// One mode's preview: a caption the width of the mock (mode and theme on the
// left, the colors' credit on the right) over the mock, which fills the rest
const previewCardView = (look: Look, model: Model, mode: Mode) => {
  const m = look.modes[mode]
  const isOn = model.setup[mode] !== undefined
  const name =
    !m || !isOn
      ? 'Stock (shown approximately)'
      : m.isStock
        ? "Claude's own colors"
        : m.resolved.name
  return (
    <div key={mode} className='flex min-h-0 w-full flex-col items-center'>
      <div className='flex h-full min-h-0 w-full flex-col'>
        <div className='flex items-center justify-between gap-[12px] px-[16px] text-xs'>
          <span className='flex min-w-0 items-center gap-[8px]'>
            <span className='shrink-0 font-semibold text-ui-ink'>
              {MODE_LABELS[mode]} mode
            </span>
            <span className='truncate text-ui-ink-faint'>{name}</span>
          </span>
          {isOn && refusalOf(look, mode) ? (
            <span className='shrink-0 text-ui-bad'>
              Claude would not paint it
            </span>
          ) : isOn ? (
            <span className='shrink-0 text-ui-ink-faint'>
              {creditView(model.setup[mode]?.preset)}
            </span>
          ) : null}
        </div>
        {/* The mock keeps its desktop proportions; narrow screens scroll it
            sideways. The padding leaves room for its shadow */}
        <div className='app-scroll flex min-h-0 w-full flex-1 overflow-x-auto p-[16px]'>
          {claudeMockView(previewPalette(look, mode), {
            backdrop: backdropCss(model.setup.backdrop),
            tokens: claudeTokens(look, mode),
          })}
        </div>
      </div>
    </div>
  )
}

// Both modes at once, light first: two equal halves of the pane on wide
// screens, stacked on narrow ones
const previewsView = (look: Look, model: Model) => (
  <section className='preview-dots flex flex-col gap-[8px] p-[8px] lg:grid lg:min-h-0 lg:grid-rows-2 lg:gap-[24px] lg:p-[24px]'>
    {MODES.map((mode) => previewCardView(look, model, mode))}
  </section>
)

// Four panels, as on the first tuner: the editor over the code panel on one
// side, the light and dark previews on the other; swapped, the editor moves
// to the right on wide screens
export const HomeView = (props: HomeViewProps) => {
  const { model, dispatch } = props
  const look = lookOf(model.setup)
  return (
    <main className='grid min-h-full grid-cols-1 bg-ui-page lg:h-full lg:grid-cols-2'>
      <aside
        className={`flex flex-col border-ui-line bg-ui-panel lg:min-h-0 ${
          model.swapped ? 'lg:order-last lg:border-l' : 'lg:border-r'
        }`}
      >
        {editorView(look, props)}
        {codePanelView(model, dispatch)}
      </aside>
      {previewsView(look, model)}
      {helpDialogView(props)}
    </main>
  )
}
