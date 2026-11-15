<p align="center">
  <img src="package/web-app/public/logo.svg" alt="Claude Desktop Theme Tuner logo" width="128" height="128">
</p>

<h1 align="center">Claude Desktop Theme Tuner V2</h1>

<p align="center">
  <a href="https://rinn7e.com/claude-desktop-theme-tuner/"><b>rinn7e.com/claude-desktop-theme-tuner</b></a>
</p>

<p align="center">
  Make your own color theme for the Claude desktop app.
</p>

<p align="center">
  <a href="https://github.com/rinn7e/claude-desktop-theme-tuner/actions/workflows/pages.yml"><img src="https://github.com/rinn7e/claude-desktop-theme-tuner/actions/workflows/pages.yml/badge.svg" alt="Pages deploy"></a>
  <a href="https://rinn7e.com/claude-desktop-theme-tuner/"><img src="https://img.shields.io/badge/open%20the%20app-rinn7e.com-18181b" alt="Open the app"></a>
  <a href="https://www.youtube.com/watch?v=DfnZwI23iNM"><img src="https://img.shields.io/badge/demo-YouTube-ff0000?logo=youtube&logoColor=white" alt="Demo on YouTube"></a>
  <a href="https://github.com/sponsors/rinn7e"><img src="https://img.shields.io/github/sponsors/rinn7e?label=sponsors&logo=githubsponsors&color=db2777" alt="GitHub Sponsors"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rinn7e/claude-desktop-theme-tuner" alt="License: MIT"></a>
</p>

<p align="center">
  <img src="doc/screenshot.png" alt="The home: the knobs of each mode over the /theme-tuner command on the left, light and dark previews of Claude on the right">
</p>

## Quick start

1. Open [the app](https://rinn7e.com/claude-desktop-theme-tuner/), pick a
   preset, change any color.
2. Install the mod, in Claude Code:

   ```
   /plugin install rinn7e-theme-tuner --marketplace rinn7e/claude-desktop-theme-tuner
   ```

3. Click **Copy** in the app and paste the command into Claude Code. Done.

In the desktop app, install it with **+** next to the prompt, then
**Plugins**, **Add marketplace** `rinn7e/claude-desktop-theme-tuner`, **Add
plugin**.

## Commands

| Command                                | What it does               |
| -------------------------------------- | -------------------------- |
| `/theme-tuner`                         | opens the theme pane       |
| `/theme-tuner solarized-light dracula` | applies presets            |
| `/theme-tuner list`                    | lists the presets          |
| `/theme-tuner off`                     | back to the default colors |

`/tuner` works too. Or just ask Claude: "make it Solarized with a pink
accent".

## Features

- 34 presets: every code theme of Claude, plus Gruvbox and a few more
- Every color Claude lets you set, in light and dark
- A live preview that matches the real app
- Readability checks
- Share links, and setup files to save and load

## Let an AI agent do it

Give your agent the link and say what you want:

```
Use https://rinn7e.com/claude-desktop-theme-tuner/ to make a theme based on
Solarized Light with neon magenta accents.
```

## Old version

The first tuner (a DevTools snippet) still lives at
[`/legacy`](https://rinn7e.com/claude-desktop-theme-tuner/legacy). See
[doc/legacy.md](doc/legacy.md).

## Development

```bash
pnpm install
pnpm run dev
```

Everything else is in [doc/development.md](doc/development.md). Open work is
in the [issues](https://github.com/rinn7e/claude-desktop-theme-tuner/issues);
see [CONTRIBUTING.md](CONTRIBUTING.md).

## Support

Like it? [Sponsor me on GitHub](https://github.com/sponsors/rinn7e).

## License

MIT, see [LICENSE](LICENSE). Built on the idea of
[Clay](https://github.com/maximebories/claude-desktop-clay-theme) by Maxime
Bories ([LICENSE-clay](LICENSE-clay)). Code theme colors come from the VS Code
themes Shiki ships (MIT) and `@pierre/theme` (Apache-2.0,
[LICENSE-pierre](LICENSE-pierre)).
