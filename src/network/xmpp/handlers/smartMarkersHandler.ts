/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { Marker, MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { now } from '../../../utils/dateUtils';
import { getId, getResource } from '../utility/decodeJid';
import { getAttribute, getRequiredAttribute, getTagElement } from '../utility/decodeStanza';

export function onDisplayedMessageStanza(message: Element): true {
	const displayed = getTagElement(message, 'displayed');
	if (displayed) {
		const messageId = getAttribute(displayed, 'id');
		if (messageId) {
			const from = getRequiredAttribute(message, 'from');
			const roomId = getId(from);
			const store = useStore.getState();
			const messages = store.chatsRegistry[roomId]?.messages ?? [];
			const markedMessage = messages.find(
				(m) =>
					m.id === messageId ||
					(m.type === MessageType.TEXT_MSG && (m as TextMessage).stanzaId === messageId)
			);
			const lastReadAt = markedMessage?.date ?? now();
			const displayedMessage: Marker = {
				from: getId(getResource(from)),
				lastReadAt,
				type: 'displayed'
			};
			store.updateReadStatus(roomId, [displayedMessage]);
		}
	}
	return true;
}
