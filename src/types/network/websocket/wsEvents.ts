/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WsConversationEvent } from './wsConversationEvents';
import { WsMeetingEvent } from './wsMeetingEvents';

export enum WsEventType {
	INITIALIZATION = 'websocketConnected',
	PONG = 'pong',
	ROOM_CREATED = 'roomCreated',
	ROOM_UPDATED = 'roomUpdated',
	ROOM_DELETED = 'roomDeleted',
	ROOM_OWNER_CHANGED = 'roomOwnerChanged',
	ROOM_PICTURE_CHANGED = 'roomPictureChanged',
	ROOM_PICTURE_DELETED = 'roomPictureDeleted',
	ROOM_MEMBER_ADDED = 'roomMemberAdded',
	ROOM_MEMBER_REMOVED = 'roomMemberRemoved',
	ROOM_MUTED = 'roomMuted',
	ROOM_UNMUTED = 'roomUnmuted',
	ROOM_HISTORY_CLEARED = 'roomHistoryCleared',
	ATTACHMENT_ADDED = 'attachmentAdded',
	ATTACHMENT_REMOVED = 'attachmentRemoved',
	USER_PICTURE_CHANGED = 'userPictureChanged',
	USER_PICTURE_DELETED = 'userPictureDeleted',
	MEETING_CREATED = 'meetingCreated',
	MEETING_JOINED = 'meetingParticipantJoined',
	MEETING_LEFT = 'meetingParticipantLeft',
	MEETING_DELETED = 'meetingDeleted'
}

export type WsEvent = InitializationEvent | PongEvent | WsConversationEvent | WsMeetingEvent;

export type InitializationEvent = {
	type: WsEventType.INITIALIZATION;
	sessionId: string;
};

export type PongEvent = {
	type: WsEventType.PONG;
	sessionId: string;
};
