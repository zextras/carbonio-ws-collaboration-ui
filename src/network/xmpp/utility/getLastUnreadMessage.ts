/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find, last } from 'lodash';

import useStore from '../../../store/Store';
import { Message, MessageType } from '../../../types/store/MessageTypes';
import { isBefore } from '../../../utils/dateUtils';

export function getLastUnreadMessage(roomId: string): string | undefined {
	const { session, chatData } = useStore.getState();
	const lastMessage = last(
		chatData[roomId]?.messages.filter(
			(message) =>
				message.type === MessageType.CONFIGURATION_MSG ||
				(message.type === MessageType.TEXT_MSG && message.from !== session.id)
		)
	);
	if (lastMessage) {
		const myMarker = chatData[roomId]?.markers[session.id!]?.messageId;
		if (myMarker) {
			const myMarkedMessage = find(
				chatData[roomId].messages,
				(message: Message) => message.id === myMarker
			);
			if (myMarkedMessage && !isBefore(lastMessage.date, myMarkedMessage?.date)) {
				return lastMessage.id;
			}
			return undefined;
		}
		return lastMessage.id;
	}
	return undefined;
}
