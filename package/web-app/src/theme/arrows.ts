/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// The "Thin arrows" option. Claude draws its disclosure arrows with one glyph
// of its icon font (Anthropicons-Variable, U+F011, a filled triangle), turned
// by --cds-icon-rotate when the row opens. The option draws the font's thin
// chevron (U+E02A, the one the Context panel uses) in its place: the triangle
// is made transparent and the chevron painted over it in a ::before, so
// Claude's own rotation still turns it. Measured in Claude 4.16336.0 with
// snippets/arrows.snippet.js; see doc/claude-internals.md.

// CSS cannot select an element by the glyph it holds, so each place Claude
// draws the triangle is listed: section and project carets, sessions with
// nested sessions, file tree folders, collapsible panel rows, and the tool
// and status rows in the chat
const ARROW_SELECTORS = [
  '[data-cds="Icon"][data-group-caret]',
  '[data-container-icon] > [data-cds="Icon"]',
  '[data-cds="Icon"][data-tree-caret]',
  '[data-panel-open] [data-cds="Icon"][class~="group-hover/railtop:opacity-100"]',
  '[class~="group-hover/status:text-secondary"] > [data-cds="Icon"]',
]

const THIN_CHEVRON = '\\e02a'

export const thinArrowsCss = (): string => {
  const arrows = `:is(${ARROW_SELECTORS.join(', ')})`
  return `/* Thin arrows: Claude's chevron in place of its filled triangles */
${arrows} {
  position: relative;
  -webkit-text-fill-color: transparent;
}
${arrows}::before {
  content: "${THIN_CHEVRON}";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-text-fill-color: currentColor;
  font-weight: 400;
}`
}
