/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { WsEvent } from '../../types/network/websocket/wsEvents';
import { wsDebug } from '../../utils/debug';

/**
 * Entry point for the WSC-pure chat events (backend >= 2.0.0). The migration
 * steps wire each event into the SDK decoder; until then the events are only
 * observable in debug, so a 2.0.0 environment stays quiet but inspectable.
 */
export function wsChatEventsRouter(event: WsEvent): void {
	wsDebug('Chat event (SDK not wired yet):', event);
}
