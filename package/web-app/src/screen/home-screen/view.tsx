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
  ModeHeader,
  OptionToggle,
  PresetChips,
  SectionTitle,
} from '../../component/tuner-ui'
import { claudeMockView } from '../../preview/claude-mock'
import {
  type Look,
  MODES,
  codeThemesOf,
  knobValue,
  lookOf,
  presetsOf,
  previewPalette,
} from './look'
import { type CopyTarget, type KnobGroup, type Model, type Msg } from './type'
import { canResetMode, themeJson } from './update'

export interface HomeViewProps {
  model: Model
  dispatch: Dispatcher<Msg>
  navigate: (screen: Screen) => void
}

const MODE_LABELS: Record<Mode, string> = { light: 'Light', dark: 'Dark' }

const INSTALL =
  '/plugin install theme-tuner --marketplace rinn7e/claude-desktop-theme-tuner'
const README =
  'https://github.com/rinn7e/claude-desktop-theme-tuner#theme-claude-code-with-the-mod'

// What each knob colors in Claude, by its name in Claude
const ANCHOR_INFO: Record<AnchorKey, string> = {
  'surface-0': 'Sidebar and page, the darkest surface',
  'surface-1': 'Conversation and cards',
  'surface-2': 'Panels',
  'surface-3': 'Menus',
  'text-primary': 'The strongest text',
  'text-secondary': 'Labels, list rows, thinking',
  'text-muted': 'Hints, timestamps',
}

const ROLE_INFO: Record<RoleKey, string> = {
  accent: 'Links, buttons, focus; code keywords',
  danger: 'Errors; code names',
  success: 'Success marks; code strings',
  warning: 'Warnings; code variables',
  pro: 'Plan marks; code literals',
}

const GIT_INFO: Record<GitKey, string> = {
  added: 'Added lines',
  removed: 'Removed lines',
  modified: 'Modified files',
  merged: 'Merged pull requests',
  closed: 'Closed pull requests',
  conflicting: 'Conflicting pull requests',
  draft: 'Draft pull requests',
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
            : `from the preset (${from})`

const sectionTitle = (title: string, note?: string) => (
  <SectionTitle title={title} note={note} />
)

// For people from the video, a post or an old link, who expect the first
// tuner: it lives on at /legacy
const bannerView = ({ model, dispatch, navigate }: HomeViewProps) =>
  model.isBannerShown ? (
    <div
      role='status'
      className='flex items-center justify-between gap-[12px] border-b border-ui-line bg-ui-field px-[20px] py-[8px] text-xs text-ui-ink-muted'
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

const knobRowView = (dispatch: Dispatcher<Msg>, mode: Mode, row: KnobRow) => {
  const set = (value: string | null) =>
    dispatch({ _tag: 'SetKnob', mode, knob: row.knob, value })
  const id = `${row.knob.group}.${row.knob.key}`
  return (
    <div
      key={id}
      className='grid grid-cols-[2rem_5.5rem_1fr_auto] items-center gap-[8px]'
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
          className={`h-[28px] w-[32px] cursor-pointer rounded-md border border-ui-line bg-transparent p-0 ${
            row.isSet ? '' : 'opacity-80'
          }`}
        />
      )}
      {row.lockedBecause ? (
        <span className='text-xs text-ui-ink-faint'>derived</span>
      ) : (
        <HexInput
          label={`${row.label} hex`}
          value={row.value ?? ''}
          isEmptyOk
          onChange={(hex) => set(hex)}
        />
      )}
      <span className='flex min-w-0 flex-col'>
        <span className='truncate font-mono text-xs text-ui-ink'>
          {row.label}
        </span>
        <span
          className='truncate text-[0.6875rem] text-ui-ink-faint'
          title={row.lockedBecause ?? `${row.note}; ${row.from}`}
        >
          {row.lockedBecause ?? `${row.note}; ${row.from}`}
        </span>
      </span>
      {row.isSet ? (
        <button
          type='button'
          onClick={() => set(null)}
          title='Back to what the preset gives'
          className='rounded-md px-[6px] py-[2px] text-[0.6875rem] text-ui-ink-faint hover:bg-ui-field hover:text-ui-ink'
        >
          Reset
        </button>
      ) : (
        <span />
      )}
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
        ? 'Menus: in light mode Claude draws them with surface-2'
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

const nameView = (model: Model, dispatch: Dispatcher<Msg>, mode: Mode) => {
  const choice = model.setup[mode]
  return (
    <section className='flex flex-col gap-[8px]'>
      {sectionTitle('label', 'The name in the pickers of Claude.')}
      <input
        type='text'
        aria-label={`${MODE_LABELS[mode]} label`}
        maxLength={60}
        value={choice?.name ?? ''}
        placeholder={presetName(choice?.preset)}
        onChange={(e) =>
          dispatch({ _tag: 'SetName', mode, name: e.target.value })
        }
        className='rounded-md border border-ui-line bg-ui-field px-[8px] py-[5px] text-sm text-ui-ink outline-none focus:border-ui-brand'
      />
    </section>
  )
}

const presetName = (id: string | undefined): string =>
  presetsOf('light')
    .concat(presetsOf('dark'))
    .find((p) => p.id === id)?.name ?? 'Custom'

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
        value={choice?.codeTheme ?? ''}
        onChange={(e) =>
          dispatch({
            _tag: 'SetCodeTheme',
            mode,
            value: e.target.value || null,
          })
        }
        className='rounded-md border border-ui-line bg-ui-field px-[8px] py-[6px] font-mono text-xs outline-none focus:border-ui-brand'
      >
        <option value=''>
          {fromPreset
            ? `From the preset (${fromPreset})`
            : 'None: the picker of Claude stays free'}
        </option>
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

// What Claude makes of the mode: a refusal, what the fit changed, and the
// contrast notes it still paints with
const statusView = (look: Look, mode: Mode) => {
  const refusal = refusalOf(look, mode)
  const notes = look.notes[mode]
  const adjusted = look.adjusted.filter((a) => a.startsWith(mode))
  if (!refusal && !adjusted.length && !notes.length) return null
  return (
    <div className='flex flex-col gap-[6px] text-xs'>
      {refusal ? (
        <p
          role='alert'
          className='rounded-md border border-ui-bad px-[10px] py-[6px] text-ui-ink'
        >
          Claude would paint none of this theme. {refusal}
        </p>
      ) : null}
      {adjusted.map((a, i) => (
        <p key={i} className='text-ui-ink-muted'>
          The {a}.
        </p>
      ))}
      {notes.length ? (
        <details className='text-ui-ink-faint'>
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
    </div>
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
  const group = (title: string, note: string, list: KnobRow[]) => (
    <div className='flex min-w-0 flex-col gap-[8px]'>
      <h3 className='flex items-baseline gap-[8px] text-xs text-ui-ink-muted'>
        <span className='font-mono font-medium'>{title}</span>
        <span className='truncate text-ui-ink-faint'>{note}</span>
      </h3>
      <div className='flex flex-col gap-[6px]'>
        {list.map((row) => knobRowView(dispatch, mode, row))}
      </div>
    </div>
  )
  return (
    <section className='flex flex-col gap-[14px]'>
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
      {group('anchors', 'surfaces and texts', anchorRows(look, model, mode))}
      {group(
        'roles',
        'Claude keeps the hue and sets the lightness; keep the meaning',
        roleRows(look, model, mode),
      )}
      {group(
        'git',
        'diffs and pull request states',
        gitRows(look, model, mode),
      )}
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
    <div key={mode} className='flex min-w-0 flex-col gap-[20px]'>
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
        // Picking a preset themes the mode again
        <div className='opacity-50'>{presetView(model, dispatch, mode)}</div>
      ) : (
        <>
          {statusView(look, mode)}
          {presetView(model, dispatch, mode)}
          {nameView(model, dispatch, mode)}
          {look.modes[mode]?.isStock ? (
            <p className='text-xs text-ui-ink-muted'>
              Claude&apos;s own colors: the mod leaves this mode to Claude until
              a knob below changes.
            </p>
          ) : null}
          {knobsView(look, model, dispatch, mode)}
          {codeThemeView(model, dispatch, mode)}
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
        'What is behind the conversation. The preview does not draw it.',
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

// The two panel bars (the editor's title bar and the JSON panel's bar) share
// one shape, as on the first tuner
const BAR =
  'flex min-h-[56px] flex-wrap items-center justify-between gap-[12px] px-[20px] py-[8px]'

const headerView = () => (
  <header className='@container flex min-h-[56px] items-center justify-between gap-[12px] border-b border-ui-line px-[20px] py-[8px]'>
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
          Claude Theme Mod V2
        </h1>
        <span className='truncate text-xs text-ui-ink-faint'>
          Design a theme for the Theme Tuner mod of Claude Code.
        </span>
      </span>
    </span>
    <div className='flex shrink-0 items-center gap-[4px]'>
      {/* An agent reading the page finds its guide here: tools that list
          a page's links skip the head of index.html */}
      <a
        href={`${BASE_URL}llms.txt`}
        target='_blank'
        rel='noreferrer'
        title='Guide for AI agents (llms.txt): write the setup JSON and apply it with the mod'
        className='rounded-md px-[8px] py-[4px] text-xs text-ui-ink-muted hover:bg-ui-field hover:text-ui-ink'
      >
        Agent guide
      </a>
    </div>
  </header>
)

// The top half of the left: both modes side by side when there is room,
// then what applies to both
const editorView = (look: Look, props: HomeViewProps) => {
  const { model, dispatch } = props
  return (
    <div className='flex flex-col lg:min-h-0 lg:flex-1'>
      {headerView()}
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

const copyButton = (
  model: Model,
  dispatch: Dispatcher<Msg>,
  target: CopyTarget,
  label: string,
  isPrimary: boolean,
) => (
  <button
    type='button'
    onClick={() => dispatch({ _tag: 'Copy', target })}
    className={
      isPrimary
        ? 'rounded-lg bg-ui-brand px-[14px] py-[6px] text-xs font-semibold text-ui-brand-ink hover:opacity-90'
        : 'rounded-lg border border-ui-line bg-[var(--color-panel)] px-[12px] py-[6px] text-xs hover:border-ui-ink-faint'
    }
  >
    {model.copied === target ? 'Copied!' : label}
  </button>
)

// The bottom half of the left, where the first tuner has its snippet: the
// Theme JSON, which can be edited too, and how to apply it
const jsonPanelView = (model: Model, dispatch: Dispatcher<Msg>) => {
  const note = model.jsonError
    ? model.jsonError
    : model.copyFailed
      ? 'The browser blocked copying: select the JSON below and copy it.'
      : 'Edit it here too: paste a setup, a tuner link or preset ids.'
  const isBad = model.jsonError !== null || model.copyFailed !== null
  return (
    <section className='flex max-h-[32rem] flex-col border-t border-ui-line bg-ui-panel lg:max-h-none lg:min-h-0 lg:flex-1'>
      <div className={BAR}>
        <h2 className='text-sm font-semibold'>Theme JSON</h2>
        <p
          role={model.jsonError ? 'alert' : undefined}
          className={`min-w-0 flex-1 truncate text-xs ${isBad ? 'text-ui-bad' : 'text-ui-ink-faint'}`}
          title={note}
        >
          {note}
        </p>
        <div className='flex items-center gap-[8px]'>
          {copyButton(model, dispatch, 'command', 'Copy /tuner command', false)}
          {copyButton(model, dispatch, 'json', 'Copy', true)}
        </div>
      </div>
      <textarea
        aria-label='Theme JSON'
        spellCheck={false}
        value={model.jsonDraft ?? themeJson(model.setup)}
        onChange={(e) => dispatch({ _tag: 'EditJson', text: e.target.value })}
        onBlur={() => dispatch({ _tag: 'LeaveJson' })}
        className={`app-scroll min-h-[12rem] flex-1 resize-none border-y bg-ui-field px-[20px] py-[12px] font-mono text-xs leading-relaxed outline-none ${
          model.jsonError ? 'border-ui-bad' : 'border-ui-line'
        }`}
      />
      <div className='flex flex-col gap-[4px] px-[20px] py-[10px] text-xs text-ui-ink-muted'>
        <p>
          Apply it in Claude Code: paste it in the Theme JSON box of{' '}
          <code className='font-mono'>/tuner</code>, run the copied command, or
          ask Claude to set it (the mod gives Claude a{' '}
          <code className='font-mono'>set_theme</code> tool).
        </p>
        <p className='truncate' title={INSTALL}>
          No mod yet? <code className='font-mono text-ui-ink'>{INSTALL}</code>{' '}
          (or see the{' '}
          <a
            href={README}
            target='_blank'
            rel='noreferrer'
            className='underline hover:text-ui-ink'
          >
            README
          </a>
          )
        </p>
      </div>
    </section>
  )
}

// ---------- the previews ----------

// One mode's preview: a caption the width of the mock over the mock, which
// fills the rest, as on the first tuner
const previewCardView = (look: Look, model: Model, mode: Mode) => {
  const m = look.modes[mode]
  const name = !m || m.isStock ? "Claude's own colors" : m.resolved.name
  return (
    <div key={mode} className='flex min-h-0 w-full flex-col'>
      <div className='flex items-center justify-between gap-[12px] px-[16px] text-xs'>
        <span className='flex min-w-0 items-center gap-[8px]'>
          <span className='shrink-0 font-semibold text-ui-ink'>
            {MODE_LABELS[mode]} mode
          </span>
          <span className='truncate text-ui-ink-faint'>{name}</span>
        </span>
        {refusalOf(look, mode) && model.setup[mode] ? (
          <span className='shrink-0 text-ui-bad'>
            Claude would not paint it
          </span>
        ) : (
          <span className='shrink-0 text-ui-ink-faint'>
            Approximate: Claude derives the colors in between
          </span>
        )}
      </div>
      {/* The mock keeps its desktop proportions; narrow screens scroll it
          sideways. The padding leaves room for its shadow */}
      <div className='app-scroll flex min-h-0 w-full flex-1 overflow-x-auto p-[16px]'>
        {claudeMockView(previewPalette(look, mode))}
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

// Four panels, as on the first tuner: the editor over the Theme JSON on the
// left, the light and dark previews on the right
export const HomeView = (props: HomeViewProps) => {
  const { model, dispatch } = props
  const look = lookOf(model.setup)
  return (
    <div className='flex min-h-full flex-col bg-ui-page lg:h-full'>
      <main className='grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2'>
        <aside className='flex flex-col border-ui-line bg-ui-panel lg:min-h-0 lg:border-r'>
          {editorView(look, props)}
          {jsonPanelView(model, dispatch)}
        </aside>
        {previewsView(look, model)}
      </main>
    </div>
  )
}
