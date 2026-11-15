/*
 * Copyright (C) 2026 Moremi Vannak
 * SPDX-License-Identifier: MIT
 */
import { Port, type Sub } from 'tea-cup-fp'

import { type Msg } from './type'

// A link opened in a tab that already has the tuner only changes the hash,
// which reloads nothing; the port passes it on
const hashChanges = new Port<string>()
window.addEventListener('hashchange', () =>
  hashChanges.send(window.location.hash),
)

export const subscriptions = (): Sub<Msg> =>
  hashChanges.subscribe((hash): Msg => ({ _tag: 'HashChanged', hash }))
