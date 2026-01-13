/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { ReadMarkerUpdatedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles read marker updated events from SSE.
 * - If from another user: updates my messages' read status (shows blue checkmarks)
 * - If from myself (echoed back): clears the unread counter for the room
 */
export function handleReadMarkerUpdated(event: ReadMarkerUpdatedEvent): void {
	const { updateReadMarker, setUnreadCount, session } = useStore.getState();
	const { roomId, userId, messageId } = event;

	if (userId !== session.id) {
		// Another user has read messages in this room - update my messages' read status
		updateReadMarker(roomId, userId, messageId);
	} else {
		// This is my own read marker echoed back - clear unread count for this room
		setUnreadCount(roomId, 0);
	}
}
