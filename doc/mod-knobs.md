# Mod look knobs

Everything a mod look can set through `$.theme.set({ colors, backdrop, overrideColorScheme })`,
and which of it the Theme Tuner mod (`package/claude-mod/`) sets. The home page of the web app
edits every knob the mod sets and writes them in the setup JSON, which the
mod takes in its pane, as `/tuner <JSON>` or through its `set_theme` tool.

Read from the mod API of Claude Code 2.1.325 (`look.md`, `make-colors.d.ts` and
the `ThemeSetArgs` types of the mod-authoring skill). The API is early access:
check these against the current types before building.

## How a look is made

A look is not written token by token. `makeColors(definition)`
(`package/claude-mod/hooks/make-colors.js`) takes a few seeds and derives about 100 design
system tokens per mode, then `$.theme.set({ colors: theme })` sends them.
Every knob below except the backdrop and `overrideColorScheme` is a field of
that definition.

## Colors (the `makeColors` definition)

| Knob            | Shape                                               | What it changes                                                             | Used now            |
| --------------- | --------------------------------------------------- | --------------------------------------------------------------------------- | ------------------- |
| `label`         | text, 1 to 64 characters                            | The name of the look in the pickers of Claude                               | yes                 |
| `id`            | lowercase id, up to 32 characters                   | The id of the look                                                          | yes (`theme-tuner`) |
| `light`, `dark` | a mode each, below                                  | The colors of that mode; a mode left out keeps the colors of Claude         | yes                 |
| `only`          | `light` or `dark`                                   | A look made for one mode: surfaces act as if `overrideColorScheme` named it | no                  |
| `codeTheme`     | `{ light, dark }`, ids of the code themes of Claude | The code highlighting per mode; Claude locks its picker for a mode it sets  | yes                 |
| `contrast`      | `more`                                              | Stronger borders and focus rings                                            | yes                 |
| `roles`         | the five roles, below                               | One color per role for both modes; a role of a mode replaces it there       | per mode only       |

### A mode (`light` or `dark`)

| Knob                          | Shape                                                        | What it changes                                     | Used now                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gray.anchors.surface-0`      | hex, required                                                | The darkest surface: the page and the sidebar       | yes (set, or the darker of frame and canvas)                                                                                                            |
| `gray.anchors.surface-1`      | hex                                                          | Cards                                               | yes (set, or the lighter of frame and canvas)                                                                                                           |
| `gray.anchors.surface-2`      | hex                                                          | Panels                                              | yes (set, or as surface-1)                                                                                                                              |
| `gray.anchors.surface-3`      | hex                                                          | Menus                                               | when set (otherwise derived: a dark surface-3 as light as the raised color of a preset fails the contrast check; in light mode it must equal surface-2) |
| `gray.anchors.text-primary`   | hex, required                                                | The strongest text                                  | yes (set, or text)                                                                                                                                      |
| `gray.anchors.text-secondary` | hex                                                          | Labels, list rows, the thinking of Claude           | yes (set, or textSecondary)                                                                                                                             |
| `gray.anchors.text-muted`     | hex                                                          | Hints, timestamps                                   | yes (set, or textMuted)                                                                                                                                 |
| `gray.stops`                  | `{ step: hex }` on the gray ramp (0 lightest to 900 darkest) | The whole gray ramp, for finer control than anchors | no                                                                                                                                                      |
| `roles`                       | the five roles, below                                        | The roles of this mode alone                        | yes (the accent always, the others when set)                                                                                                            |
| `git`                         | the seven git colors, below                                  | Diffs and pull request badges                       | when set                                                                                                                                                |

### Roles

Each role is a hex seed, or `{ seed, stops, fillShade }` for finer control. The
design system keeps the hue of a seed and sets the lightness.

| Role      | What it colors                  | Code highlighting it drives | Used now |
| --------- | ------------------------------- | --------------------------- | -------- |
| `accent`  | Links, buttons, focus, progress | keywords                    | yes      |
| `danger`  | Errors, destructive actions     | names                       | when set |
| `success` | Success marks                   | strings                     | when set |
| `warning` | Warnings                        | variables                   | when set |
| `pro`     | Pro and plan marks              | literals                    | when set |

Keep the meaning: `danger` stays a red, `success` a green, `warning` an amber,
tuned toward the look.

### Git colors (inside a mode)

`added`, `removed`, `modified`, `merged`, `closed`, `conflicting`, `draft`:
one hex each, for diffs and pull request states. `makeColors` refuses `git` at
the top level of the definition. The mod sends those a mode sets.

## Backdrop (`$.theme.set({ backdrop })`)

What is behind the conversation. One of:

| Kind     | Shape                                   | Notes                                                                                                                                                                                           |
| -------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color    | `{ color }`                             | A raw color, or a design system name such as `surface-0`, which follows the mode                                                                                                                |
| Gradient | `{ gradient: { stops, angle, shape } }` | 2 to 16 colors, or `{ at, color }` stops from 0 to 1; `shape` is `linear` or `radial`; `size` and `repeat` tile it                                                                              |
| Vector   | `{ vector: { viewBox, paths } }`        | SVG path data, each path with an optional color; tiles like a gradient                                                                                                                          |
| Image    | `{ image: { source, size, repeat } }`   | A JPEG or PNG in the mod folder, at most 1 MiB and 4096 on a side; about 2560 wide for a photo; `size` and `repeat` tile it                                                                     |
| Scene    | `{ scene, glass }`                      | An animated SVG drawn by a `ui.render` hook on `Backdrop`, under 131,072 characters, animated with CSS in its own `<style>`, no script; `preserveAspectRatio="xMidYMid slice"` fills any screen |

`glass` (scenes only) is `{ blur, tint, opacity }` or `false`: how panels are
frosted over the backdrop. `blur` is 0 to 64 points (default 16), `tint` a raw
color (default the panel color), `opacity` 0 to 1 (default 0.6).

The mod sends a color or a gradient backdrop from the setup JSON. A vector
backdrop is plain data too and would fit it. An image needs its file in the mod folder, so a picked image
would have to ship with the mod or come from a fixed set. A scene is code (an
SVG with CSS), so the mod would offer a fixed set of scenes by name, as the
`theme-examples` plugin of Anthropic does.

## How Claude paints the sidebar

Read from the CSS of Claude (5.11492) with `snippets/mod-look.snippet.js` and
a probe of the sidebar variables:

- Light: `color-mix(in srgb, surface-0 50%, surface-1)`. The tuner sends
  `surface-0` as far below the frame as the canvas is above it
  (`sidebarBase` in `package/claude-mod/hooks/look.ts`), so the sidebar comes
  out as the frame of the preset.
- Dark: `color-mix(in srgb, page 80%, black)`, the page being `surface-1`. No
  anchor moves it apart from the conversation.
- Both modes check `--cds-fizzy-lake-color-sidebar` first, which a mod look
  does not set.
- On a Mac with transparency on, the sidebar is drawn at 72% over the macOS
  glass: `#eee8d5` was measured as `#ede8dc` over a light glass of about
  `#eae8ee`. The setup option `compensateGlass` aims the light sidebar so
  that it shows as the frame through that glass (`throughGlass`); the home
  preview lays the same glass under its light sidebar.

## The sidebar is translucent

The sidebar of Claude is a native macOS vibrancy panel, and Claude paints the
look over it semi-transparent, so what is behind the window shows through: a
look sending `#eee8d5` drew `#efebe0` on screen, and `#151515` drew `#171719`
over a purple wallpaper. A look has no knob for the opacity. The snippet makes
the sidebar opaque with CSS; with the mod alone, the exact color shows only
with macOS Reduce transparency on (System Settings, Accessibility, Display).

## Other

| Knob                  | Shape             | What it changes                                 | Used now |
| --------------------- | ----------------- | ----------------------------------------------- | -------- |
| `overrideColorScheme` | `light` or `dark` | Forces the mode of the app while the look is on | no       |

## Rules that fail with no error

- A problem from `makeColors` starting `Desktop won't paint` makes Desktop
  ignore the whole look. The usual cause: text too close to a surface,
  often a dark `surface-3`. `fitLook` (`package/claude-mod/hooks/look.ts`) lifts the primary
  text where that is the cause.
- In both modes `surface-0` is the darkest surface and each later one is as
  light or lighter; in light mode `surface-2` and `surface-3` match where both
  are given; `text-secondary` is at least as strong as `text-muted`.
- A wrong token name in `colors`, or a scene with no `Backdrop` render hook,
  draws nothing and says nothing.

## What a preset gives

The 13 palette roles of a preset map to the knobs above as follows, under the
knobs a mode sets directly; the rest are derived by `makeColors` or left to
Claude:

| Palette role                                                | Knob                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frame`, `canvas`                                           | `surface-1`/`surface-2` the lighter; `surface-0` the darker, in light mode set so the sidebar mixes to the frame                                                                                                                 |
| `text`, `textSecondary`, `textMuted`                        | `text-primary`, `text-secondary`, `text-muted`                                                                                                                                                                                   |
| `accent`, `accentHover`                                     | `roles.accent` of the mode: the seed, with the steps Claude paints links (600 in light mode, 300 in dark), buttons (450) and their hover (400) set to the accent and the hover accent; a step Claude refuses is left to its ramp |
| `raised`, `pressed`, `line`, `onAccent`, `selected`, `wash` | not sent: derived by `makeColors` (Claude draws a selected row and the message bubble from the text color)                                                                                                                       |
| the preset id                                               | `codeTheme`, where Claude has a code theme of that name, unless the setup sets one (`null` for none)                                                                                                                             |
