/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { produce } from 'immer';
import { filter, find, size } from 'lodash';
import { StateCreator } from 'zustand';

import { isMyId } from '../../network/websocket/eventHandlersUtilities';
import { Message, MessageType } from '../../types/store/MessageTypes';
import { RootStore, UnreadsCounterSlice } from '../../types/store/StoreTypes';
import { isBefore } from '../../utils/dateUtils';

export const useUnreadsCountStoreSlice: StateCreator<UnreadsCounterSlice> = (
	set: (...any: any) => void
) => ({
	unreads: {},
	addUnreadCount: (roomId: string, counter: number): void => {
		set(
			produce((draft: RootStore) => {
				const actualCounter = draft.unreads[roomId] || 0;
				draft.unreads[roomId] = actualCounter + counter;
			}),
			false,
			'UNREADS/ADD_UNREAD'
		);
	},
	incrementUnreadCount: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const actualCounter = draft.unreads[roomId] || 0;
				draft.unreads[roomId] = actualCounter + 1;
			}),
			false,
			'UNREADS/INCREMENT_UNREAD'
		);
	},
	updateUnreadCount: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const messages = draft.messages[roomId];
				const lastMarker =
					draft.markers[roomId] &&
					draft.session.id !== undefined &&
					draft.markers[roomId][draft.session.id];
				const lastMarkedMessage = find(
					messages,
					(message: Message) => lastMarker && message.id === lastMarker.messageId
				);
				const isConfigurationMessage = (type: MessageType): boolean =>
					type === MessageType.CONFIGURATION_MSG;
				const isTextMessageFromOther = (message: Message): boolean =>
					message.type === MessageType.TEXT_MSG && !isMyId(message.from);
				const isAfterLastMarker = (date: number): boolean => {
					if (!lastMarker) return true;
					const dateToCompare = lastMarkedMessage ? lastMarkedMessage.date : lastMarker.markerDate;
					return !isBefore(date, dateToCompare);
				};
				const unreadByMe = filter(
					messages,
					(message) =>
						(isConfigurationMessage(message.type) || isTextMessageFromOther(message)) &&
						isAfterLastMarker(message.date)
				);
				draft.unreads[roomId] = size(unreadByMe);
			}),
			false,
			'UNREADS/UPDATE_UNREAD'
		);
	}
});
