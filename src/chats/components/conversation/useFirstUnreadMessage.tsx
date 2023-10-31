/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useState } from 'react';

import { filter, findIndex, size, slice } from 'lodash';

import {
	getMyLastMarkerOfRoom,
	getRoomHasMarkers
} from '../../../store/selectors/MarkersSelectors';
import { getReadableMessagesSelector } from '../../../store/selectors/MessagesSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getRoomUnreadsSelector } from '../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../store/Store';

const useFirstUnreadMessage = (roomId: string): string | undefined => {
	const unreadCount = useStore((store) => getRoomUnreadsSelector(store, roomId));
	const myUserId = useStore(getUserId);
	const messages = useStore((store) => getReadableMessagesSelector(store, roomId));
	const hasConversationMarkers = useStore((store) => getRoomHasMarkers(store, roomId));
	const myLastMarker = useStore((store) => getMyLastMarkerOfRoom(store, roomId));

	const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | undefined>(undefined);

	// Reset on conversation change
	useEffect(() => setFirstUnreadMessageId(undefined), [roomId]);

	useEffect(() => {
		// Don't calculate if it is just set once
		// or if necessary data aren't already loaded on local store
		if (!firstUnreadMessageId && myUserId && size(messages) > 0) {
			if (unreadCount > 0) {
				const lastMessageReadByMe = findIndex(
					messages,
					(message) => message.id === myLastMarker?.messageId
				);
				// If last message read by me exist on local store
				if (lastMessageReadByMe !== -1) {
					// Take only messages from other that come later (all unread messages)
					const unreadMessages = slice(messages, lastMessageReadByMe + 1);
					const othersMessages = filter(unreadMessages, (message) => message.from !== myUserId);
					// The fist of them is the fist unread text message
					if (size(othersMessages) > 0) {
						setFirstUnreadMessageId(othersMessages[0].id);
					}
					// There's no last message read by me inside local store and the message count is higher than the unread count
					// it means that it's a conversation in which I never have read a message
				} else if (
					hasConversationMarkers &&
					myLastMarker == null &&
					size(messages) >= unreadCount
				) {
					const unreadTextMessages = filter(messages, (message) => message.from !== myUserId);
					if (size(unreadTextMessages) > 0) {
						setFirstUnreadMessageId(unreadTextMessages[0].id);
					} else {
						setFirstUnreadMessageId('noUnread');
					}
				}
			} else {
				setFirstUnreadMessageId('noUnread');
			}
		}
	}, [firstUnreadMessageId, hasConversationMarkers, messages, myLastMarker, myUserId, unreadCount]);

	return firstUnreadMessageId;
};

export default useFirstUnreadMessage;
