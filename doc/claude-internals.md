# Claude's UI internals

What we learned about how the Claude desktop app paints itself, and how to
investigate it when an update changes things. Checked against Claude 3.6556.2
on macOS. What each token sets is explained next to it in
`src/theme/tokens.ts` and `src/theme/css.ts`; this file covers what the code
can't: how the findings were made and the traps on the way.

## Where the colors come from

- The UI is a web page in Electron. Its CSS ships inside
  `/Applications/Claude.app/Contents/Resources/app.asar`, so
  `strings app.asar | grep <name>` finds a class, keyframe or variable and how
  often it appears.
- Three layers of variables: the design system (`--cds-*`), claude.ai's older
  HSL triples (`--bg-*`, `--text-*`), and the Code tab frame (`--df-*`). The
  frame re-sets its variables on its own elements, which is why the snippet
  sets them there too.
- Claude 3.x adds the "fizzy lake" look: `html[data-cds-fizzy-lake~="color"]`
  rules that recolor the sidebar and surfaces. In dark mode they use selectors
  of up to five parts (specificity 0,5,0), so plain selectors lose; that is
  why every declaration in the snippet is `!important`.
- `!important` on `<html>` does not reach variables Claude re-sets on a child
  element. Two places bit us: boxes with a shadow class (the composer) map
  `--cds-surface-3` to `--cds-surface-popover`, and in dark mode the chat
  column is painted from `--df-bg-page-hsl`.

## Debugging a broken theme

Use `snippets/diagnose.snippet.js` (the Diagnostic tab). It reports what paints
each area, the variables in use, the rules behind the sidebar, the main colors
and every layer around the composer.

Traps that cost us time:

- **Undock DevTools.** Docked DevTools narrows the window, Claude collapses the
  sidebar into its overlay, and the report describes the wrong sidebar.
- **`copy()` only exists while pasted code runs synchronously.** After an
  `await` it is gone, so a snippet that measures over time must keep a
  reference first (`const copyText = copy`). Otherwise nothing reaches the
  clipboard and the clipboard still holds the snippet itself.
- **Rule values written as a `background:` shorthand with `var()` read back as
  empty longhands.** The diagnostic reports the shorthand too.
- **Snippets made before the revert fix re-add their style after Revert** (the
  observer that keeps the style last in `<head>` put it straight back). Only a
  restart clears them; current snippets stop pinning once the style is removed.
- **Check a fix against Claude's real rules before asking anyone to test it:**
  copy the rule text from a report into a plain page, set the same attributes
  on `<html>` (`class="cds-root"`, `data-mode`, `data-cds-fizzy-lake`,
  `data-sidebar-vibrancy`), run the snippet and read the computed variables.

## Claude's own colors

`snippets/stock-colors.snippet.js` reads Claude's defaults for both modes (it
flips `data-mode` for a moment) and resolves each variable to a color through
a probe element. Run it with no theme applied. The results, and how
translucent values were turned into solid ones, are in the `STOCK` comments in
`src/theme/presets.ts`. Re-measure after a major Claude update.

## GPU and WindowServer load

- While Claude works, WindowServer used 30 to 47% of a core and the GPU about
  50%; at rest WindowServer is near 10%.
- The main cost is the shimmer on the working text (`[data-cds-shimmer-clone]`,
  `cds-shimmer-text-band`): a masked gradient four times the text's width,
  re-rendered every frame. Reported in
  [anthropics/claude-code#94003](https://github.com/anthropics/claude-code/issues/94003),
  where we added our numbers.
- Claude's CSS already hides its looping animations under
  `[data-reduce-motion=true]`, but nothing sets it. Setting it (the Reduce
  motion option) halved the GPU load, with no restart.

## The sidebar glass

- The translucent sidebar is native macOS vibrancy: the window is created
  `transparent` with `vibrancy: "sidebar"`, and the page asks for the material
  through `window["claude.windowVibrancy"].WindowVibrancy`
  (`showUnderSidebar`, `clear`, `tintUnderSidebar`, `clearTintUnderSidebar`).
- The main process logs each change to `~/Library/Logs/Claude/main.log`
  (lines tagged `[window-vibrancy]`), which is the easiest way to see what the
  glass is doing.
- `clear()` turns it off, but the page asks again each time the sidebar opens.
  A tuner option that cleared it after every open worked, but it fought the app
  for a saving we never measured cleanly (others in #94003 saw no change from
  macOS Reduce transparency), so it was removed. The theme paints the sidebar
  solid anyway.
