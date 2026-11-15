<p align="center">
  <img src="public/logo.svg" alt="Claude Desktop Theme Tuner logo" width="128" height="128">
</p>

<h1 align="center">Claude Desktop Theme Tuner</h1>

<p align="center">
  Pick, tune and copy a color theme for the Claude desktop app, in light and dark mode.
</p>

<p align="center">
  <a href="https://github.com/rinn7e/claude-desktop-theme-tuner/actions/workflows/pages.yml"><img src="https://github.com/rinn7e/claude-desktop-theme-tuner/actions/workflows/pages.yml/badge.svg" alt="Pages deploy"></a>
  <a href="https://rinn7e.com/claude-desktop-theme-tuner/"><img src="https://img.shields.io/badge/open%20the%20app-rinn7e.com-18181b" alt="Open the app"></a>
  <a href="https://www.youtube.com/watch?v=DfnZwI23iNM"><img src="https://img.shields.io/badge/demo-YouTube-ff0000?logo=youtube&logoColor=white" alt="Demo on YouTube"></a>
  <a href="https://github.com/sponsors/rinn7e"><img src="https://img.shields.io/github/sponsors/rinn7e?label=sponsors&logo=githubsponsors&color=db2777" alt="GitHub Sponsors"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rinn7e/claude-desktop-theme-tuner" alt="License: MIT"></a>
</p>

Design a theme for the Claude desktop app with a live preview. The home page
designs it for the Theme Tuner mod of Claude Code: the surfaces, texts, roles,
git colors and code theme of each mode, the contrast and a backdrop, written as
a JSON setup the mod applies. The first tuner, at
[`/legacy`](https://rinn7e.com/claude-desktop-theme-tuner/legacy), tunes 13
colors and copies them as a DevTools snippet. Light and dark mode each get their
own theme, and the app follows your OS between them. Tested against Claude
desktop 3.6556.2 on macOS (the version is shown in the app's title bar).

**Open the app: [rinn7e.com/claude-desktop-theme-tuner](https://rinn7e.com/claude-desktop-theme-tuner/)**,
install the [Theme Tuner mod](#theme-claude-code-with-the-mod) to theme Claude
Code sessions with no DevTools, or
[let your AI agent design a theme for you](#design-a-theme-with-an-ai-agent).

<p align="center">
  <img src="doc/screenshot.png" alt="The tuner: customizer and snippet on the left, light and dark previews of the Claude app on the right">
</p>

## Video Showcase

[![Claude Desktop Theme Tuner: how to use it](https://img.youtube.com/vi/DfnZwI23iNM/maxresdefault.jpg)](https://www.youtube.com/watch?v=DfnZwI23iNM)

## Features

- **A designer for the mod (the home page):** per mode a preset, then each
  knob of Claude: the four surfaces, the three texts, the five roles, the
  seven git colors and the code theme; for both modes more contrast and a
  backdrop (a color or a gradient). Each knob shows the value sent and where
  it comes from. The page runs Claude's own `makeColors`, so it says when
  Claude would refuse the theme and why, and it copies the **Theme JSON** or
  a `/tuner` command. Edits are kept in your browser.

The first tuner, at `/legacy`:

- **Presets:** one for every code theme in Claude's "Code appearance" setting,
  in the same order, so the app can match its code blocks: Claude Light and
  Dark (Claude's own defaults, measured from the app), GitHub (Light, Dark,
  Dark Dimmed), Pierre, VS Code, One Light and One Dark Pro, Catppuccin Latte
  and Mocha, Solarized, Vitesse, Min, Rosé Pine and Rosé Pine Dawn, Slack
  Ochin and Slack Dark, Dracula and Dracula Soft, Nord, Monokai, Tokyo Night,
  Night Owl and Ayu Dark. Plus Gruvbox Light and Dark, Groovy Lambda Black
  and Meadow Light.
- **Tuning:** every color of a theme has a picker, with WCAG contrast checks for
  the text and accent pairs. Edits are kept in your browser.
- **Presets as files:** the gear menu saves both modes and the options to a
  JSON file and loads one back, to keep a theme or share it. Loaded names and
  links are cleaned, so a shared file can't slip extra CSS into the snippet.
- **Share links:** the gear menu's **Copy Share Link** puts the setup in the
  link itself (`#theme=...`, which never reaches the server); opening it loads
  the theme.
- **A Claude Code mod:** the
  [Theme Tuner mod](#theme-claude-code-with-the-mod) applies the presets and
  links with no DevTools, keeps them across restarts and shows them on mobile
  too.
- **Made for AI agents:** an agent can design themes for you and show you
  screenshots, without clicking through the page; see
  [Design a theme with an AI agent](#design-a-theme-with-an-ai-agent).
- **Preview:** mocks of the Claude app in light and dark mode at once, painted
  with the same variables the snippet sets.
- **Less GPU:** while Claude works, its looping animations (the shimmer on its
  working text above all) keep the GPU and macOS's WindowServer busy, see
  [anthropics/claude-code#94003](https://github.com/anthropics/claude-code/issues/94003).
  The **Reduce motion** option switches on Claude's own reduce-motion guard,
  which the app never sets; it roughly halved the GPU load in our test.
- **Thin arrows:** Claude's disclosure arrows (sidebar sections, sessions with
  nested sessions, the file tree, panels, the chat's tool rows) are a filled
  triangle that reads like the status dot beside it. The **Thin arrows**
  option draws Claude's own thin chevron in their place, in the same
  `<style>`.
- **Readable output:** the snippet is shown in full before you copy it. It adds
  one `<style>` element and nothing else, and its CSS reads as plain CSS.

## Design a theme with an AI agent

The tuner works with AI agents that can browse or run commands, such as
Claude Code, Claude Desktop's Code tab or Codex. Give one the link and say
what you want:

```
Use https://rinn7e.com/claude-desktop-theme-tuner/ to design a theme based on
Solarized Light with neon magenta accents, and show me screenshots of 5 styles.
```

The agent finds the "Agent guide" link in the tuner's title bar and reads
[llms.txt](package/web-app/public/llms.txt), which explains how to work without clicking
through the page:

1. It writes each theme as JSON (a preset plus the colors it changes; every
   preset's colors are in [presets.json](package/web-app/public/presets.json)) and checks the
   contrast rules the tuner's own presets follow.
2. It puts each theme in a link of the first tuner (`/legacy#theme=...`).
   With `&view=preview`, the link shows only the themed preview of Claude,
   which the agent screenshots.
3. It sends you the screenshots, each with its link. Open the one you like:
   the tuner loads it, and you apply it as below.

Applying stays your step: the snippet runs in your Claude app, so you copy and
run it yourself.

## Theme Claude Code with the mod

Claude Code on desktop can be themed by a mod (a plugin with hooks), and the
Theme Tuner is one: the same presets, kept across restarts and shown on
mobile too, with nothing pasted in DevTools. It lives in [`package/claude-mod/`](package/claude-mod/), and
this repository is its marketplace.

Install it once. At the prompt of a terminal session:

```
/plugin install theme-tuner --marketplace rinn7e/claude-desktop-theme-tuner
```

In the desktop app: click **+** next to the prompt, then **Plugins**, **Add
marketplace** with `rinn7e/claude-desktop-theme-tuner`, then **Add plugin**.

Then, in a Claude Code session:

- `/tuner` opens the mod: a preset for each mode, the colors of each with
  their keys, a **Theme JSON** box that takes a setup, a link or preset ids,
  and **Turn off**.
- `/tuner solarized-light dracula` applies presets by id, and changes only
  the modes it names (`/tuner list` names them); `/tuner <link>` applies a
  whole setup from the first tuner (its **How to apply** dialog and the
  gear menu copy that command); `/tuner <JSON>` applies a setup from the
  home page (**Copy /tuner command**).
- Or ask Claude ("make it Solarized with a magenta accent"): the mod gives it
  a `set_theme` tool that takes the setup JSON.
- `/tuner off` goes back to Claude's own colors.

The mod and the snippet differ in reach:

- The mod themes Claude Code sessions, in the desktop and mobile apps, and
  stays. The snippet themes the whole desktop app (the Chat tab and the full
  sidebar too) until Claude restarts, and alone has Thin arrows and Reduce
  motion.
- A mod look takes a few colors and Claude derives the rest: the sidebar and
  chat surfaces, the three texts and the accent go across, and the code
  theme of the preset's name (every preset that matches one of Claude's code
  themes sets it, except Claude's own colors, which leave the mode to the
  app). The snippet sets all 13 colors as they are.
- Claude refuses to paint a look whose text is too close to its
  backgrounds, so the mod checks each look with Claude's own `makeColors`
  and, where one would not paint, makes its text a little stronger and says
  so. Every preset paints (`package/web-app/test/mod-look.test.ts`).

## Apply a theme with the snippet

The app's **How to apply** button walks through it, with a screenshot of each
step (in `package/web-app/src/asset/how-to-apply/`):

1. Turn on Developer Mode once: in Claude, **Help > Troubleshooting > Enable
   Developer Mode**.
2. Copy the theme snippet.
3. In Claude, choose **Developer > Show Dev Tools** (Option+Cmd+I).
4. In DevTools open **Sources**, click **>>** next to Page and Workspace, and
   choose **Snippets**, then **+ New snippet**.
5. Paste it, press Cmd+S to keep it, then Cmd+Enter to run it. The Console
   says `[theme] applied`.

The theme lasts until Claude restarts; after that, run the saved snippet again.
The **Revert** tab has the one-line command that removes it.

## When a Claude update breaks the theme

Updates rename or add color variables, and the surfaces using them go back to
stock. Maintainers run `package/web-app/snippets/diagnose.snippet.js` in the Console the same
way, with DevTools undocked (docked DevTools narrows the window, which
collapses the sidebar). It copies a JSON report to the clipboard: what paints
each area, the color variables in use, the rules behind each sidebar, and
every surface still white or gray. Map the new names in `package/web-app/src/theme/tokens.ts`.
How Claude's UI is put together, and the traps met while debugging it, are in
[doc/claude-internals.md](doc/claude-internals.md).

## How it works

Claude's UI takes its colors from CSS variables: the design system's `--cds-*`,
claude.ai's older `--bg-*` and `--text-*` (HSL triples), and the Code tab
frame's `--df-*`. A theme is 13 semantic colors, and everything else is derived
from them.

| File                                               | Role                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package/web-app/src/theme/palette.ts`             | the semantic colors, their labels and the contrast pairs                                                                   |
| `package/web-app/src/theme/presets.ts`             | the hand-tuned presets, their order, and approximate stock colors for an unthemed mode                                     |
| `package/web-app/src/theme/code-themes.ts`         | the other code-theme presets, generated by `pnpm --filter web-app code-themes` (`package/web-app/scripts/code-themes.mjs`) |
| `package/web-app/src/theme/tokens.ts`              | maps a palette onto every Claude variable the snippet sets                                                                 |
| `package/web-app/src/theme/css.ts`                 | writes those variables under the light and dark selectors                                                                  |
| `package/web-app/src/theme/snippet.ts`             | wraps the CSS into the paste-able script                                                                                   |
| `package/web-app/src/preview/claude-mock.tsx`      | the preview, painted with the same variables                                                                               |
| `package/web-app/src/storage/preset-file.ts`       | the preset JSON file: saving, and checking a loaded one                                                                    |
| `package/web-app/snippets/diagnose.snippet.js`     | for maintainers: reports Claude's color variables after an update breaks the theme                                         |
| `package/web-app/snippets/stock-colors.snippet.js` | reads Claude's own default colors, for the Claude presets                                                                  |
| `package/web-app/snippets/arrows.snippet.js`       | lists every icon shape in Claude and where it shows, to find the bold arrows to restyle                                    |

Three quirks shape the CSS, each explained where it is handled in the code:

- Every declaration is `!important`, because Claude sets the same variables
  with selectors of up to five parts (its dark mode ones most of all).
- The frame re-sets its variables on its own sidebar and cards, so they are set
  there too.
- With macOS vibrancy the docked sidebar mixes a white tint over a transparent
  window, so the tint is set to the frame color at 100%.

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
to `main` deploys it to GitHub Pages (`.github/workflows/pages.yml`). Follow the
[code convention](doc/code-convention.md). Open work is in the
[future plan](doc/future-plan.md).

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
