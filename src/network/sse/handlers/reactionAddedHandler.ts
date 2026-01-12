/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { ReactionAddedEvent } from '../../../types/network/models/chatTypes';
import { MessageFastening, MessageType } from '../../../types/store/ChatsRegistryTypes';

/**
 * Handles reaction added events from SSE.
 * Adds the reaction as a fastening to the message.
 */
export function handleReactionAdded(event: ReactionAddedEvent): void {
	const { addFastening } = useStore.getState();
	const { roomId, messageId, userId, reaction } = event;

	const fastening: MessageFastening = {
		id: `${messageId}-${userId}-${reaction}`,
		roomId,
		type: MessageType.FASTENING,
		date: Date.now(),
		originalStanzaId: messageId,
		action: 'apply',
		value: reaction,
		from: userId
	};

	addFastening(fastening);

	console.log('[handleReactionAdded] Reaction added:', reaction, 'to message:', messageId);
}
