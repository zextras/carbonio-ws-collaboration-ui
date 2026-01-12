/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { PresenceChangedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles presence changed events from SSE.
 * Updates the user's online/offline status in the store.
 */
export function handlePresenceChanged(event: PresenceChangedEvent): void {
	const { setUserPresence } = useStore.getState();
	const { userId, online, lastActivityAt } = event;

	setUserPresence(userId, online, lastActivityAt);

	console.log('[handlePresenceChanged] User', userId, 'is now', online ? 'online' : 'offline');
}
