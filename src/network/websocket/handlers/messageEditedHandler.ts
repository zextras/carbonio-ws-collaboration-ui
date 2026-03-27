/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';

/**
 * Handles message-edited events from the WebSocket.
 * Updates the message text and sets the editedInfo.
 */
export function handleWsMessageEdited(event: {
	messageId: string;
	roomId: string;
	senderId: string;
	text: string;
	editedAt: string;
}): void {
	const { editMessage } = useStore.getState();
	const { roomId, messageId, text, editedAt } = event;

	editMessage(roomId, messageId, text, editedAt);
}
