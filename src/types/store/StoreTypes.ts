/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MemberBe, RoomBe } from '../network/models/roomBeTypes';
import { UserBe } from '../network/models/userBeTypes';
import IWebSocketClient from '../network/websocket/IWebSocketClient';
import IXMPPClient from '../network/xmpp/IXMPPClient';
import { ActiveConversationsMap, messageActionType } from './ActiveConversationTypes';
import { Connections } from './ConnectionsTypes';
import { Marker, MarkersMap } from './MarkersTypes';
import { MessageMap, Message, TextMessage } from './MessageTypes';
import { RoomsMap } from './RoomTypes';
import { CapabilityList, Session } from './SessionTypes';
import { UnreadsMap } from './UnreadsCounterTypes';
import { UsersMap } from './UserTypes';

export type UsersStoreSlice = {
	users: UsersMap;
	setUserInfo: (user: UserBe) => void;
	setUserPresence: (id: string, presence: boolean) => void;
	setUserLastActivity: (id: string, date: number) => void;
	setUserStatusMessage: (id: string, statusMsg: string) => void;
	setUserPictureUpdated: (id: string, date: string) => void;
	setUserPictureDeleted: (id: string) => void;
};

export type RoomsStoreSlice = {
	rooms: RoomsMap;
	setRooms: (rooms: RoomBe[]) => void;
	addRoom: (room: RoomBe) => void;
	deleteRoom: (id: string) => void;
	setRoomName: (id: string, newName: string) => void;
	setRoomDescription: (id: string, newDescription: string) => void;
	setRoomNameAndDescription: (id: string, newName: string, newDescription: string) => void;
	setRoomMuted: (id: string) => void;
	setRoomUnmuted: (id: string) => void;
	addRoomMember: (id: string, member: MemberBe) => void;
	removeRoomMember: (id: string, userId: string | undefined) => void;
	promoteMemberToModerator: (id: string, userId: string) => void;
	demoteMemberFromModerator: (id: string, userId: string) => void;
	setClearedAt: (roomId: string, clearedAt: string) => void;
	setRoomPictureUpdated: (id: string, date: string) => void;
	setRoomPictureDeleted: (id: string) => void;
};

export type MessagesStoreSlice = {
	messages: MessageMap;
	newMessage: (message: Message) => void;
	newInboxMessage: (message: Message) => void;
	updateHistory: (roomId: string, messageArray: Message[]) => void;
	updateUnreadMessages: (roomId: string) => void;
	setRepliedMessage: (
		roomId: string,
		originalMessageId: string,
		repliedMessage: TextMessage
	) => void;
};

export type SessionStoreSlice = {
	session: Session;
	setLoginInfo: (id: string, name: string, displayName?: string) => void;
	setSessionId: (sessionId: string) => void;
	setCapabilities: (capabilities: CapabilityList) => void;
	setSelectedRoomOneToOneGroup: (id: string) => void;
	setUserPrefTimezone: (timezoneId: string) => void;
};

export type MarkersStoreSlice = {
	markers: MarkersMap;
	updateMarkers: (markers: Marker[], roomId: string) => void;
};

export type ActiveConversationsSlice = {
	activeConversations: ActiveConversationsMap;
	setDraftMessage: (roomId: string, sended: boolean, message?: string) => void;
	setIdMessageWhereScrollIsStopped: (roomId: string, messageId: string) => void;
	setPinnedMessage: (roomId: string, message: object) => void;
	setInputHasFocus: (roomId: string, hasFocus: boolean) => void;
	setIsWriting: (roomId: string, userId: string, writingStatus: boolean) => void;
	setReferenceMessage: (
		roomId: string,
		referenceMessageId: string,
		senderId: string,
		actionType: messageActionType
	) => void;
	unsetReferenceMessage: (roomId: string) => void;
	setHistoryIsFullyLoaded: (roomId: string) => void;
	setHistoryLoadDisabled: (roomId: string, status: boolean) => void;
	setActionsAccordionStatus: (roomId: string, status: boolean) => void;
	setParticipantsAccordionStatus: (roomId: string, status: boolean) => void;
};

export type ConnectionsStoreSlice = {
	connections: Connections;
	setXmppClient: (xmppClient: IXMPPClient) => void;
	setWebSocketClient: (wsClient: IWebSocketClient) => void;
	setChatsBeStatus: (status: boolean) => void;
	setXmppStatus: (status: boolean) => void;
	setWebsocketStatus: (status: boolean) => void;
};

export type UnreadsCounterSlice = {
	unreads: UnreadsMap;
	addUnreadCount: (roomId: string, counter: number) => void;
	incrementUnreadCount: (roomId: string) => void;
	updateUnreadCount: (roomId: string) => void;
};

export type SidebarSlice = {
	filterHasFocus: boolean;
	setFilterHasFocus: (hasFocus: boolean) => void;
};

export type RootStore = UsersStoreSlice &
	RoomsStoreSlice &
	MessagesStoreSlice &
	SessionStoreSlice &
	MarkersStoreSlice &
	ActiveConversationsSlice &
	ConnectionsStoreSlice &
	UnreadsCounterSlice &
	SidebarSlice;
