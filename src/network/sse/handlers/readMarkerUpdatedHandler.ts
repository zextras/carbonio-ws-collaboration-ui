/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { ReadMarkerUpdatedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles read marker updated events from SSE.
 * Updates the read status of messages in the store.
 */
export function handleReadMarkerUpdated(event: ReadMarkerUpdatedEvent): void {
	const { updateReadMarker, session } = useStore.getState();
	const { roomId, userId, messageId } = event;

	// Only update if it's from another user (our own read markers are handled locally)
	if (userId !== session.id) {
		updateReadMarker(roomId, userId, messageId);
	}

	console.log('[handleReadMarkerUpdated] User', userId, 'read message', messageId, 'in room', roomId);
}
