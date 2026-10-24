/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React, { useEffect, useState } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import shotDeveloperMode from './asset/how-to-apply/1-enable-developer-mode.webp'
import shotDevTools from './asset/how-to-apply/2-show-dev-tools.webp'
import shotSources from './asset/how-to-apply/3-sources.webp'
import shotSnippets from './asset/how-to-apply/4-snippets.webp'
import shotNewSnippet from './asset/how-to-apply/5-new-snippet.webp'
import shotRun from './asset/how-to-apply/6-run.webp'
import { codeView } from './code-view'
import { claudeMockView } from './preview/claude-mock'
import { contrast, isHex } from './theme/color'
import {
  CONTRAST_CHECKS,
  type Mode,
  PALETTE_GROUPS,
  type PaletteKey,
  type Theme,
} from './theme/palette'
import { STOCK, allPresets } from './theme/presets'
import { type CopyTarget, type Model, type Msg } from './type'
import { isEdited, snippetDoesSomething, textFor } from './update'

export interface AppProps {
  model: Model
  dispatch: Dispatcher<Msg>
}

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'light', label: 'Light mode' },
  { mode: 'dark', label: 'Dark mode' },
]

const LABELS: Record<PaletteKey, string> = Object.fromEntries(
  PALETTE_GROUPS.flatMap((g) => g.keys.map((k) => [k.key, k.label])),
) as Record<PaletteKey, string>

// A hex field that keeps what is typed until it is a full color, so a
// half-typed value is never thrown away or sent
const HexInput = ({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) => {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <input
      type='text'
      spellCheck={false}
      aria-label='Hex color'
      value={draft}
      onChange={(e) => {
        const next = e.target.value.trim()
        setDraft(next)
        if (isHex(next)) onChange(next)
      }}
      onBlur={() => setDraft(value)}
      className={`w-[5.5rem] rounded-md border bg-ui-field px-[8px] py-[4px] font-mono text-xs uppercase outline-none focus:border-ui-brand ${
        isHex(draft) ? 'border-ui-line' : 'border-ui-bad'
      }`}
    />
  )
}

// The two panel bars (the customizer's title bar and the snippet's tab bar)
// share one shape, so they are the same height
const BAR =
  'flex min-h-[56px] flex-wrap items-center justify-between gap-[12px] px-[20px] py-[8px]'

// The title and what the tool does on one line, with the swap button at the
// right (wide screens only: stacked panes have no sides to swap)
const headerView = (dispatch: Dispatcher<Msg>) => (
  <header className={BAR}>
    <span className='flex min-w-0 items-baseline gap-[10px]'>
      <h1 className='shrink-0 text-base font-semibold tracking-tight'>
        Claude Desktop Theme Tuner
      </h1>
      <span className='truncate text-xs text-ui-ink-faint'>
        Pick a theme, tune its colors, copy the snippet.
      </span>
    </span>
    <button
      type='button'
      title='Swap the customizer and the previews'
      onClick={() => dispatch({ _tag: 'ToggleSwapped' })}
      className='hidden items-center gap-[6px] rounded-lg border border-ui-line bg-ui-panel px-[12px] py-[6px] text-xs hover:border-ui-ink-faint lg:flex'
    >
      <span aria-hidden='true'>⇄</span> Swap sides
    </button>
  </header>
)

// A mode's heading: its name, its theme, and whether the snippet themes it
const modeHeaderView = (
  model: Model,
  dispatch: Dispatcher<Msg>,
  mode: Mode,
  label: string,
) => {
  const slot = model[mode]
  return (
    <label className='flex cursor-pointer items-center justify-between gap-[12px] rounded-lg bg-ui-field px-[12px] py-[10px]'>
      <span className='flex min-w-0 flex-col gap-[2px]'>
        <span className='text-sm font-semibold'>{label}</span>
        <span className='truncate text-xs text-ui-ink-faint'>
          {slot.enabled ? slot.theme.name : 'Stock, left as Claude ships it'}
        </span>
      </span>
      <input
        type='checkbox'
        aria-label={`Theme ${label.toLowerCase()}`}
        checked={slot.enabled}
        onChange={() => dispatch({ _tag: 'ToggleSlot', mode })}
        className='h-[18px] w-[18px] shrink-0 accent-ui-brand'
      />
    </label>
  )
}

// A global option (not per mode): adds its code to the snippet
const optionView = (
  label: string,
  note: React.ReactNode,
  checked: boolean,
  onChange: () => void,
) => (
  <label className='flex cursor-pointer items-center justify-between gap-[12px] rounded-lg border border-ui-line px-[12px] py-[10px]'>
    <span className='flex flex-col gap-[2px]'>
      <span className='text-sm font-medium'>{label}</span>
      <span className='text-xs text-ui-ink-faint'>{note}</span>
    </span>
    <input
      type='checkbox'
      checked={checked}
      onChange={onChange}
      className='h-[18px] w-[18px] shrink-0 accent-ui-brand'
    />
  </label>
)

const optionsView = (model: Model, dispatch: Dispatcher<Msg>) => (
  <section className='flex flex-col gap-[8px]'>
    <h2 className='text-xs font-semibold tracking-wide text-ui-ink-faint uppercase'>
      Performance
    </h2>
    {optionView(
      'Reduce motion',
      <>
        Stops Claude's looping animations, like the shimmer on its working text,
        which keep the GPU busy while Claude works. Measured about half the GPU
        load. See{' '}
        <a
          href='https://github.com/anthropics/claude-code/issues/94003'
          target='_blank'
          rel='noreferrer'
          className='underline hover:text-ui-ink'
        >
          anthropics/claude-code#94003
        </a>
        .
      </>,
      model.reduceMotion,
      () => dispatch({ _tag: 'ToggleReduceMotion' }),
    )}
  </section>
)

// A preset in miniature: its canvas, frame, text and accent
const swatchView = (theme: Theme) => (
  <span className='flex h-[14px] w-[40px] shrink-0 overflow-hidden rounded-full ring-1 ring-black/10'>
    {(['canvas', 'frame', 'text', 'accent'] as const).map((k) => (
      <span
        key={k}
        className='flex-1'
        style={{ background: theme.palette[k] }}
      />
    ))}
  </span>
)
const sectionTitle = (title: string) => (
  <h2 className='text-xs font-semibold tracking-wide text-ui-ink-faint uppercase'>
    {title}
  </h2>
)

const presetsView = (model: Model, dispatch: Dispatcher<Msg>, mode: Mode) => {
  const slot = model[mode]
  return (
    <section className='flex flex-col gap-[8px]'>
      {sectionTitle('Presets')}
      <div className='flex flex-wrap gap-[6px]'>
        {allPresets()
          .filter((t) => t.mode === mode)
          .map((t) => {
            const active = slot.enabled && slot.theme.id === t.id
            return (
              <button
                key={t.id}
                type='button'
                onClick={() => dispatch({ _tag: 'PickPreset', id: t.id })}
                aria-pressed={active}
                className={`flex items-center gap-[6px] rounded-full border py-[4px] pr-[10px] pl-[5px] text-xs transition-colors ${
                  active
                    ? 'border-ui-brand bg-ui-field font-medium ring-1 ring-ui-brand'
                    : 'border-ui-line hover:border-ui-ink-faint'
                }`}
              >
                {swatchView(t)}
                {t.name}
              </button>
            )
          })}
      </div>
    </section>
  )
}

const colorRowView = (
  dispatch: Dispatcher<Msg>,
  mode: Mode,
  key: PaletteKey,
  label: string,
  note: string,
  value: string,
) => (
  <div
    key={key}
    className='grid grid-cols-[2rem_5.5rem_1fr] items-center gap-[8px]'
  >
    <input
      type='color'
      aria-label={label}
      value={value}
      onChange={(e) =>
        dispatch({ _tag: 'SetColor', mode, key, value: e.target.value })
      }
      className='h-[28px] w-[32px] cursor-pointer rounded-md border border-ui-line bg-transparent p-0'
    />
    <HexInput
      value={value}
      onChange={(hex) => dispatch({ _tag: 'SetColor', mode, key, value: hex })}
    />
    <span className='flex min-w-0 flex-col'>
      <span className='truncate text-sm'>{label}</span>
      <span
        className='truncate text-[0.6875rem] text-ui-ink-faint'
        title={note}
      >
        {note}
      </span>
    </span>
  </div>
)

const colorsView = (model: Model, dispatch: Dispatcher<Msg>, mode: Mode) => {
  const slot = model[mode]
  return (
    <section className='@container flex flex-col gap-[14px]'>
      <div className='flex items-center justify-between gap-[8px]'>
        {sectionTitle('Colors')}
        {isEdited(slot) ? (
          <button
            type='button'
            onClick={() => dispatch({ _tag: 'ResetSlot', mode })}
            className='truncate text-xs text-ui-brand hover:underline'
          >
            Reset to {slot.theme.name}
          </button>
        ) : null}
      </div>
      {/* Each group is a column of its own, two side by side (Surfaces next to
          Text, Accent next to Lists), one on narrow screens */}
      <div className='grid grid-cols-1 gap-x-[16px] gap-y-[18px] @md:grid-cols-2'>
        {PALETTE_GROUPS.map((g) => (
          <div key={g.title} className='flex min-w-0 flex-col gap-[8px]'>
            <h3 className='text-xs font-medium text-ui-ink-muted'>{g.title}</h3>
            {g.keys.map(({ key, label, note }) =>
              colorRowView(
                dispatch,
                mode,
                key,
                label,
                note,
                slot.theme.palette[key],
              ),
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const contrastView = (model: Model, mode: Mode) => {
  const { palette } = model[mode].theme
  return (
    <section className='@container flex flex-col gap-[8px]'>
      {sectionTitle('Readability (WCAG)')}
      <div className='grid grid-cols-1 gap-x-[24px] gap-y-[4px] @md:grid-cols-2'>
        {CONTRAST_CHECKS.map(({ fg, bg, min }) => {
          const ratio = contrast(palette[fg], palette[bg])
          const ok = ratio >= min
          return (
            <div
              key={`${fg}-${bg}`}
              className='flex items-center justify-between gap-[8px] text-xs'
            >
              <span className='flex min-w-0 items-center gap-[6px] text-ui-ink-muted'>
                <span
                  className='flex h-[18px] w-[26px] shrink-0 items-center justify-center rounded text-[0.625rem] font-semibold ring-1 ring-black/10'
                  style={{ background: palette[bg], color: palette[fg] }}
                >
                  Aa
                </span>
                <span className='truncate'>
                  {LABELS[fg]} on {LABELS[bg].toLowerCase()}
                </span>
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
    </section>
  )
}

// One mode's whole configuration; a mode left stock is dimmed, and picking a
// preset turns it on. Its four parts sit on the rows of the parent grid
// (subgrid), so each part lines up with the other mode's, whatever their
// heights
const modeColumnView = (
  model: Model,
  dispatch: Dispatcher<Msg>,
  mode: Mode,
  label: string,
) => {
  const dim = `min-w-0 transition-opacity ${model[mode].enabled ? '' : 'opacity-50'}`
  return (
    <div key={mode} className='row-span-4 grid min-w-0 grid-rows-subgrid'>
      {modeHeaderView(model, dispatch, mode, label)}
      <div className={dim}>{presetsView(model, dispatch, mode)}</div>
      <div className={dim}>{colorsView(model, dispatch, mode)}</div>
      <div className={dim}>{contrastView(model, mode)}</div>
    </div>
  )
}

// The "How to apply" dialog, over a backdrop; closes on the backdrop, the
// Close button or Escape
// The steps to run a snippet in Claude, each with a screenshot of it
// (Claude 3.6556.2 on macOS)
// A menu path or key in a step, set apart from the prose around it
const ui = (text: string) => <b className='font-semibold text-ui-ink'>{text}</b>

const HELP_STEPS: { text: React.ReactNode; shot?: string }[] = [
  {
    text: (
      <>
        Turn on Developer Mode once: in Claude, choose{' '}
        {ui('Help > Troubleshooting > Enable Developer Mode')}.
      </>
    ),
    shot: shotDeveloperMode,
  },
  {
    text: (
      <>
        {ui('Copy')} the theme snippet here, and read it first: it only adds a
        style.
      </>
    ),
  },
  {
    text: <>Choose {ui('Developer > Show Dev Tools')} (Option+Cmd+I).</>,
    shot: shotDevTools,
  },
  {
    text: <>In DevTools, open the {ui('Sources')} tab.</>,
    shot: shotSources,
  },
  {
    text: (
      <>
        Click {ui('>>')} next to Page and Workspace, and choose {ui('Snippets')}
        .
      </>
    ),
    shot: shotSnippets,
  },
  { text: <>Click {ui('+ New snippet')}.</>, shot: shotNewSnippet },
  {
    text: (
      <>
        Paste the snippet, press {ui('Cmd+S')} to keep it, then{' '}
        {ui('Cmd+Enter')} to run it. The Console says "[theme] applied".
      </>
    ),
    shot: shotRun,
  },
  {
    text: (
      <>
        The theme lasts until Claude restarts. After a restart, open Dev Tools,
        then {ui('Sources > Snippets')}, and run the saved snippet again.
      </>
    ),
  },
]

const helpDialogView = (model: Model, dispatch: Dispatcher<Msg>) =>
  model.helpOpen ? (
    <div
      className='fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-[16px]'
      onClick={() => dispatch({ _tag: 'CloseHelp' })}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='help-title'
        className='flex max-h-full w-full max-w-[40rem] flex-col gap-[14px] overflow-y-auto rounded-xl bg-ui-panel p-[22px] shadow-2xl ring-1 ring-ui-line'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') dispatch({ _tag: 'CloseHelp' })
        }}
      >
        <div className='flex items-center justify-between'>
          <h2 id='help-title' className='text-base font-semibold'>
            How to apply the theme
          </h2>
          <button
            type='button'
            autoFocus
            onClick={() => dispatch({ _tag: 'CloseHelp' })}
            className='rounded-md px-[8px] py-[2px] text-sm text-ui-ink-faint hover:text-ui-ink'
          >
            Close
          </button>
        </div>
        {/* shrink-0: the dialog scrolls instead of squashing the screenshots.
            Each step: a numbered badge, its text, and its screenshot on a
            gray tray so the screenshot's white edges don't blend in. */}
        <ol className='flex shrink-0 flex-col divide-y divide-ui-line text-sm text-ui-ink-muted'>
          {HELP_STEPS.map(({ text, shot }, i) => (
            <li key={i} className='flex gap-[12px] py-[16px]'>
              <span className='flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-ui-brand text-xs font-semibold text-ui-brand-ink'>
                {i + 1}
              </span>
              <div className='flex min-w-0 flex-1 flex-col gap-[12px] pt-[2px] leading-relaxed'>
                <p>{text}</p>
                {shot ? (
                  <div className='rounded-lg bg-ui-field p-[10px]'>
                    <img
                      src={shot}
                      alt=''
                      loading='lazy'
                      width={1490}
                      height={1166}
                      className='h-auto w-full rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.12)] ring-1 ring-black/10'
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className='flex flex-col gap-[6px] rounded-lg bg-ui-field p-[12px] text-xs text-ui-ink-muted'>
          <span>
            <b className='text-ui-ink'>Undo it:</b> run the Revert code in the
            Console, or restart Claude.
          </span>
          <span>
            <b className='text-ui-ink'>An update left parts unthemed?</b> Claude
            renamed some of its colors; the tuner needs updating for that
            version.
          </span>
        </div>
      </div>
    </div>
  ) : null

const CODE_TABS: { target: CopyTarget; label: string; note: string }[] = [
  {
    target: 'theme',
    label: 'Theme snippet',
    note: 'Adds one <style> element with the CSS below. Nothing else runs.',
  },
  {
    target: 'revert',
    label: 'Revert',
    note: 'Removes the theme, and gives the animations back, until you run the snippet again.',
  },
]

// With reduce motion on, the theme snippet does one more thing, said here
const noteFor = (model: Model, target: CopyTarget, note: string) =>
  target === 'theme' && model.reduceMotion
    ? "Adds one <style> element with the CSS below, and switches on Claude's own reduce-motion setting. Nothing else runs."
    : note

// The exact code each Copy button copies, shown before anyone runs it
const codePanelView = (model: Model, dispatch: Dispatcher<Msg>) => {
  const tab = CODE_TABS.find((t) => t.target === model.shown) ?? CODE_TABS[0]
  // Nothing to copy while both modes are left stock
  const empty = tab.target === 'theme' && !snippetDoesSomething(model)
  const noteText = empty
    ? 'Both modes are left as Claude ships them.'
    : model.copyFailed === tab.target
      ? 'The browser blocked copying: select the code below and copy it.'
      : noteFor(model, tab.target, tab.note)
  return (
    <section className='code-panel flex max-h-[32rem] flex-col border-t border-ui-line bg-ui-panel lg:max-h-none lg:min-h-0 lg:flex-1'>
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
        {/* What the shown code does, in the bar between the tabs and the
            buttons; truncated when narrow, in full on hover */}
        <p
          className={`min-w-0 flex-1 truncate text-xs ${
            model.copyFailed === tab.target
              ? 'text-ui-bad'
              : 'text-ui-ink-faint'
          }`}
          title={noteText}
        >
          {noteText}
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
            disabled={empty}
            onClick={() => dispatch({ _tag: 'Copy', target: tab.target })}
            className='rounded-lg bg-ui-brand px-[14px] py-[6px] text-xs font-semibold text-ui-brand-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
          >
            {model.copied === tab.target ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      {empty ? (
        <div className='flex min-h-[8rem] flex-1 items-center justify-center px-[16px] py-[12px] text-center text-sm text-ui-ink-faint'>
          Tick Light mode or Dark mode above to get a snippet.
        </div>
      ) : (
        codeView(textFor(model, tab.target))
      )}
    </section>
  )
}

// The title bar stays put, like the snippet panel's tabs; below it, light and
// dark side by side once the panel is wide enough (a container query, as the
// panel is half the window), stacked below that, scrolling on their own
const customizerView = (model: Model, dispatch: Dispatcher<Msg>) => (
  <div className='flex flex-col lg:min-h-0 lg:flex-1'>
    <div className='border-b border-ui-line'>{headerView(dispatch)}</div>
    <div className='@container flex flex-col gap-[20px] p-[20px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto'>
      <div className='grid grid-cols-1 gap-x-[24px] gap-y-[20px] @2xl:grid-cols-2'>
        {MODES.map(({ mode, label }) =>
          modeColumnView(model, dispatch, mode, label),
        )}
      </div>
      {optionsView(model, dispatch)}
    </div>
  </div>
)

const creditView = (theme: Theme) =>
  theme.credit ? (
    <span>
      Colors from{' '}
      <a
        href={theme.credit.url}
        target='_blank'
        rel='noreferrer'
        className='underline hover:text-ui-ink'
      >
        {theme.credit.name}
      </a>{' '}
      ({theme.credit.license})
    </span>
  ) : (
    <span>{theme.name}</span>
  )

// One mode's preview: a caption the width of the mock (mode and theme on the
// left, the colors' credit on the right) over the mock, which fills the rest
const previewCardView = (model: Model, mode: Mode, label: string) => {
  const slot = model[mode]
  const palette = slot.enabled ? slot.theme.palette : STOCK[mode]
  return (
    <div key={mode} className='flex min-h-0 w-full flex-col items-center'>
      <div className='flex h-full min-h-0 w-full flex-col'>
        <div className='flex items-center justify-between gap-[12px] px-[16px] text-xs'>
          <span className='flex min-w-0 items-center gap-[8px]'>
            <span className='shrink-0 font-semibold text-ui-ink'>{label}</span>
            <span className='truncate text-ui-ink-faint'>
              {slot.enabled ? slot.theme.name : 'Stock (shown approximately)'}
            </span>
          </span>
          {slot.enabled && slot.theme.credit ? (
            <span className='shrink-0 text-ui-ink-faint'>
              {creditView(slot.theme)}
            </span>
          ) : null}
        </div>
        {/* The mock keeps its desktop proportions; narrow screens scroll it
            sideways. The padding leaves room for its shadow, which the
            scrolling box would clip, and the caption above has the same inset */}
        <div className='flex min-h-0 w-full flex-1 overflow-x-auto p-[16px]'>
          {claudeMockView(palette)}
        </div>
      </div>
    </div>
  )
}

// Both modes at once, light first: two equal halves of the pane on wide
// screens, stacked at a fixed height on narrow ones. The same space on every
// side and between the two, so the mocks sit evenly in the pane
const previewView = (model: Model) => (
  <section className='preview-dots flex flex-col gap-[8px] p-[8px] lg:grid lg:min-h-0 lg:grid-rows-2 lg:gap-[24px] lg:p-[24px]'>
    {MODES.map(({ mode, label }) => previewCardView(model, mode, label))}
  </section>
)

// Two halves: the customizer over the code it produces, and the preview;
// swapped, the customizer moves to the right on wide screens
export const App = ({ model, dispatch }: AppProps) => (
  <div className='grid min-h-full grid-cols-1 lg:h-full lg:grid-cols-2'>
    <aside
      className={`flex flex-col border-ui-line bg-ui-panel lg:min-h-0 ${
        model.swapped ? 'lg:order-last lg:border-l' : 'lg:border-r'
      }`}
    >
      {customizerView(model, dispatch)}
      {codePanelView(model, dispatch)}
    </aside>
    {previewView(model)}
    {helpDialogView(model, dispatch)}
  </div>
)
