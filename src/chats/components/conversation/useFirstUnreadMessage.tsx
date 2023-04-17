/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, findIndex, size, slice } from 'lodash';
import { useEffect, useState } from 'react';

import { getMyLastMarkerOfConversation } from '../../../store/selectors/MarkersSelectors';
import { getMessagesSelector } from '../../../store/selectors/MessagesSelectors';
import { getRoomUnreadsSelector } from '../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/MessageTypes';

const useFirstUnreadMessage = (roomId: string): string | undefined => {
	const unreadCount = useStore((store) => getRoomUnreadsSelector(store, roomId));
	const myUserId = useStore((store) => store.session.id);
	const messages = useStore((store) => getMessagesSelector(store, roomId));
	const myLastMarker = useStore((store) => getMyLastMarkerOfConversation(store, roomId));

	const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | undefined>(undefined);

	// Reset on conversation change
	useEffect(() => setFirstUnreadMessageId(undefined), [roomId]);

	useEffect(() => {
		// Don't calculate if it is just set once
		// or if necessary data aren't already loaded on local store
		if (!firstUnreadMessageId && myUserId && size(messages) > 0 && myLastMarker) {
			if (unreadCount > 0) {
				const lastMessageReadByMe = findIndex(
					messages,
					(message) => message.id === myLastMarker.messageId
				);
				// If last message read by me exist on local store
				if (lastMessageReadByMe !== -1) {
					// Take only messages text messages from other that come later (all unread text messages)
					const unreadMessages = slice(messages, lastMessageReadByMe + 1);
					const othersMessages = filter(
						unreadMessages,
						(message) =>
							(message.type === MessageType.TEXT_MSG || message.type === MessageType.DELETED_MSG) &&
							message.from !== myUserId
					);
					// The fist of them is the fist unread text message
					if (size(othersMessages) > 0) {
						setFirstUnreadMessageId(othersMessages[0].id);
					}
				}
			} else {
				setFirstUnreadMessageId('noUnread');
			}
		}
	}, [firstUnreadMessageId, messages, myLastMarker, myUserId, unreadCount]);

	return firstUnreadMessageId;
};

export default useFirstUnreadMessage;
