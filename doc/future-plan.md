# Future plan

Ideas and open work, in no particular order.

## Going public

- **Retire the old Solarized package**: `universal-theme-tuner` still has
  `packages/claude-desktop-solarized-theme`, the hand-written theme this tuner
  grew from. Now that this repository is public, remove that package and point
  its README here. Its snippet still has the bug where Revert brings the theme
  back (fixed here: the style is only re-pinned while it is in the page).

## Keeping up with Claude

- After a major Claude update, run `snippets/diagnose.snippet.js` and the
  stock-colors probe again (see [claude-internals.md](claude-internals.md)),
  and update the version the Claude presets name in `src/theme/presets.ts`.
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
