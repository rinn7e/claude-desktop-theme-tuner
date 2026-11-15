/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// Types for claude-graph.js, generated from Claude's make-colors.js

// Each token: one form for both modes, or [light, dark]
export const THEME_GRAPH: Record<string, string | [string, string]>

// The CSS value of a token for a mode, from the inputs of a look (its gray
// and role ramps); undefined for a name the graph does not know. Throws when
// the graph needs an input the look lacks.
export function evaluator(
  graph: Record<string, string | [string, string]>,
  inputs: Record<string, string>,
  dark: boolean,
): (name: string) => string | undefined
