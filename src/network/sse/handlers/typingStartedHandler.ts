/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { TypingStartedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles typing started events from SSE.
 * Updates the store with the user's composing status.
 */
export function handleTypingStarted(event: TypingStartedEvent): void {
	const { setIsWriting } = useStore.getState();
	const { roomId, userId } = event;

	setIsWriting(roomId, userId, true);

	console.log('[handleTypingStarted] User', userId, 'is typing in room', roomId);
}
