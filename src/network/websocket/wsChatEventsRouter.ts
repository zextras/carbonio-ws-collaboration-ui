/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isMyId } from './eventHandlersUtilities';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import type { WsEvent } from '../../types/network/websocket/wsEvents';
import { wsDebug } from '../../utils/debug';
import { wscSdk } from '../sdk/wscSdk';

/**
 * Entry point for the WSC-pure chat events (backend >= 2.0.0). The migration
 * steps wire each event into the SDK decoder; until then the events are only
 * observable in debug, so a 2.0.0 environment stays quiet but inspectable.
 */
export function wsChatEventsRouter(event: WsEvent): void {
	if (event.type === WsEventType.PRESENCE_CHANGED) {
		// v1 parity: the logged user's own echo never writes the store (the v1
		// presence handler only re-announced presence there, a no-op on v2)
		if (isMyId(event.userId)) {
			return;
		}
		wscSdk.handlePresenceChanged({ userId: event.userId, online: event.online }).catch((err) => {
			console.error('wsChatEventsRouter: presence hydration failed', err);
		});
		return;
	}
	wsDebug('Chat event (SDK not wired yet):', event);
}
