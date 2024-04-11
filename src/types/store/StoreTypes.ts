/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ActiveConversationsMap, FileToUpload, messageActionType } from './ActiveConversationTypes';
import {
	ActiveMeetingMap,
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	StreamsSubscriptionMap,
	Subscription,
	TileData
} from './ActiveMeetingTypes';
import { Connections } from './ConnectionsTypes';
import { FasteningsMap } from './FasteningMessagesTypes';
import { Marker, MarkersMap } from './MarkersTypes';
import { MeetingParticipant, MeetingsMap } from './MeetingTypes';
import {
	AttachmentMessageType,
	Message,
	MessageFastening,
	MessageMap,
	PlaceholderFields,
	TextMessage
} from './MessageTypes';
import { RoomsMap } from './RoomTypes';
import { CapabilityList, Session } from './SessionTypes';
import { UnreadsMap } from './UnreadsCounterTypes';
import { UsersMap } from './UserTypes';
import { MeetingBe } from '../network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../network/models/roomBeTypes';
import { UserBe } from '../network/models/userBeTypes';
import IWebSocketClient from '../network/websocket/IWebSocketClient';
import IXMPPClient from '../network/xmpp/IXMPPClient';

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
	setRoomNameAndDescription: (
		id: string,
		newName: string | undefined,
		newDescription: string | undefined
	) => void;
	setRoomMuted: (id: string) => void;
	setRoomUnmuted: (id: string) => void;
	addRoomMember: (id: string, member: MemberBe) => void;
	removeRoomMember: (id: string, userId: string | undefined) => void;
	promoteMemberToModerator: (id: string, userId: string) => void;
	demoteMemberFromModerator: (id: string, userId: string) => void;
	setClearedAt: (roomId: string, clearedAt: string) => void;
	setRoomPictureUpdated: (id: string, date: string) => void;
	setRoomPictureDeleted: (id: string) => void;
	setPlaceholderRoom: (userId: string) => void;
	replacePlaceholderRoom: (userId: string, newRoomId: string) => void;
};

export type MessagesStoreSlice = {
	messages: MessageMap;
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
};

export type SessionStoreSlice = {
	session: Session;
	setFilterHasFocus: (hasFocus: boolean) => void;
	setLoginInfo: (id: string, name: string, displayName?: string) => void;
	setSessionId: (sessionId: string) => void;
	setCapabilities: (capabilities: CapabilityList) => void;
	setSelectedRoomOneToOneGroup: (id: string) => void;
	setCustomLogo: (logo: string | false) => void;
};

export type MarkersStoreSlice = {
	markers: MarkersMap;
	updateMarkers: (roomId: string, markers: Marker[]) => void;
};

export type ActiveConversationsSlice = {
	activeConversations: ActiveConversationsMap;
	setDraftMessage: (roomId: string, sent: boolean, message?: string) => void;
	setIdMessageWhereScrollIsStopped: (roomId: string, messageId: string) => void;
	setInputHasFocus: (roomId: string, hasFocus: boolean) => void;
	setIsWriting: (roomId: string, userId: string, writingStatus: boolean) => void;
	setReferenceMessage: (
		roomId: string,
		referenceMessageId: string,
		senderId: string,
		stanzaId: string,
		actionType: messageActionType,
		attachment?: AttachmentMessageType
	) => void;
	unsetReferenceMessage: (roomId: string) => void;
	setHistoryIsFullyLoaded: (roomId: string) => void;
	setHistoryLoadDisabled: (roomId: string, status: boolean) => void;
	setActionsAccordionStatus: (roomId: string, status: boolean) => void;
	setParticipantsAccordionStatus: (roomId: string, status: boolean) => void;
	setFilesToAttach: (roomId: string, files: FileToUpload[]) => void;
	setFileFocusedToModify: (roomId: string, fileTempId: string, active: boolean) => void;
	addDescriptionToFileToAttach: (roomId: string, fileTempId: string, description: string) => void;
	removeDescriptionToFileToAttach: (roomId: string, fileTempId: string) => void;
	removeFileToAttach: (roomId: string, fileTempId: string) => void;
	unsetFilesToAttach: (roomId: string) => void;
	setForwardMessageList: (roomId: string, message: TextMessage) => void;
	unsetForwardMessageList: (roomId: string, message?: TextMessage) => void;
};

export type ConnectionsStoreSlice = {
	connections: Connections;
	setXmppClient: (xmppClient: IXMPPClient) => void;
	setWebSocketClient: (wsClient: IWebSocketClient) => void;
	setChatsBeStatus: (status: boolean) => void;
	setXmppStatus: (status: boolean) => void;
	setWebsocketStatus: (status: boolean) => void;
	resetXmppData: () => void;
};

export type UnreadsCounterSlice = {
	unreads: UnreadsMap;
	addUnreadCount: (roomId: string, counter: number) => void;
	incrementUnreadCount: (roomId: string) => void;
	updateUnreadCount: (roomId: string) => void;
};

export type FasteningMessagesSlice = {
	fastenings: FasteningsMap;
	addFastening: (fasteningMessage: MessageFastening) => void;
};

export type MeetingsSlice = {
	meetings: MeetingsMap;
	setMeetings: (meetings: MeetingBe[]) => void;
	addMeeting: (meeting: MeetingBe) => void;
	deleteMeeting: (meetingId: string) => void;
	startMeeting: (meetingId: string, startedAt: string) => void;
	stopMeeting: (meetingId: string) => void;
	addParticipant: (meetingId: string, participant: MeetingParticipant) => void;
	removeParticipant: (meetingId: string, userId: string) => void;
	changeStreamStatus: (
		meetingId: string,
		userId: string,
		stream: STREAM_TYPE,
		status: boolean
	) => void;
	setWaitingList: (meetingId: string, waitingList: string[]) => void;
	addUserToWaitingList: (meetingId: string, userId: string) => void;
	removeUserFromWaitingList: (meetingId: string, userId: string) => void;
	startRecording: (
		meetingId: string,
		startRecordingTimestamp: string,
		startRecordingUserId: string
	) => void;
	stopRecording: (meetingId: string) => void;
};

export type ActiveMeetingSlice = {
	activeMeeting: ActiveMeetingMap;
	setMeetingActionsAccordionStatus: (roomId: string, status: boolean) => void;
	setWaitingListAccordionStatus: (roomId: string, status: boolean) => void;
	setRecordingAccordionStatus: (roomId: string, status: boolean) => void;
	setMeetingParticipantsAccordionStatus: (roomId: string, status: boolean) => void;
	setMeetingChatVisibility: (meetingId: string, visibilityStatus: MeetingChatVisibility) => void;
	setMeetingViewSelected: (meetingId: string, viewType: MeetingViewType) => void;
	meetingConnection: (
		meetingId: string,
		audioStreamEnabled: boolean,
		selectedAudioDeviceId: string | undefined,
		videoStreamEnabled: boolean,
		selectedVideoDeviceId: string | undefined
	) => void;
	meetingDisconnection: (meetingId: string) => void;
	setLocalStreams: (meetingId: string, streamType: STREAM_TYPE, stream: MediaStream) => void;
	removeLocalStreams: (meetingId: string, streamType: STREAM_TYPE) => void;
	setMeetingSidebarStatus: (meetingId: string, status: boolean) => void;
	setSelectedDeviceId: (meetingId: string, streamType: STREAM_TYPE, deviceId: string) => void;
	setSubscribedTracks: (meetingId: string, streams: StreamsSubscriptionMap) => void;
	setIsCarouseVisible: (meetingId: string, status: boolean) => void;
	setPinnedTile: (meetingId: string, tile: TileData | undefined) => void;
	setTalkingUser: (meetingId: string, userId: string, isTalking: boolean) => void;
	setRemoveSubscription: (meetingId: string, subToRemove: Subscription) => void;
	setAddSubscription: (meetingId: string, subToAdd: Subscription) => void;
	setUpdateSubscription: (meetingId: string, subsToRequest: Subscription[]) => void;
	setDeleteSubscription: (meetingId: string, subIdToDelete: string) => void;
};

export type RootStore = UsersStoreSlice &
	RoomsStoreSlice &
	MessagesStoreSlice &
	SessionStoreSlice &
	MarkersStoreSlice &
	ActiveConversationsSlice &
	ConnectionsStoreSlice &
	UnreadsCounterSlice &
	FasteningMessagesSlice &
	MeetingsSlice &
	ActiveMeetingSlice;
