/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageEditedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles message edited events from SSE.
 * Updates the message text and sets the edited flag.
 */
export function handleMessageEdited(event: MessageEditedEvent): void {
	const { editMessage } = useStore.getState();
	const { roomId, message } = event;

	editMessage(roomId, message.id, message.text, true);

	console.log('[handleMessageEdited] Message edited:', message.id);
}
