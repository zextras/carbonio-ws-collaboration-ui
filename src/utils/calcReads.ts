/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, forEach, size } from 'lodash';

import { isBefore } from './dateUtils';
import useStore from '../store/Store';
import { Marker, MarkerStatus, Message, TextMessage } from '../types/store/ChatsRegistryTypes';
import { Member } from '../types/store/RoomTypes';

export function calcReads(
	messageDate: number,
	roomId: string,
	markers?: { [userId: string]: Marker }
): MarkerStatus {
	const store = useStore.getState();
	const roomMessages: Message[] = store.chatsRegistry[roomId]?.messages;
	const roomMarkers = markers || store.chatsRegistry[roomId]?.markers;
	const members: Member[] | undefined = store.rooms[roomId]?.members || [];
	const sessionId = store.session.id;

	let read: MarkerStatus = MarkerStatus.UNREAD;

	if (!!roomMarkers && size(members) > 0) {
		const readBy: string[] = [];
		forEach(roomMarkers, (marker: Marker, userId: string) => {
			const markedMessage = find(
				roomMessages,
				(message: Message) => message.id === marker.messageId
			) as TextMessage;
			const dateToCompare = markedMessage?.date || marker.markerDate;
			if (marker.from !== sessionId && isBefore(messageDate, dateToCompare)) {
				readBy.push(userId);
			}
		});

		if (size(readBy) > 0) {
			if (size(readBy) >= size(members) - 1) {
				read = MarkerStatus.READ;
			} else {
				read = MarkerStatus.READ_BY_SOMEONE;
			}
		}
	}
	return read;
}
