/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React, { useEffect, useState } from 'react'

import { isHex } from '../theme/color'

// A hex field that keeps what is typed until it is a full color, so a
// half-typed value is never thrown away or sent
export const HexInput = ({
  value,
  onChange,
  label = 'Hex color',
  isEmptyOk = false,
}: {
  value: string
  onChange: (hex: string) => void
  label?: string
  // An empty field is a value not set yet, not a mistake
  isEmptyOk?: boolean
}) => {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <input
      type='text'
      spellCheck={false}
      aria-label={label}
      value={draft}
      placeholder={isEmptyOk ? 'not set' : undefined}
      onChange={(e) => {
        const next = e.target.value.trim()
        setDraft(next)
        if (isHex(next)) onChange(next)
      }}
      onBlur={() => setDraft(value)}
      className={`w-[5.5rem] rounded-md border bg-ui-field px-[8px] py-[4px] font-mono text-xs uppercase outline-none placeholder:normal-case focus:border-ui-brand ${
        isHex(draft) || (isEmptyOk && draft === '')
          ? 'border-ui-line'
          : 'border-ui-bad'
      }`}
    />
  )
}
