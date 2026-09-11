/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { last } from 'lodash';

import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/ChatsRegistryTypes';
import { isBefore } from '../../../utils/dateUtils';

export function getLastUnreadMessage(roomId: string): string | undefined {
	const { session, chatsRegistry } = useStore.getState();
	const lastMessage = last(
		chatsRegistry[roomId]?.messages.filter(
			(message) =>
				message.type === MessageType.CONFIGURATION_MSG ||
				(message.type === MessageType.TEXT_MSG && message.from !== session.id)
		)
	);
	if (lastMessage) {
		const myMarkerLastReadAt = chatsRegistry[roomId]?.markers[session.id!]?.lastReadAt;
		if (myMarkerLastReadAt !== undefined) {
			if (!isBefore(lastMessage.date, myMarkerLastReadAt)) {
				return lastMessage.id;
			}
			return undefined;
		}
		return lastMessage.id;
	}
	return undefined;
}
