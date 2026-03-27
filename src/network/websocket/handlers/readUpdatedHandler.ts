/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';

/**
 * Handles read-updated events from the WebSocket.
 * - If from another user: updates my messages' read status (shows blue checkmarks)
 * - If from myself (echoed back): clears the unread counter for the room
 */
export function handleWsReadUpdated(event: {
	roomId: string;
	userId: string;
	messageId: string;
}): void {
	const { updateReadMarker, setUnreadCount, session } = useStore.getState();
	const { roomId, userId, messageId } = event;

	if (userId !== session.id) {
		// Another user has read messages in this room
		updateReadMarker(roomId, userId, messageId);
	} else {
		// My own read marker echoed back - clear unread count
		setUnreadCount(roomId, 0);
	}
}
