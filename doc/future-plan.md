# Future plan

Ideas and open work, in no particular order.

## Going public

- **Make the repository public** (it is private for now).
- **Retire the old Solarized package**: `universal-theme-tuner` still has
  `packages/claude-desktop-solarized-theme`, the hand-written theme this tuner
  grew from. Once this repository is public, remove that package and point its
  README here. Its snippet still has the bug where Revert brings the theme
  back (fixed here: the style is only re-pinned while it is in the page).
- **Host the app on GitHub Pages**: `vite.config.ts` already builds with
  relative paths (`base: './'`), so it needs only a Pages workflow.

## Keeping up with Claude

- After a major Claude update, run the Diagnostic and the stock-colors probe
  again (see [claude-internals.md](claude-internals.md)), and update the
  version the Claude presets name in `src/theme/presets.ts`.
- If Claude starts honoring the OS reduce-motion setting, or adds its own
  toggle, as asked in
  [anthropics/claude-code#94003](https://github.com/anthropics/claude-code/issues/94003),
  the Reduce motion option can go.

## Features

- **A truer preview**: the mock is hand-made and drifts from the real app over
  time. A preview built from a saved copy of Claude's markup would follow it
  more closely.
- **Sharing themes**: encode a palette in the URL, so a tuned theme can be
  shared as a link.
