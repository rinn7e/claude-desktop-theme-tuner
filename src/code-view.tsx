/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import React from 'react'

hljs.registerLanguage('javascript', javascript)

// Highlighting is cheap, but tab switches and copy confirmations re-render the
// same text, so the last result is kept
let last = { text: '', html: '' }

// highlight.js escapes the code, so its HTML is safe to insert
export const highlightJs = (text: string): string => {
  if (text !== last.text) {
    last = {
      text,
      html: hljs.highlight(text, { language: 'javascript' }).value,
    }
  }
  return last.html
}

export const codeView = (text: string) => (
  // Long lines wrap softly; copying still takes the exact text
  <pre className='app-scroll hljs min-h-0 flex-1 overflow-auto px-[16px] py-[12px] font-mono text-[0.75rem] leading-relaxed whitespace-pre-wrap wrap-anywhere'>
    <code dangerouslySetInnerHTML={{ __html: highlightJs(text) }} />
  </pre>
)
