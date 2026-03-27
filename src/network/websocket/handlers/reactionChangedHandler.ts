/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import {
	FasteningAction,
	MessageFastening,
	MessageType
} from '../../../types/store/ChatsRegistryTypes';

/**
 * Handles reaction-changed events from the WebSocket.
 * Adds or removes a reaction fastening based on the 'added' flag.
 */
export function handleWsReactionChanged(event: {
	messageId: string;
	roomId: string;
	userId: string;
	reaction: string;
	added: boolean;
}): void {
	const { addFastening, removeFastening, incrementUnreadCount, decrementUnreadCount, session } =
		useStore.getState();
	const { roomId, messageId, userId, reaction, added } = event;

	const fasteningId = `${messageId}-${userId}-${reaction}`;

	if (added) {
		const fastening: MessageFastening = {
			id: fasteningId,
			roomId,
			type: MessageType.FASTENING,
			date: Date.now(),
			originalStanzaId: messageId,
			action: FasteningAction.REACTION,
			value: reaction,
			from: userId,
			stanzaId: fasteningId
		};

		addFastening([fastening]);

		if (session.id && userId !== session.id) {
			incrementUnreadCount(roomId, 1);
		}
	} else {
		removeFastening(roomId, messageId, fasteningId);

		if (session.id && userId !== session.id) {
			decrementUnreadCount(roomId, 1);
		}
	}
}
