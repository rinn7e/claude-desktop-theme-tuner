# Theme Tuner mod

Themes Claude Code on desktop (and mobile) with the presets of
[Claude Desktop Theme Tuner](https://rinn7e.com/claude-desktop-theme-tuner/):
one for each of Claude's code themes, light and dark, kept across restarts.

## Install

At the prompt of a terminal session:

```
/plugin install rinn7e-theme-tuner --marketplace rinn7e/claude-desktop-theme-tuner
```

In the desktop app: click **+** next to the prompt, then **Plugins**, **Add
marketplace** with `rinn7e/claude-desktop-theme-tuner`, then **Add plugin**.

## Use

- `/theme-tuner` opens the pane: a preset per mode, the colors of each with their
  keys, a **Theme JSON** box (edit or paste a setup, a link or preset ids,
  then Enter), and **Turn off**.
- `/theme-tuner solarized-light dracula` applies presets by id, and changes only
  the modes it names; `/theme-tuner list` names them.
- `/theme-tuner <JSON>` applies a setup designed on the home page of the web tuner
  (**Copy /theme-tuner command**), and `/theme-tuner <link>` one from its first tuner at
  `/legacy`.
- Ask Claude for a theme: the mod gives it a `set_theme` tool.
- `/theme-tuner off` goes back to Claude's own colors.
- `/tuner` is a short alias of `/theme-tuner`.

## What it does

The mod runs in Claude Code and only themes it. Its hooks module
(`hooks/register.tsx`) uses:

- `$.theme.set` and `$.theme.clear`, to apply the look and to turn it off
- its own state and store (`$.state`, `$.store`), to keep the setup across
  sessions
- `$.command.register` for `/theme-tuner` and its short alias `/tuner`,
  `$.tool.register` for the `set_theme` tool, and `$.ui` for its pane and its
  status line

Its hooks:

- `session.start` sends the kept look, if there is one, and registers the
  commands and the tool.
- `command.run` answers only its own commands, `/theme-tuner` and `/tuner`.
- `tool.call` answers only its own tool,
  `mcp__rinn7e-theme-tuner__set_theme`: the mod is that tool, so it stands in
  for no other tool. Its answer says what was set, with a link to the web
  tuner for the person to open.
- `ui.render` draws its own pane.

It reads no files, no credentials and no conversation, runs no processes,
reads no environment variables and sends nothing anywhere: no network call,
and nothing leaves the session but the look it sets. The presets and the own
`makeColors` of Claude ship in the plugin folder. The long hex string in
`hooks/make-colors.js` is the stock colors of Claude, part of that file as
the mod-authoring skill of Claude Code ships it, copied unchanged.

## Files

- `hooks/register.tsx`: the commands, the tool, the pane and the start of a
  session.
- `hooks/look.ts`: a setup to the look Claude draws, shared with the web
  tuner's tests.
- `hooks/presets.ts`: generated from the web tuner's presets; do not edit.
- `hooks/make-colors.js`: Claude's own, copied unchanged.

Checks: `claude plugin validate package/claude-mod` and
`claude plugin test package/claude-mod`, from the
repository root. See the [main README](../../README.md#theme-claude-code-with-the-mod).

Types for the editor and `tsc -p package/claude-mod`: `tsconfig.json` uses the
options the typings of Claude Code ask for, and reads the types from
`.claude-plugin/types/` (ignored by git). Claude Code writes that folder when
an interactive session loads the mod from its folder: run
`claude --plugin-dir package/claude-mod` once, and again after Claude Code
updates.
