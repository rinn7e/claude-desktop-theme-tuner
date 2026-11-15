// The Theme Tuner mod's values in $.state: the setup the person picked
// (the JSON of a web tuner share link), the mode the pane's color fields
// edit, and the last thing the pane has to say.

export type TunerModeChoice = {
  /** A preset id, such as `solarized-light`; absent for all 13 colors given. */
  preset?: string
  /** The name shown for it; absent, the preset's own. */
  name?: string
  /** The colors that differ from the preset, by palette role, as #rrggbb. */
  colors?: Partial<Record<string, string>>
}

export type TunerSetup = {
  light?: TunerModeChoice
  dark?: TunerModeChoice
}

declare module 'claude-code' {
  interface PluginState {
    'theme-tuner': {
      setup: Shaped<TunerSetup>
      editing: 'light' | 'dark'
      notice: string | null
    }
  }
}
