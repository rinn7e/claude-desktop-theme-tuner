# Future plan

Ideas and open work, in no particular order.

## Going public

- **Retire the old Solarized package**: `universal-theme-tuner` still has
  `packages/claude-desktop-solarized-theme`, the hand-written theme this tuner
  grew from. Now that this repository is public, remove that package and point
  its README here. Its snippet still has the bug where Revert brings the theme
  back (fixed here: the style is only re-pinned while it is in the page).

## Keeping up with Claude

- After a major Claude update, run `package/web-app/snippets/diagnose.snippet.js` and the
  stock-colors probe again (see [claude-internals.md](claude-internals.md)),
  and update `TESTED_CLAUDE_VERSION` in `package/web-app/src/theme/presets.ts` (shown in
  the title bar and the Claude presets' credit) and the version in the README.
- When Claude adds or renames a code theme ("Code appearance" in its
  settings), add it to `THEMES` in `package/web-app/scripts/code-themes.mjs` and to
  `CLAUDE_ORDER` in `package/web-app/src/theme/presets.ts`, run `pnpm --filter web-app code-themes`, and
  update the list in `package/web-app/test/presets.test.ts`.
- If Claude starts honoring the OS reduce-motion setting, or adds its own
  toggle, as asked in
  [anthropics/claude-code#94003](https://github.com/anthropics/claude-code/issues/94003),
  the Reduce motion option can go.

## Features

- **A truer preview**: the mock is hand-made and drifts from the real app over
  time. A preview built from a saved copy of Claude's markup would follow it
  more closely.
- **Every mod knob in the web app**: the Theme Tuner mod sends only the
  surfaces, the three texts, the accent and the code theme. A mod look also
  takes the danger, success, warning and pro roles (which also color code),
  the git colors, more contrast, the menu surface, the gray ramp and a
  backdrop (a color, gradient, vector, image or animated scene with frosted
  glass). Let the web app edit each, carry them in the setup JSON as
  optional fields, and have the mod send them; the knobs, their shapes and
  their rules are in [mod-knobs.md](mod-knobs.md). A "Copy Theme JSON"
  button would then feed the Theme JSON box of the mod pane.
- **Check Thin arrows on new builds**: Claude 4.x on 15 Nov 2026 already drew
  thin chevrons in the sidebar with no snippet. If that holds, the Thin arrows
  option can go.
