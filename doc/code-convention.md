# Code convention

## Architecture

- The app follows the Elm Architecture with `react-tea-cup` and `tea-cup-fp`:
  one `Model` (`src/type.ts`), changed only through `Msg` messages in
  `src/update.ts`.
- State changes go through small, pure sub-updaters (`handlePickPreset`,
  `handleSetColor`, ...) that return a new model; side effects (saving, copying)
  are commands.
- The theme engine in `src/theme/` is pure: palettes in, strings out. The
  preview and the snippet both read from `deriveTokens`, so they cannot drift
  apart.

## Views

- View functions (plain functions returning JSX, not components) end with
  `View`: `presetsView`, `codePanelView`, `claudeMockView`.
- A small component is fine where a view needs local state the model should not
  hold, like the hex field's half-typed draft (`HexInput`).

## Styling

- Tailwind v4. The tuner's own colors are tokens in `src/asset/index.css`
  (`bg-ui-panel`, `text-ui-ink`, ...), with a dark variant for the OS dark mode.
- Font sizes use `rem` (Tailwind's `text-xs` or `text-[0.75rem]`), never `px`,
  and nothing smaller than `text-[0.625rem]`.
- No margin utilities (`m-`, `mt-`, `mx-`, ...): space elements with the
  parent's padding or `gap-`.
- The preview mock colors itself only through Claude's variables
  (`bg-[var(--cds-surface-1)]`), never fixed colors, so it shows what the
  snippet does.

## Data

- What is read from `localStorage` is decoded with the `io-ts` codecs in
  `src/storage/storage.ts`; invalid or old data falls back to the defaults.

## Tests

- Vitest, in `test/`. New or changed sub-updaters, theme functions and codecs
  need tests. Every preset must pass the WCAG checks in `test/presets.test.ts`.
