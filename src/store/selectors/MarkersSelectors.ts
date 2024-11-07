/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, forEach } from 'lodash';

import { Marker } from '../../types/store/MarkersTypes';
import { MessageType } from '../../types/store/MessageTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { isBefore } from '../../utils/dateUtils';

export const getMyLastMarkerOfRoom = (store: RootStore, roomId: string): Marker | null => {
	if (store.session.id && store.markers[roomId] && store.markers[roomId][store.session.id]) {
		return store.markers[roomId][store.session.id];
	}
	return null;
};

export const getRoomHasMarkers = (store: RootStore, roomId: string): boolean =>
	!!store.markers[roomId];

export const getUsersReadingMessage = (
	store: RootStore,
	roomId: string,
	stanzaId: string
): string[] => {
	const messageDate = find(
		store.messages[roomId],
		(message) => message.type === MessageType.TEXT_MSG && message.stanzaId === stanzaId
	)?.date;
	const markers = store.markers[roomId];

	if (!messageDate) return [];
	const readBy: string[] = [];
	forEach(markers, (marker, userId: string) => {
		const markedMessage = find(
			store.messages[roomId],
			(message) => message.id === marker.messageId
		);
		const dateToCompare = markedMessage?.date || marker.markerDate;
		if (marker.from !== store.session.id && isBefore(messageDate, dateToCompare)) {
			readBy.push(userId);
		}
	});
	return readBy;
};
