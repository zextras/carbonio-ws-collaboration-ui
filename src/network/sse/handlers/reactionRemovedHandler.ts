/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { ReactionRemovedEvent } from '../../../types/network/models/chatTypes';
import { MessageFastening, MessageType } from '../../../types/store/ChatsRegistryTypes';

/**
 * Handles reaction removed events from SSE.
 * Removes the reaction fastening from the message.
 */
export function handleReactionRemoved(event: ReactionRemovedEvent): void {
	const { addFastening } = useStore.getState();
	const { roomId, messageId, userId, reaction } = event;

	// Use 'retract' action to remove the reaction
	const fastening: MessageFastening = {
		id: `${messageId}-${userId}-${reaction}-retract`,
		roomId,
		type: MessageType.FASTENING,
		date: Date.now(),
		originalStanzaId: messageId,
		action: 'retract',
		value: reaction,
		from: userId
	};

	addFastening(fastening);

	console.log('[handleReactionRemoved] Reaction removed:', reaction, 'from message:', messageId);
}
