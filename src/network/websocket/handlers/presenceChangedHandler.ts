/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';

/**
 * Handles presence-changed events from the WebSocket.
 * Updates the user's online/offline status in the store.
 */
export function handleWsPresenceChanged(event: { userId: string; online: boolean }): void {
	const { setUserPresence } = useStore.getState();
	const { userId, online } = event;

	setUserPresence(userId, online);
}
