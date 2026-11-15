# Claude's UI internals

What we learned about how the Claude desktop app paints itself, and how to
investigate it when an update changes things. Checked against Claude 3.6556.2
on macOS. What each token sets is explained next to it in
`package/web-app/src/theme/tokens.ts` and `package/web-app/src/theme/css.ts`; this file covers what the code
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

Use `package/web-app/snippets/diagnose.snippet.js` (a maintainer tool, not in the app). It
reports what paints each area, the variables in use, the rules behind the
sidebar, the main colors and every layer around the composer.

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

`package/web-app/snippets/stock-colors.snippet.js` reads Claude's defaults for both modes (it
flips `data-mode` for a moment) and resolves each variable to a color through
a probe element. Run it with no theme applied. The results, and how
translucent values were turned into solid ones, are in the `STOCK` comments in
`package/web-app/src/theme/presets.ts`. Re-measure after a major Claude update.

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

## Icons and the disclosure arrows

- Most icons are glyphs of Claude's own variable icon font,
  `Anthropicons-Variable` (weights 400 to 700), in an empty-looking
  `<span data-cds="Icon">`: the glyph is a private-use character, so it does
  not show when the markup is copied. Only file-type icons and a few others
  are inline SVGs.
- The weight sets the stroke: Claude draws each icon at its own weight with
  an inline `font-weight` (433.3 to 628.6), and `400` is the thinnest.
- Every disclosure arrow is the same glyph, U+F011 (a filled triangle),
  turned by `--cds-icon-rotate` (90deg when open). The Context panel uses
  U+E02A, a thin chevron. The Thin arrows option (`package/web-app/src/theme/arrows.ts`)
  makes U+F011 transparent and paints U+E02A over it in a `::before`.
- CSS cannot select by glyph, so the option lists each place the arrow is
  drawn (`data-group-caret`, `data-container-icon`, `data-tree-caret`,
  `data-panel-open`, the chat's status rows). After a Claude update, run
  `package/web-app/snippets/arrows.snippet.js` and check that list against what it reports;
  an arrow the list misses stays a triangle.

## Mod themes (Claude Code sessions)

- A mod sets a look with `$.theme.set({ colors })`, for the desktop and
  mobile apps; the terminal draws none. `colors` is about 100 design-system
  tokens, built by `makeColors` (`package/claude-mod/hooks/make-colors.js`, copied unchanged
  from the mod-authoring skill) from anchors: `surface-0` to `surface-3`,
  `text-primary`, `text-secondary`, `text-muted`, and roles such as `accent`.
- Its rules, which fail with no error in the app: `surface-0` is the darkest
  surface in both modes; in light mode `surface-2` and `surface-3` match
  where both are given;
  `text-secondary` is at least as strong as `text-muted`. A problem starting
  `Desktop won't paint` means Desktop ignores the whole look. A dark
  `surface-3` as light as a preset's raised color fails it, so the mod
  leaves `surface-3` to `makeColors` (`package/claude-mod/hooks/look.ts`).
- `codeTheme` takes Claude's own ids for its code themes. They are the
  preset ids, except `vscode-light`, `vscode-dark` and `one-dark-pro`
  (`package/web-app/src/theme/mod-presets.ts`), read from the strings of the Claude Code
  script in Claude's web cache (`Code Cache/js`).
