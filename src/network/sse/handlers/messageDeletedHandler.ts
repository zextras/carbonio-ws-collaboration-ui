/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageDeletedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles message deleted events from SSE.
 * Marks the message as deleted and clears its text.
 */
export function handleMessageDeleted(event: MessageDeletedEvent): void {
	const { deleteMessage } = useStore.getState();
	const { roomId, messageId } = event;

	deleteMessage(roomId, messageId);

	console.log('[handleMessageDeleted] Message deleted:', messageId);
}
