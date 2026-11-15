/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */

// Color math on #rrggbb strings: everything the theme derives from a palette

export interface Rgb {
  r: number
  g: number
  b: number
}

export const isHex = (value: string): boolean => /^#[0-9a-f]{6}$/i.test(value)

export const parseHex = (hex: string): Rgb => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
})

export const toHex = ({ r, g, b }: Rgb): string =>
  '#' +
  [r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')

// `amount` of b mixed into a (0 = a, 1 = b)
export const mix = (a: string, b: string, amount: number): string => {
  const x = parseHex(a)
  const y = parseHex(b)
  return toHex({
    r: x.r + (y.r - x.r) * amount,
    g: x.g + (y.g - x.g) * amount,
    b: x.b + (y.b - x.b) * amount,
  })
}

export const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// claude.ai's older tokens and the Code tab's gray scale take HSL triples:
// "h s% l%", used as hsl(var(--bg-000))
export const hslTriple = (hex: string): string => {
  const { r, g, b } = parseHex(hex)
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === R) h = ((G - B) / d) % 6
    else if (max === G) h = (B - R) / d + 2
    else h = (R - G) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const f = (v: number) => v.toFixed(1)
  return `${f(h)} ${f(s * 100)}% ${f(l * 100)}%`
}

// WCAG 2 relative luminance and contrast ratio
const channel = (v: number) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export const luminance = (hex: string): number => {
  const { r, g, b } = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
