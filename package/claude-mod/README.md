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

- `/tuner` opens the pane: a preset per mode, the colors of each with their
  keys, a **Theme JSON** box (edit or paste a setup, a link or preset ids,
  then Enter), and **Turn off**.
- `/tuner solarized-light dracula` applies presets by id, and changes only
  the modes it names; `/tuner list` names them.
- `/tuner <JSON>` applies a setup designed on the home page of the web tuner
  (**Copy /tuner command**), and `/tuner <link>` one from its first tuner at
  `/legacy`.
- Ask Claude for a theme: the mod gives it a `set_theme` tool.
- `/tuner off` goes back to Claude's own colors.

## What it does

The mod runs in Claude Code and only themes it. Its hooks module
(`hooks/register.tsx`) uses:

- `$.theme.set` and `$.theme.clear`, to apply the look and to turn it off
- its own state and store (`$.state`, `$.store`), to keep the setup across
  sessions
- `$.command.register` for `/tuner`, `$.tool.register` for the `set_theme`
  tool, and `$.ui` for its pane and its status line

It reads no files, runs no processes, reads no environment variables and
sends nothing over the network: the presets and Claude's own `makeColors`
ship in the plugin folder.

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
