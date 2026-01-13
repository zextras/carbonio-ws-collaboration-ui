/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useRef, useState } from 'react';

import { filter, findIndex, size, slice } from 'lodash';

import {
	getMyLastMarkerOfRoom,
	getRoomHasMarkers,
	getReadableMessagesSelector,
	getRoomUnreadSelector
} from '../../../store/selectors/ChatsRegistrySelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

const useFirstUnreadMessage = (roomId: string): string | undefined => {
	const unreadCount = useStore((store) => getRoomUnreadSelector(store, roomId));
	const myUserId = useStore(getUserId);
	const messages = useStore((store) => getReadableMessagesSelector(store, roomId));
	const hasConversationMarkers = useStore((store) => getRoomHasMarkers(store, roomId));
	const myLastMarker = useStore((store) => getMyLastMarkerOfRoom(store, roomId));

	const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | undefined>(undefined);
	const prevUnreadCountRef = useRef(unreadCount);

	// Reset on conversation change
	useEffect(() => setFirstUnreadMessageId(undefined), [roomId]);

	// Reset when unread count increases (new messages arrived)
	useEffect(() => {
		if (unreadCount > prevUnreadCountRef.current) {
			setFirstUnreadMessageId(undefined);
		}
		prevUnreadCountRef.current = unreadCount;
	}, [unreadCount]);

	useEffect(() => {
		// Don't calculate if it is already set or if necessary data aren't loaded
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
					// The first of them is the first unread text message
					if (size(othersMessages) > 0) {
						setFirstUnreadMessageId(othersMessages[0].id);
					}
				} else if (
					hasConversationMarkers &&
					myLastMarker == null &&
					size(messages) >= unreadCount
				) {
					// No last marker - first unread is the first message from others
					const unreadTextMessages = filter(messages, (message) => message.from !== myUserId);
					if (size(unreadTextMessages) > 0) {
						setFirstUnreadMessageId(unreadTextMessages[0].id);
					} else {
						setFirstUnreadMessageId('noUnread');
					}
				} else {
					// Calculate first unread based on unread count from the end
					const othersMessages = filter(messages, (message) => message.from !== myUserId);
					const firstUnreadIdx = Math.max(0, size(othersMessages) - unreadCount);
					if (size(othersMessages) > 0 && othersMessages[firstUnreadIdx]) {
						setFirstUnreadMessageId(othersMessages[firstUnreadIdx].id);
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
