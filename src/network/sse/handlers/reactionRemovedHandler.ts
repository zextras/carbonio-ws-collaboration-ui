/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { ReactionRemovedEvent } from '../../../types/network/models/chatTypes';

/**
 * Handles reaction removed events from SSE.
 * Removes the reaction fastening from the message.
 */
export function handleReactionRemoved(event: ReactionRemovedEvent): void {
	const { removeFastening } = useStore.getState();
	const { roomId, messageId, userId, reaction } = event;

	// The fastening ID matches the format used when adding reactions
	const fasteningId = `${messageId}-${userId}-${reaction}`;

	removeFastening(roomId, messageId, fasteningId);

	console.log('[handleReactionRemoved] Reaction removed:', reaction, 'from message:', messageId);
}
