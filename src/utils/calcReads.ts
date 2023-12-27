/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, forEach, size } from 'lodash';

import { isBefore } from './dateUtil';
import useStore from '../store/Store';
import { Marker, MarkerStatus, RoomMarkers } from '../types/store/MarkersTypes';
import { Message, TextMessage } from '../types/store/MessageTypes';
import { Member } from '../types/store/RoomTypes';

export function calcReads(messageDate: number, roomId: string): MarkerStatus {
	const roomMessages: Message[] = useStore.getState().messages[roomId];
	const roomMarkers: RoomMarkers = useStore.getState().markers[roomId];
	const members: Member[] | undefined = useStore.getState().rooms[roomId]?.members || [];

	let read: MarkerStatus = MarkerStatus.UNREAD;

	if (!!roomMarkers && size(members) > 0) {
		const readBy: string[] = [];
		forEach(roomMarkers, (marker: Marker, userId: string) => {
			const sessionId = useStore.getState().session.id;
			const markedMessage = find(
				roomMessages,
				(message: Message) => message.id === marker.messageId
			) as TextMessage;
			if (marker.from !== sessionId && markedMessage && isBefore(messageDate, markedMessage.date)) {
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
