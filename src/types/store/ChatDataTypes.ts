/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RoomFastenings } from './FasteningMessagesTypes';
import { Marker, RoomMarkers } from './MarkersTypes';
import { Message, MessageFastening, PlaceholderFields, TextMessage } from './MessageTypes';

export type ChatDataStoreSlice = {
	chatData: { [roomId: string]: ChatData };

	newMessage: (message: Message) => void;
	newInboxMessage: (message: Message) => void;
	updateHistory: (roomId: string, messageArray: Message[]) => void;
	addCreateRoomMessage: (roomId: string) => void;
	updateUnreadMessages: (roomId: string) => void;
	setRepliedMessage: (
		roomId: string,
		replyMessageId: string,
		messageSubjectOfReply: TextMessage
	) => void;
	setPlaceholderMessage: (fields: PlaceholderFields) => void;
	removePlaceholderMessage: (roomId: string, messageId: string) => void;

	addFastening: (fasteningMessage: MessageFastening) => void;

	updateMarkers: (roomId: string, markers: Marker[]) => void;

	addUnreadCount: (roomId: string, counter: number) => void;
	incrementUnreadCount: (roomId: string) => void;
	updateUnreadCount: (roomId: string) => void;
};

export type ChatData = {
	messages: Message[];
	fastenings: RoomFastenings;
	markers: RoomMarkers;
	unread: number;
};
