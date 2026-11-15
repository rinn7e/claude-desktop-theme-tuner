// The Theme Tuner mod's values in $.state: the setup the person picked
// (the JSON of a web tuner share link) and the last thing the pane has to
// say.

export type TunerModeChoice = {
  /** A preset id, such as `solarized-light`; absent for all 13 colors given. */
  preset?: string
  /** The name shown for it; absent, the preset's own. */
  name?: string
  /** The colors that differ from the preset, by palette role, as #rrggbb. */
  colors?: Partial<Record<string, string>>
  /** Knobs of Claude set directly: surfaces and texts, by their names. */
  anchors?: Partial<Record<string, string>>
  /** Role colors: accent, danger, success, warning, pro. */
  roles?: Partial<Record<string, string>>
  /** Git colors for diffs and pull request states. */
  git?: Partial<Record<string, string>>
  /** A code theme id of Claude, over the preset's own; null sends none. */
  codeTheme?: string | null
}

export type TunerBackdrop =
  | { color: string }
  | {
      gradient: {
        stops: string[]
        angle?: number
        shape?: 'linear' | 'radial'
      }
    }

export type TunerSetup = {
  light?: TunerModeChoice
  dark?: TunerModeChoice
  /** Stronger borders and focus rings. */
  contrast?: 'more'
  backdrop?: TunerBackdrop
}

declare module 'claude-code' {
  interface PluginState {
    'theme-tuner': {
      setup: Shaped<TunerSetup>
      notice: string | null
    }
  }
}
