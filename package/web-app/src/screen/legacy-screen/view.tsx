/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import shotDeveloperMode from '../../asset/how-to-apply/1-enable-developer-mode.webp'
import shotDevTools from '../../asset/how-to-apply/2-show-dev-tools.webp'
import shotSources from '../../asset/how-to-apply/3-sources.webp'
import shotSnippets from '../../asset/how-to-apply/4-snippets.webp'
import shotNewSnippet from '../../asset/how-to-apply/5-new-snippet.webp'
import shotRun from '../../asset/how-to-apply/6-run.webp'
import { type Screen, homeScreen } from '../../common/destination'
import { HexInput } from '../../component/hex-input'
import { Link } from '../../component/link'
import {
  BAR,
  Dialog,
  Gear,
  HeaderLinks,
  LINK_BUTTON,
  Logo,
  MENU_ITEM,
  ModeHeader,
  OptionToggle,
  PresetChips,
  SectionTitle,
  TITLE_BAR,
  VersionBadge,
} from '../../component/tuner-ui'
import { claudeMockView } from '../../preview/claude-mock'
import { contrast } from '../../theme/color'
import {
  CONTRAST_CHECKS,
  type Mode,
  PALETTE_GROUPS,
  type PaletteKey,
  type Theme,
} from '../../theme/palette'
import { STOCK, TESTED_CLAUDE_VERSION, allPresets } from '../../theme/presets'
import { codeView } from './code-view'
import { type CopyTarget, type Model, type Msg } from './type'
import { canReset, snippetDoesSomething, textFor } from './update'

export interface AppProps {
  model: Model
  dispatch: Dispatcher<Msg>
  navigate: (screen: Screen) => void
}

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'light', label: 'Light mode' },
  { mode: 'dark', label: 'Dark mode' },
]

const LABELS: Record<PaletteKey, string> = Object.fromEntries(
  PALETTE_GROUPS.flatMap((g) => g.keys.map((k) => [k.key, k.label])),
) as Record<PaletteKey, string>

// The settings menu under the gear: saving the setup to a JSON file,
// loading one, copying a link to it, and swapping the panes (wide screens only: stacked panes have
// no sides to swap). A click outside or Escape closes it.
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
            title='Download both modes and the options as a JSON file'
            onClick={() => dispatch({ _tag: 'SavePreset' })}
            className={`${MENU_ITEM} hover:bg-ui-field`}
          >
            <span aria-hidden='true'>↓</span> Save Preset
          </button>
          {/* A label opens the hidden file picker; choosing a file loads it */}
          <label
            role='menuitem'
            title='Load a preset JSON file saved with the tuner'
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
            title='Copy a link that opens the tuner with this setup'
            onClick={() => dispatch({ _tag: 'CopyLink', as: 'link' })}
            className={`${MENU_ITEM} hover:bg-ui-field`}
          >
            <span aria-hidden='true'>🔗</span> Copy Share Link
          </button>
          <button
            type='button'
            role='menuitem'
            title='Copy the /tuner command that applies this setup with the Theme Tuner mod in Claude Code'
            onClick={() => dispatch({ _tag: 'CopyLink', as: 'mod' })}
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

// The agent guide link's name: what agents listing the page's links read
const AGENT_GUIDE =
  'Guide for AI agents (llms.txt): design themes as links and screenshot them, without filling in the color fields'

// The title and what the tool does on one line; at the right, who built it,
// the sponsor and source links, and the settings menu
const headerView = (model: Model, dispatch: Dispatcher<Msg>) => (
  <header className={TITLE_BAR}>
    <span className='flex min-w-0 items-center gap-[10px]'>
      <Logo />
      {/* Not overflow-hidden, so the badge can sit above the title;
          the subtitle truncates on its own */}
      <span className='flex min-w-0 items-baseline gap-[10px]'>
        <h1 className='relative shrink-0 text-base font-semibold tracking-tight'>
          Claude Desktop Theme Tuner
          <VersionBadge label='legacy' tone='old' />
        </h1>
        <span
          title={`Tested against Claude desktop ${TESTED_CLAUDE_VERSION} on macOS`}
          className='hidden shrink-0 rounded-md bg-ui-field px-[6px] py-[1px] font-mono text-[0.6875rem] text-ui-ink-muted @xl:inline'
        >
          Claude Desktop {TESTED_CLAUDE_VERSION}
        </span>
        <span className='min-w-0 truncate text-xs text-ui-ink-faint'>
          Pick a theme, tune its colors, copy the snippet.
        </span>
      </span>
    </span>
    <div className='flex shrink-0 items-center gap-[8px]'>
      <HeaderLinks agentGuide={AGENT_GUIDE} />
      {settingsMenuView(model, dispatch)}
    </div>
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
    <ModeHeader
      label={label}
      subtitle={
        slot.enabled ? slot.theme.name : 'Stock, left as Claude ships it'
      }
      isOn={slot.enabled}
      onToggle={() => dispatch({ _tag: 'ToggleSlot', mode })}
    />
  )
}

// A global option (not per mode): adds its code to the snippet
const optionView = (
  label: string,
  note: React.ReactNode,
  checked: boolean,
  onChange: () => void,
) => (
  <OptionToggle label={label} note={note} isOn={checked} onToggle={onChange} />
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
    <h2 className='pt-[8px] text-xs font-semibold tracking-wide text-ui-ink-faint uppercase'>
      Icons
    </h2>
    {optionView(
      'Thin arrows',
      <>
        Draws Claude's thin chevron in place of its filled triangle arrows: in
        the sidebar, the file tree, panels and the chat's tool rows. Shown in
        the preview.
      </>,
      model.thinArrows,
      () => dispatch({ _tag: 'ToggleThinArrows' }),
    )}
  </section>
)

// A preset in miniature: its canvas, frame, text and accent
const sectionTitle = (title: string) => <SectionTitle title={title} />

const presetsView = (model: Model, dispatch: Dispatcher<Msg>, mode: Mode) => {
  const slot = model[mode]
  return (
    <section className='flex flex-col gap-[8px]'>
      {sectionTitle('Presets')}
      <PresetChips
        presets={allPresets().filter((t) => t.mode === mode)}
        activeId={slot.enabled ? slot.theme.id : undefined}
        onPick={(id) => dispatch({ _tag: 'PickPreset', id })}
      />
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
        {canReset(slot) ? (
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

// The Theme Tuner mod (mod/), installed from this repository, which is its
// marketplace
const MOD_MARKETPLACE = 'rinn7e/claude-desktop-theme-tuner'
const MOD_INSTALL = `/plugin install theme-tuner --marketplace ${MOD_MARKETPLACE}`

const code = (text: string) => (
  <code className='rounded bg-ui-panel px-[5px] py-[1px] font-mono text-[0.75rem] text-ui-ink wrap-anywhere'>
    {text}
  </code>
)

// The easy way for Claude Code sessions: the mod keeps the theme across
// restarts, also on mobile, with nothing pasted in DevTools
const modSectionView = (dispatch: Dispatcher<Msg>) => (
  <section className='flex shrink-0 flex-col gap-[10px] rounded-lg bg-ui-field p-[14px] text-sm leading-relaxed text-ui-ink-muted'>
    <h3 className='text-sm font-semibold text-ui-ink'>
      With the Theme Tuner mod (Claude Code sessions)
    </h3>
    <p>
      Install it once. In a terminal session run {code(MOD_INSTALL)}; in the
      desktop app click {ui('+')} next to the prompt, then {ui('Plugins')},{' '}
      {ui('Add marketplace')} with {code(MOD_MARKETPLACE)}, then{' '}
      {ui('Add plugin')}.
    </p>
    <p>
      Then copy this setup as a command and send it in a Claude Code session.
      The theme stays across restarts and shows on mobile too; {code('/tuner')}{' '}
      opens the mod to switch presets or tune colors.
    </p>
    <div>
      <button
        type='button'
        onClick={() => dispatch({ _tag: 'CopyLink', as: 'mod' })}
        className='rounded-md bg-ui-brand px-[12px] py-[5px] text-xs font-medium text-ui-brand-ink'
      >
        Copy /tuner command
      </button>
    </div>
    <p className='text-xs'>
      The mod themes Claude Code sessions only. To theme the whole app (the Chat
      tab and the full sidebar too), or for Thin arrows and Reduce motion, use
      the snippet below.
    </p>
  </section>
)

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
    <Dialog
      title='How to apply the theme'
      onClose={() => dispatch({ _tag: 'CloseHelp' })}
    >
      {modSectionView(dispatch)}
      <h3 className='text-sm font-semibold'>
        With the snippet in DevTools (the whole app)
      </h3>
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
          renamed some of its colors; the tuner needs updating for that version.
        </span>
      </div>
    </Dialog>
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

// What loading a preset file or a link did, under the title bar: an error stays until
// dismissed, "Loaded" clears itself
const presetNoticeView = (model: Model, dispatch: Dispatcher<Msg>) =>
  model.presetNotice ? (
    <div
      role={model.presetNotice.kind === 'error' ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-[12px] border-b border-ui-line px-[20px] py-[8px] text-xs ${
        model.presetNotice.kind === 'error' ? 'text-ui-bad' : 'text-ui-good'
      }`}
    >
      <span className='min-w-0 wrap-anywhere'>{model.presetNotice.text}</span>
      <button
        type='button'
        onClick={() =>
          dispatch({
            _tag: 'ClearPresetNotice',
            text: model.presetNotice?.text ?? '',
          })
        }
        className='shrink-0 text-ui-ink-faint hover:text-ui-ink'
      >
        Dismiss
      </button>
    </div>
  ) : null

// The title bar stays put, like the snippet panel's tabs; below it, light and
// dark side by side once the panel is wide enough (a container query, as the
// panel is half the window), stacked below that, scrolling on their own
// Points people here to the new tuner, made for the mods of Claude. Amber
// with dark text, apart from the orange of the home's banner
const bannerView = ({ model, dispatch, navigate }: AppProps) =>
  model.isBannerShown ? (
    <div
      role='status'
      className='flex items-center justify-between gap-[12px] bg-amber-300 px-[20px] py-[10px] text-xs text-amber-950'
    >
      <span>
        <b className='font-semibold'>
          Theme Tuner now supports the new Claude mods!
        </b>{' '}
        Theme Claude Code with no DevTools snippet, kept across restarts, in{' '}
        <Link
          screen={homeScreen}
          navigate={navigate}
          className='font-semibold underline underline-offset-2 hover:text-amber-800'
        >
          the new version
        </Link>
        .
      </span>
      <button
        type='button'
        onClick={() => dispatch({ _tag: 'DismissBanner' })}
        className='shrink-0 rounded-md px-[8px] py-[2px] text-amber-900 hover:bg-amber-950/10 hover:text-amber-950'
      >
        Dismiss
      </button>
    </div>
  ) : null

const customizerView = (props: AppProps) => {
  const { model, dispatch } = props
  return (
    <div className='flex flex-col lg:min-h-0 lg:flex-1'>
      <div className='border-b border-ui-line'>
        {headerView(model, dispatch)}
      </div>
      {bannerView(props)}
      {presetNoticeView(model, dispatch)}
      <div className='@container flex flex-col gap-[20px] p-[20px] lg:min-h-0 lg:flex-1 app-scroll lg:overflow-y-auto'>
        <div className='grid grid-cols-1 gap-x-[24px] gap-y-[20px] @2xl:grid-cols-2'>
          {MODES.map(({ mode, label }) =>
            modeColumnView(model, dispatch, mode, label),
          )}
        </div>
        {optionsView(model, dispatch)}
      </div>
    </div>
  )
}

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
const previewCardView = (
  model: Model,
  mode: Mode,
  label: string,
  fill = false,
) => {
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
        <div className='flex min-h-0 w-full flex-1 app-scroll overflow-x-auto p-[16px]'>
          {claudeMockView(palette, { fill, thinArrows: model.thinArrows })}
        </div>
      </div>
    </div>
  )
}

// Both modes at once, light first: two equal halves of the pane on wide
// screens, stacked at a fixed height on narrow ones. The same space on every
// side and between the two, so the mocks sit evenly in the pane
const previewView = (model: Model) => (
  <section className='preview-dots flex flex-col gap-[8px] p-[8px] lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)] lg:grid-rows-2 lg:gap-[24px] lg:p-[24px]'>
    {MODES.map(({ mode, label }) => previewCardView(model, mode, label))}
  </section>
)

// Only the previews, for screenshots (#view=preview): the themed modes, or
// both when neither is. As wide as the window up to 1280px, so an agent's
// narrow browser pane shows the whole mock. data-ready tells a headless
// browser the theme is in place
const previewOnlyView = (model: Model) => {
  const themed = MODES.filter(({ mode }) => model[mode].enabled)
  return (
    <main
      data-ready
      className='preview-dots flex min-h-screen w-full max-w-[1280px] flex-col gap-[24px] p-[24px]'
    >
      {/* A bad link says why instead of showing the wrong theme silently */}
      {model.presetNotice?.kind === 'error'
        ? presetNoticeView(model, () => {})
        : null}
      {(themed.length ? themed : MODES).map(({ mode, label }) => (
        <div key={mode} className='flex h-[38rem] flex-col'>
          {previewCardView(model, mode, label, true)}
        </div>
      ))}
    </main>
  )
}

// Two halves: the customizer over the code it produces, and the preview;
// swapped, the customizer moves to the right on wide screens
export const App = (props: AppProps) => {
  const { model, dispatch } = props
  return model.previewOnly ? (
    previewOnlyView(model)
  ) : (
    <main className='grid min-h-full grid-cols-1 lg:h-full lg:grid-cols-2'>
      <aside
        className={`flex flex-col border-ui-line bg-ui-panel lg:min-h-0 ${
          model.swapped ? 'lg:order-last lg:border-l' : 'lg:border-r'
        }`}
      >
        {customizerView(props)}
        {codePanelView(model, dispatch)}
      </aside>
      {previewView(model)}
      {helpDialogView(model, dispatch)}
    </main>
  )
}
