/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { dateToTimestamp } from '../../../utils/dateUtils';

/**
 * Handles read-updated events from the WebSocket.
 * - If from another user: updates my messages' read status (shows blue checkmarks)
 * - If from myself (echoed back): clears the unread counter for the room
 */
export function handleWsReadUpdated(event: {
	roomId: string;
	userId: string;
	lastReadAt: string;
}): void {
	const { updateReadMarker, setUnreadCount, session } = useStore.getState();
	const { roomId, userId, lastReadAt } = event;

	if (userId !== session.id) {
		updateReadMarker(roomId, userId, dateToTimestamp(lastReadAt));
	} else {
		setUnreadCount(roomId, 0);
	}
}
