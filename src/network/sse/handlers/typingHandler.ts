/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { TypingEvent } from '../../../types/network/models/chatTypes';

/**
 * Timeout duration in milliseconds before a user is considered to have stopped typing.
 * This should be longer than the ping interval (5s) to account for network latency.
 */
const TYPING_TIMEOUT_MS = 10000;

/**
 * Map of active typing timeouts: roomId -> userId -> timeoutId
 */
const typingTimeouts: Map<string, Map<string, ReturnType<typeof setTimeout>>> = new Map();

/**
 * Handles typing ping events from SSE.
 * Each ping refreshes the timeout - if no ping is received for 10 seconds,
 * the user is automatically removed from the typing list.
 */
export function handleTyping(event: TypingEvent): void {
	const { setIsWriting } = useStore.getState();
	const { roomId, userId } = event;

	// Clear existing timeout for this user in this room
	const roomTimeouts = typingTimeouts.get(roomId);
	if (roomTimeouts) {
		const existingTimeout = roomTimeouts.get(userId);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}
	}

	// Add user to typing list (setIsWriting handles duplicates)
	setIsWriting(roomId, userId, true);

	// Set new timeout to remove user after 10 seconds of no pings
	const timeout = setTimeout(() => {
		setIsWriting(roomId, userId, false);

		// Cleanup timeout reference
		const roomTimeoutsToClean = typingTimeouts.get(roomId);
		if (roomTimeoutsToClean) {
			roomTimeoutsToClean.delete(userId);
			if (roomTimeoutsToClean.size === 0) {
				typingTimeouts.delete(roomId);
			}
		}

		console.log('[handleTyping] User', userId, 'typing timeout expired in room', roomId);
	}, TYPING_TIMEOUT_MS);

	// Store the timeout reference
	if (!typingTimeouts.has(roomId)) {
		typingTimeouts.set(roomId, new Map());
	}
	typingTimeouts.get(roomId)!.set(userId, timeout);

	console.log('[handleTyping] User', userId, 'is typing in room', roomId);
}

/**
 * Clears all typing timeouts. Call this when disconnecting from SSE.
 */
export function clearAllTypingTimeouts(): void {
	typingTimeouts.forEach((roomTimeouts) => {
		roomTimeouts.forEach((timeout) => clearTimeout(timeout));
	});
	typingTimeouts.clear();
}
