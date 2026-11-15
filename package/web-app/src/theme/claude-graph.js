// Generated from package/claude-mod/hooks/make-colors.js (the design
// system graph of Claude and its resolver) by test/claude-graph.test.ts:
// do not edit. `pnpm test -u` writes it again.

var THEME_GRAPH = {
  border: "alpha-2",
  "alpha-2": "@neutral-900/10",
  "neutral-900": ["gray-900", "gray-0"],
  "border-accent": ["role-accent-250", "role-accent-700"],
  "border-danger": ["role-danger-250", "role-danger-700"],
  "border-success": ["role-success-250", "role-success-700"],
  "border-warning": ["role-warning-250", "role-warning-700"],
  "border-pro": ["role-pro-250", "role-pro-700"],
  "border-git-added": "color-mix(in srgb, {text-git-added} 40%, transparent)",
  "border-git-removed": "color-mix(in srgb, {text-git-removed} 40%, transparent)",
  "border-git-modified": "color-mix(in srgb, {text-git-modified} 40%, transparent)",
  "border-git-merged": "color-mix(in srgb, {text-git-merged} 40%, transparent)",
  "border-git-closed": "color-mix(in srgb, {text-git-closed} 40%, transparent)",
  "border-git-conflicting": "color-mix(in srgb, {text-git-conflicting} 40%, transparent)",
  "border-git-draft": "color-mix(in srgb, {text-git-draft} 40%, transparent)",
  "border-strong": "alpha-3",
  "alpha-3": "@neutral-900/20",
  "border-stronger": "@neutral-900/40",
  "shadow-sm": "0 1px 2px 0 {@gray-900/6}, 0 2px 8px 0 {shadow-color}",
  "shadow-color": ["@gray-900/8", "'rgba(0, 0, 0, 0.24)"],
  "shadow-md": "0 2px 4px 0 {@gray-900/7}, 0 6px 16px 0 {shadow-color}",
  "shadow-lg": "0 4px 8px 0 {@gray-900/8}, 0 12px 28px -2px {shadow-color}",
  "shadow-drop-ring": "inset 0 0 0 2px {fill-accent}",
  "fill-accent": "role-accent-fill",
  "shadow-drop-ring-danger": "inset 0 0 0 2px {fill-danger}",
  "fill-danger": "role-danger-fill",
  "shadow-drop-glow": "inset 0 0 24px -2px {@fill-accent/20}",
  "shadow-drop-glow-danger": "inset 0 0 24px -2px {@fill-danger/20}",
  "ring-color": ["border", "alpha-2"],
  "focus-shadow": ["inset 0 0 0 1px {page-bg}, 0 0 0 1px {fill-accent}, 0 0 6px 1px {bg-accent}", "inset 0 0 0 1px {page-bg}, 0 0 0 1px {fill-accent}, 0 0 6px 1px {@role-accent-600/60}"],
  "page-bg": "surface-0",
  "surface-0": ["gray-20", "gray-900"],
  "bg-accent": ["role-accent-100", "role-accent-800"],
  "focus-shadow-danger": ["inset 0 0 0 1px {page-bg}, 0 0 0 1px {fill-danger}, 0 0 6px 1px {bg-danger}", "inset 0 0 0 1px {page-bg}, 0 0 0 1px {fill-danger}, 0 0 6px 1px {@role-danger-600/60}"],
  "bg-danger": ["role-danger-100", "role-danger-800"],
  "pictogram-highlight-default": ["gray-80", "gray-650"],
  "neutral-0": ["gray-0", "gray-900"],
  "neutral-10": ["gray-10", "gray-890"],
  "neutral-20": ["gray-20", "gray-880"],
  "neutral-30": ["gray-30", "gray-870"],
  "neutral-40": ["gray-40", "gray-860"],
  "neutral-50": ["gray-50", "gray-850"],
  "neutral-60": ["gray-60", "gray-840"],
  "neutral-70": ["gray-70", "gray-830"],
  "neutral-80": ["gray-80", "gray-820"],
  "neutral-90": ["gray-90", "gray-810"],
  "neutral-100": ["gray-100", "gray-800"],
  "neutral-150": ["gray-150", "gray-750"],
  "neutral-200": ["gray-200", "gray-700"],
  "neutral-250": ["gray-250", "gray-650"],
  "neutral-300": ["gray-300", "gray-600"],
  "neutral-350": ["gray-350", "gray-550"],
  "neutral-400": ["gray-400", "gray-500"],
  "neutral-450": "gray-450",
  "neutral-500": ["gray-500", "gray-400"],
  "neutral-550": ["gray-550", "gray-350"],
  "neutral-600": ["gray-600", "gray-300"],
  "neutral-650": ["gray-650", "gray-250"],
  "neutral-700": ["gray-700", "gray-200"],
  "neutral-750": ["gray-750", "gray-150"],
  "neutral-800": ["gray-800", "gray-100"],
  "neutral-810": ["gray-810", "gray-90"],
  "neutral-820": ["gray-820", "gray-80"],
  "neutral-830": ["gray-830", "gray-70"],
  "neutral-840": ["gray-840", "gray-60"],
  "neutral-850": ["gray-850", "gray-50"],
  "neutral-860": ["gray-860", "gray-40"],
  "neutral-870": ["gray-870", "gray-30"],
  "neutral-880": ["gray-880", "gray-20"],
  "neutral-890": ["gray-890", "gray-10"],
  "alpha-0": "@neutral-900/0",
  "alpha-1": "@neutral-900/5",
  "alpha-4": "@neutral-900/35",
  "alpha-5": "@neutral-900/50",
  "alpha-6": "@neutral-900/60",
  "alpha-7": "@neutral-900/70",
  "alpha-8": "@neutral-900/85",
  "alpha-9": "@neutral-900/95",
  "surface-1": ["gray-10", "gray-850"],
  "surface-2": ["gray-0", "gray-830"],
  "surface-3": ["gray-0", "gray-800"],
  "surface-popover": "surface-3",
  "surface-panel": "surface-2",
  "fill-accent-hover": "role-accent-fill-hover",
  "fill-danger-hover": "role-danger-fill-hover",
  "fill-success": "role-success-fill",
  "fill-success-hover": "role-success-fill-hover",
  "fill-warning": "role-warning-fill",
  "fill-warning-hover": "role-warning-fill-hover",
  "fill-pro": "role-pro-fill",
  "fill-pro-hover": "role-pro-fill-hover",
  "fill-git-removed": "text-git-removed",
  "fill-primary": "neutral-900",
  "fill-primary-hover": ["neutral-750", "gray-100"],
  "fill-secondary": ["'hsl(0 0% 100% / 0.1)", "alpha-2"],
  "fill-secondary-hover": ["alpha-1", "@neutral-900/14"],
  "fill-secondary-ring": ["border", "'transparent"],
  "fill-secondary-pressed-ring": "border",
  "fill-field": ["'hsl(0 0% 100% / 0.5)", "alpha-1"],
  "fill-field-ring": "border",
  "fill-ghost-hover": ["alpha-1", "@neutral-900/7.5"],
  "fill-ghost-selected": ["alpha-2", "@neutral-900/15"],
  "fill-disabled": "alpha-1",
  "fill-control": "alpha-2",
  "fill-control-hover": "alpha-3",
  "bg-accent-muted": "color-mix(in srgb, {fill-accent} 10%, transparent)",
  "bg-success": ["role-success-100", "role-success-800"],
  "bg-warning": ["role-warning-100", "role-warning-800"],
  "bg-pro": ["role-pro-100", "role-pro-800"],
  "bg-git-added": "color-mix(in srgb, {text-git-added} 20%, transparent)",
  "bg-git-removed": "color-mix(in srgb, {text-git-removed} 20%, transparent)",
  "bg-git-modified": "color-mix(in srgb, {text-git-modified} 20%, transparent)",
  "bg-git-merged": "color-mix(in srgb, {text-git-merged} 20%, transparent)",
  "bg-git-closed": "color-mix(in srgb, {text-git-closed} 20%, transparent)",
  "bg-git-conflicting": "color-mix(in srgb, {text-git-conflicting} 20%, transparent)",
  "bg-git-draft": "color-mix(in srgb, {text-git-draft} 20%, transparent)",
  "bg-highlight": "color-mix(in srgb, {fill-warning} 33%, transparent)",
  "bg-editor-canvas": "neutral-60",
  "bg-editor-highlight-yellow": "bg-highlight",
  "bg-editor-highlight-gray": "color-mix(in srgb, {gray-300} 33%, transparent)",
  "bg-editor-collaborator-6": "color-mix(in srgb, {editor-collaborator-6} 22%, transparent)",
  "editor-collaborator-6": "gray-500",
  "bg-editor-comment": "color-mix(in srgb, {fill-warning} 20%, transparent)",
  "bg-editor-comment-active": "color-mix(in srgb, {fill-warning} 45%, transparent)",
  "bg-neutral": "alpha-1",
  "bg-neutral-hover": "alpha-2",
  "bg-user-message": "bg-neutral",
  "text-accent": ["role-accent-600", "role-accent-300"],
  "text-danger": ["role-danger-600", "role-danger-300"],
  "text-success": ["role-success-600", "role-success-400"],
  "text-warning": ["role-warning-600", "role-warning-300"],
  "text-pro": ["role-pro-600", "role-pro-300"],
  "text-primary": ["neutral-900", "gray-50"],
  "text-secondary": ["neutral-600", "gray-200"],
  "text-muted": ["neutral-400", "gray-400"],
  "text-disabled": "alpha-4",
  "on-primary": "neutral-0",
  "on-accent": "role-accent-on",
  "on-danger": "role-danger-on",
  "on-success": "role-success-on",
  "on-warning": "role-warning-on",
  "on-pro": "role-pro-on",
  "chart-diverging-4": ["gray-50", "gray-700"],
  "chart-muted": ["gray-200", "gray-550"],
  "chart-reference": ["gray-400", "gray-350"],
  "chart-reference-tint": ["@gray-400/15", "@gray-350/15"],
  "chart-grid": "alpha-2",
  "chart-axis": ["gray-200", "gray-700"],
  "chart-baseline": ["gray-200", "gray-700"]
};

var RGB = [0, 1, 2];
function channelsOf(fn, name, hex) {
  let digits = /^#([0-9a-fA-F]{6})$/.exec(hex)?.[1];
  if (digits === void 0)
    throw Error(`${fn}: ref "${name}" resolved to ${JSON.stringify(hex)} — ` + "expected a 6-digit hex. Chain through a palette stop.");
  let n = parseInt(digits, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function evalExpr(expr, literalOf, nameOf) {
  switch (expr.op) {
    case "ref":
      return literalOf(expr.ref);
    case "alpha":
      return `rgba(${channelsOf("atAlpha", nameOf(expr.ref), literalOf(expr.ref)).join(", ")}, ${expr.pct / 100})`;
    case "unmix": {
      let a = expr.pct / 100, c = channelsOf("unmix", nameOf(expr.ref), literalOf(expr.ref));
      return `rgba(${RGB.map((i) => Math.round(Math.min(255, Math.max(0, (c[i] - expr.k[i]) / a)))).join(", ")}, ${a})`;
    }
    case "css": {
      let out = expr.strings[0] ?? "";
      for (let [i, part] of expr.parts.entries())
        out += evalExpr(part, literalOf, nameOf) + (expr.strings[i + 1] ?? "");
      return out;
    }
  }
}

var NAME = /^[a-z][a-z0-9-]*$/;
function parseForm(text) {
  let part = (s) => {
    let [ref = "", a = "", b = ""] = s.slice(1).split("/");
    if (s.startsWith("@"))
      return { op: "alpha", ref, pct: Number(a) };
    if (s.startsWith("~")) {
      let [r = 0, g = 0, bl = 0] = a.split(",").map(Number);
      return { op: "unmix", ref, k: [r, g, bl], pct: Number(b) };
    }
    return { op: "ref", ref: s };
  };
  if (text.startsWith("'"))
    return { op: "css", strings: [text.slice(1)], parts: [] };
  if (NAME.test(text) || /^[@~]/.test(text))
    return part(text);
  let pieces = text.split(/\{([^}]*)\}/);
  return {
    op: "css",
    strings: pieces.filter((_, i) => i % 2 === 0),
    parts: pieces.filter((_, i) => i % 2 === 1).map(part)
  };
}
function evaluator(graph, inputs, dark) {
  let known = /* @__PURE__ */ new Map, literalOf = (name) => {
    let seen = known.get(name);
    if (seen !== void 0)
      return seen;
    let entry = Object.hasOwn(graph, name) ? graph[name] : void 0, form = typeof entry === "string" ? entry : entry?.[dark ? 1 : 0], value = form === void 0 ? Object.hasOwn(inputs, name) ? inputs[name] : void 0 : evalExpr(parseForm(form), literalOf, (r) => r);
    if (value === void 0)
      throw Error(`The theme graph reads ${name}, which is neither a theme input nor in the graph. This is a bug in make-colors.js.`);
    return known.set(name, value), value;
  };
  return (name) => Object.hasOwn(graph, name) || Object.hasOwn(inputs, name) ? literalOf(name) : void 0;
}

export { THEME_GRAPH, evaluator }
