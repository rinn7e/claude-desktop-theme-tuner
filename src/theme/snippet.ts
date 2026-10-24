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

// Wraps the theme CSS into the script pasted into the Claude app's DevTools.
// Running it again replaces the theme in place.
export const themeSnippet = (
  css: string,
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
    // Keep the override last in <head> so stylesheets loaded later do not outrank it.
    new MutationObserver(() => {
      if (document.head.lastElementChild !== el) document.head.appendChild(el);
    }).observe(document.head, { childList: true });
  }
  console.log("[theme] applied", css.length, "chars of CSS");
})();
`

// Undoes the theme until the next run
export const REVERT_COMMAND = `document.getElementById(${JSON.stringify(STYLE_ID)})?.remove()`
