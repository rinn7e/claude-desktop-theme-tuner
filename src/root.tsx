/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import React from 'react'
import { createRoot } from 'react-dom/client'

import './asset/index.css'
import { AppProgram } from './program'

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<AppProgram />)
}
