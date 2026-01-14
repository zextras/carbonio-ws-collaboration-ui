/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageEditedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles message edited events from SSE.
 * Updates the message text and sets the editedInfo.
 */
export function handleMessageEdited(event: MessageEditedEvent): void {
	const { editMessage } = useStore.getState();
	const { roomId, message } = event;

	const editedAt = message.editedInfo?.editedAt || new Date().toISOString();
	editMessage(roomId, message.id, message.text, editedAt);

	console.log('[handleMessageEdited] Message edited:', message.id);
}
