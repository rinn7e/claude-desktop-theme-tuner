/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

export const STYLE_ID = 'claude-theme-tuner-theme'

// The style element of the earlier Solarized-only snippet
// (universal-theme-tuner), removed so the two never stack
const LEGACY_STYLE_ID = 'user-solarized-light-theme'

// The CSS as a JavaScript template literal, kept multi-line so the snippet
// reads as plain CSS (a one-line escaped string looks like obfuscated code).
// Backslashes, backticks and "${" are escaped so the text stays inert.
export const templateLiteral = (text: string): string =>
  '`' +
  text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') +
  '`'

// Where the glass watcher is kept on window, so a rerun or the revert command
// can find it
const GLASS_KEY = '__claudeThemeTunerGlassOff'
const MOTION_KEY = '__claudeThemeTunerReduceMotion'

export interface SnippetOptions {
  // Turn off the translucent sidebar glass (macOS vibrancy), which makes
  // WindowServer re-blur the desktop on every repaint
  glassOff: boolean
  // Turn on the app's own reduce-motion guard: its looping animations (the
  // "working" text shimmer above all) cost a lot of GPU while Claude works
  reduceMotion: boolean
}

// Claude's CSS already hides its six infinite animations (text shimmer, dot
// pulse, skeletons, flipbook, ...) under [data-reduce-motion=true], but
// nothing in the app sets that attribute. The shimmer is a masked gradient
// four times the text's width, re-rendered every frame while Claude works:
// see anthropics/claude-code#94003. The attribute is put back if the app
// ever drops it.
const reduceMotionCode = `
  // Reduce motion: switch on the app's own guard for its looping animations
  const html = document.documentElement;
  html.dataset.reduceMotion = "true";
  if (!window.${MOTION_KEY}) {
    window.${MOTION_KEY} = new MutationObserver(() => {
      if (html.dataset.reduceMotion !== "true") html.dataset.reduceMotion = "true";
    });
    window.${MOTION_KEY}.observe(html, { attributes: true, attributeFilter: ["data-reduce-motion"] });
    console.log("[theme] reduced motion");
  }`

// Uses the app's own vibrancy API (what the page calls itself). The page asks
// for the glass again whenever the sidebar opens, so it is cleared again
// after each open or close: twice, as the page's request lands a moment later.
const glassOffCode = `
  // Turn off the translucent sidebar glass, and keep it off
  const glass = window["claude.windowVibrancy"]?.WindowVibrancy;
  if (glass && !window.${GLASS_KEY}) {
    const clearGlass = () => {
      for (const ms of [60, 700]) setTimeout(() => glass.clear().catch(() => {}), ms);
    };
    const watcher = new MutationObserver(clearGlass);
    watcher.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-collapsed", "data-sidebar-vibrancy"],
    });
    window.${GLASS_KEY} = watcher;
    clearGlass();
    console.log("[theme] sidebar glass off");
  }`

// Wraps the theme CSS into the script pasted into the Claude app's DevTools.
// Running it again replaces the theme in place.
export const themeSnippet = (
  css: string,
  { glassOff, reduceMotion }: SnippetOptions = {
    glassOff: false,
    reduceMotion: false,
  },
): string => `// Claude desktop theme, made with Claude Desktop Theme Tuner.
// Paste into the Claude app's DevTools: Sources > Snippets > + New snippet, run with Cmd+Enter.
(() => {
  const ID = ${JSON.stringify(STYLE_ID)};
  const css = ${templateLiteral(css)};
  document.getElementById(${JSON.stringify(LEGACY_STYLE_ID)})?.remove();
  let el = document.getElementById(ID);
  if (!el) {
    el = document.createElement("style");
    el.id = ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
  if (!el.dataset.pinned) {
    el.dataset.pinned = "1";
    // Keep the override last in <head> so stylesheets loaded later do not outrank it
    // (only while it is in the page, so the revert command can remove it).
    new MutationObserver(() => {
      if (el.isConnected && document.head.lastElementChild !== el) document.head.appendChild(el);
    }).observe(document.head, { childList: true });
  }
  console.log("[theme] applied", css.length, "chars of CSS");${reduceMotion ? reduceMotionCode : ''}${glassOff ? glassOffCode : ''}
})();
`

// Undoes the theme until the next run: removes the CSS, gives the animations
// back, and stops the glass watcher (the page brings the glass back the next
// time the sidebar opens)
export const REVERT_COMMAND = `document.getElementById(${JSON.stringify(STYLE_ID)})?.remove(); window.${MOTION_KEY}?.disconnect(); delete window.${MOTION_KEY}; delete document.documentElement.dataset.reduceMotion; window.${GLASS_KEY}?.disconnect(); delete window.${GLASS_KEY}`
