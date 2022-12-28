/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../models/attachmentTypes';
import { MemberBe } from '../models/roomBeTypes';
import { WsEventType } from './wsEvents';

export type WsConversationEvent =
	| RoomCreatedEvent
	| RoomUpdatedEvent
	| RoomDeletedEvent
	| RoomOwnerChangedEvent
	| RoomPictureChangedEvent
	| RoomPictureDeletedEvent
	| RoomMemberAddedEvent
	| RoomMemberRemovedEvent
	| AttachmentAddedEvent
	| AttachmentRemovedEvent
	| RoomMutedEvent
	| RoomUnmutedEvent
	| UserPictureChangedEvent
	| UserPictureDeletedEvent
	| RoomHistoryClearedEvent;

type BasicConversationEvent = {
	id: string;
	from: string;
	sentDate: string;
	sessionId?: string;
};

export type RoomCreatedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_CREATED;
	roomId: string;
};

export type RoomUpdatedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_UPDATED;
	roomId: string;
	name: string;
	description: string;
};

export type RoomDeletedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_DELETED;
	roomId: string;
};

export type RoomOwnerChangedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_OWNER_CHANGED;
	roomId: string;
	userId: string;
	owner: boolean;
};

export type RoomPictureChangedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_PICTURE_CHANGED;
	roomId: string;
};

export type RoomPictureDeletedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_PICTURE_DELETED;
	roomId: string;
};

export type RoomMemberAddedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_MEMBER_ADDED;
	roomId: string;
	member: MemberBe;
};

export type RoomMemberRemovedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_MEMBER_REMOVED;
	roomId: string;
	userId: string;
};

export type RoomMutedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_MUTED;
	roomId: string;
};

export type RoomUnmutedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_UNMUTED;
	roomId: string;
};

export type RoomHistoryClearedEvent = BasicConversationEvent & {
	type: WsEventType.ROOM_HISTORY_CLEARED;
	roomId: string;
	clearedAt: string;
};

export type AttachmentAddedEvent = BasicConversationEvent & {
	type: WsEventType.ATTACHMENT_ADDED;
	roomId: string;
	attachment: Attachment;
};

export type AttachmentRemovedEvent = BasicConversationEvent & {
	type: WsEventType.ATTACHMENT_REMOVED;
	roomId: string;
	fileId: string;
};

export type UserPictureChangedEvent = BasicConversationEvent & {
	type: WsEventType.USER_PICTURE_CHANGED;
	userId: string;
};

export type UserPictureDeletedEvent = BasicConversationEvent & {
	type: WsEventType.USER_PICTURE_DELETED;
	userId: string;
};
