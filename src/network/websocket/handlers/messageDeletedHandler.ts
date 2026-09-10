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
	deletedBy: string;
	deletedAt: string;
}): void {
	const { deleteMessage } = useStore.getState();
	const { roomId, messageId, deletedBy, deletedAt } = event;

	deleteMessage(roomId, messageId, deletedBy, deletedAt);
}
