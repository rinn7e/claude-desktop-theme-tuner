<p align="center">
  <img src="package/web-app/public/logo.svg" alt="Claude Desktop Theme Tuner logo" width="128" height="128">
</p>

<h1 align="center">Claude Desktop Theme Tuner V2</h1>

<p align="center">
  <a href="https://rinn7e.com/claude-desktop-theme-tuner/"><b>rinn7e.com/claude-desktop-theme-tuner</b></a>
</p>

<p align="center">
  Design a color theme for the Claude desktop app, in light and dark mode, and apply it with a Claude Code mod.
</p>

<p align="center">
  <a href="https://github.com/rinn7e/claude-desktop-theme-tuner/actions/workflows/pages.yml"><img src="https://github.com/rinn7e/claude-desktop-theme-tuner/actions/workflows/pages.yml/badge.svg" alt="Pages deploy"></a>
  <a href="https://rinn7e.com/claude-desktop-theme-tuner/"><img src="https://img.shields.io/badge/open%20the%20app-rinn7e.com-18181b" alt="Open the app"></a>
  <a href="https://www.youtube.com/watch?v=DfnZwI23iNM"><img src="https://img.shields.io/badge/demo-YouTube-ff0000?logo=youtube&logoColor=white" alt="Demo on YouTube"></a>
  <a href="https://github.com/sponsors/rinn7e"><img src="https://img.shields.io/github/sponsors/rinn7e?label=sponsors&logo=githubsponsors&color=db2777" alt="GitHub Sponsors"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rinn7e/claude-desktop-theme-tuner" alt="License: MIT"></a>
</p>

Tune every knob Claude gives a theme with a live preview of the app, then
[install the Theme Tuner mod](#theme-claude-code-with-the-mod) and send one
`/tuner` command: no DevTools, kept across restarts, shown on mobile too. Or
[let your AI agent design a theme for you](#design-a-theme-with-an-ai-agent).
The first tuner, with its DevTools snippet, lives on at
[`/legacy`](https://rinn7e.com/claude-desktop-theme-tuner/legacy) (see
[doc/legacy.md](doc/legacy.md)).

<p align="center">
  <img src="doc/screenshot.png" alt="The home: the knobs of each mode over the /tuner command on the left, light and dark previews of Claude on the right">
</p>

## Features

- **Presets:** one for every code theme in the "Code appearance" setting of
  Claude, in the same order: Claude Light and Dark (the own colors of Claude),
  GitHub (Light, Dark, Dark Dimmed), Pierre, VS Code, One Light and One Dark
  Pro, Catppuccin Latte and Mocha, Solarized, Vitesse, Min, Rosé Pine and Rosé
  Pine Dawn, Slack Ochin and Slack Dark, Dracula and Dracula Soft, Nord,
  Monokai, Tokyo Night, Night Owl and Ayu Dark. Plus Gruvbox Light and Dark,
  Groovy Lambda Black and Meadow Light.
- **Every knob of a mod look:** per mode the four surfaces, the three texts,
  the five roles (accent, danger, success, warning, pro), the seven git colors
  and the code theme (or none, which leaves the picker of Claude free); for
  both modes more contrast and a backdrop (a color or a gradient). Each knob
  shows the value sent and where it comes from, and **Reset to** a preset
  takes a mode back.
- **A preview that draws what Claude draws:** the page runs the own
  `makeColors` of Claude and the graph of its design system, so the light and
  dark previews show the real tokens: a diff and pull request states for the
  git colors, status marks and a Pro chip for the roles, code in the colors
  of the code theme, the stronger borders of more contrast. Checked against
  probes of the real app: all 219 color tokens match.
- **Close to the first tuner:** the mod sends each preset so that Claude
  draws it as the first tuner did: the sidebar in the frame color, links and
  buttons in the accent, and the light sidebar compensated for the
  translucent macOS glass (on by default).
- **Readability:** the WCAG pairs of each mode, and what Claude itself says:
  a look Claude would refuse, and why.
- **Easy to apply:** copy the `/tuner` command (the default tab) or the
  **Theme JSON**; the settings menu saves and loads setup files and copies a
  share link. Edits are kept in your browser.
- **Made for AI agents:** an agent can write the setup itself and apply it
  through the mod; see
  [Design a theme with an AI agent](#design-a-theme-with-an-ai-agent).

## Theme Claude Code with the mod

Claude Code on desktop can be themed by a mod (a plugin with hooks), and the
Theme Tuner is one. It lives in [`package/claude-mod/`](package/claude-mod/),
and this repository is its marketplace.

Install it once. At the prompt of a terminal session:

```
/plugin install theme-tuner --marketplace rinn7e/claude-desktop-theme-tuner
```

In the desktop app: click **+** next to the prompt, then **Plugins**, **Add
marketplace** with `rinn7e/claude-desktop-theme-tuner`, then **Add plugin**.

Then, in a Claude Code session:

- `/tuner <JSON>` applies a setup from the home page (**Copy**, on the
  `/tuner command` tab).
- `/tuner solarized-light dracula` applies presets by id, and changes only
  the modes it names (`/tuner list` names them).
- `/tuner` opens the pane of the mod: a preset for each mode, the knobs it
  sends, a **Theme JSON** box that takes a setup, a link or preset ids, and
  **Turn off**.
- Or ask Claude ("make it Solarized with a magenta accent"): the mod gives it
  a `set_theme` tool that takes the setup JSON.
- `/tuner off` goes back to the own colors of Claude.

## Design a theme with an AI agent

In a Claude Code session with the mod, just ask: Claude writes the setup JSON
and applies it with the `set_theme` tool, so you see each change in the app
at once and ask for the next one.

Elsewhere, give the agent the link and say what you want:

```
Use https://rinn7e.com/claude-desktop-theme-tuner/ to design a theme based on
Solarized Light with neon magenta accents.
```

The agent finds the "Agent guide" link in the title bar and reads
[llms.txt](package/web-app/public/llms.txt): the setup JSON and its knobs,
the rules Claude checks, and a link (`#theme=...`) that opens the home with a
setup, for you to look at and apply.

## How a look is made

A mod look is not written token by token: `makeColors`
(`package/claude-mod/hooks/make-colors.js`, the own file of Claude) takes a
few anchors and role seeds, and Claude derives about 100 design system tokens
from them. The mod (`package/claude-mod/hooks/look.ts`) turns a preset into
those anchors and seeds, and checks with `makeColors` that Claude paints the
result. Every knob, the rules Claude checks and what was measured in the
real app are in [doc/mod-knobs.md](doc/mod-knobs.md); how the app was probed
is in [doc/claude-internals.md](doc/claude-internals.md).

| File                                           | Role                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `package/claude-mod/hooks/look.ts`             | a setup to the look the mod sends, shared with the web app                             |
| `package/claude-mod/hooks/register.tsx`        | the `/tuner` command, the `set_theme` tool, the pane and the start of a session        |
| `package/web-app/src/screen/home-screen/`      | the home page: the knob editor, the code panel and preview v2                          |
| `package/web-app/src/theme/claude-graph.js`    | the graph and resolver of Claude, cut from `make-colors.js` by a snapshot test         |
| `package/web-app/src/theme/code-syntax.ts`     | the syntax colors of each code theme, generated by `pnpm --filter web-app code-syntax` |
| `package/web-app/snippets/mod-look.snippet.js` | for maintainers: reports which variables paint each part of the real app under a look  |

## Legacy: the first tuner

The first tuner, with its DevTools snippet, lives on at
[`/legacy`](https://rinn7e.com/claude-desktop-theme-tuner/legacy). It themes
the whole desktop app, not only Claude Code sessions. Its features, how it
compares with the mod, how to apply its snippet and how it works are in
[doc/legacy.md](doc/legacy.md).

## Development

A pnpm workspace: the web app is in `package/web-app`, the mod in
`package/claude-mod`. Node.js 24+ and pnpm, from the repository root:

```bash
pnpm install
pnpm run dev
```

Checks, from the root: `pnpm run check`, `pnpm run lint`,
`pnpm run format:check`, `pnpm run test`. The mod has its own, run by Claude
Code: `claude plugin validate package/claude-mod` and
`claude plugin test package/claude-mod`. Its presets
(`package/claude-mod/hooks/presets.ts`) are generated from the web app's: after changing a
preset, `pnpm test -u` writes them again. `package/claude-mod/hooks/make-colors.js` is
Claude's own, copied unchanged from the mod-authoring skill: copy it again
when Claude updates. `pnpm run build` writes a static site to `package/web-app/dist/`; every push
to `master` deploys it to GitHub Pages (`.github/workflows/pages.yml`). Follow the
[code convention](doc/code-convention.md). Open work is in the
[issues](https://github.com/rinn7e/claude-desktop-theme-tuner/issues); see
[CONTRIBUTING.md](CONTRIBUTING.md) for how to pick one up.

## Support

Built by [rinn7e](https://github.com/rinn7e). If the tuner is useful to you,
you can help keep it going by
[sponsoring me on GitHub](https://github.com/sponsors/rinn7e).

## Credits and license

MIT, see [LICENSE](LICENSE). Overriding the app's own variables is the approach
of [Clay](https://github.com/maximebories/claude-desktop-clay-theme) by Maxime
Bories (MIT, see [LICENSE-clay](LICENSE-clay)). Each preset credits the color
scheme it follows, in `package/web-app/src/theme/presets.ts`, `package/web-app/src/theme/code-themes.ts` and
in the app. The code-theme presets are mapped from the VS Code themes Shiki
ships (all MIT); Pierre's are from `@pierre/theme` (Apache-2.0, see
[LICENSE-pierre](LICENSE-pierre)).
