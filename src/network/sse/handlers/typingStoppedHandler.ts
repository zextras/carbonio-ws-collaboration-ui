/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { TypingStoppedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles typing stopped events from SSE.
 * Updates the store to clear the user's composing status.
 */
export function handleTypingStopped(event: TypingStoppedEvent): void {
	const { setIsWriting } = useStore.getState();
	const { roomId, userId } = event;

	setIsWriting(roomId, userId, false);

	console.log('[handleTypingStopped] User', userId, 'stopped typing in room', roomId);
}
