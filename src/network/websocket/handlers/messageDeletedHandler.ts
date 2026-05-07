/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';

/**
 * Handles message-deleted events from the WebSocket.
 * Marks the message as deleted (sets deleted=true) and clears its text.
 */
export function handleWsMessageDeleted(event: {
	messageId: string;
	roomId: string;
	senderId: string;
	deletedAt: string;
}): void {
	const { deleteMessage } = useStore.getState();
	const { roomId, messageId, senderId, deletedAt } = event;

	deleteMessage(roomId, messageId, senderId, deletedAt);
}
