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
	ROOM_CREATED = 'ROOM_CREATED',
	ROOM_UPDATED = 'ROOM_UPDATED',
	ROOM_DELETED = 'ROOM_DELETED',
	ROOM_OWNER_PROMOTED = 'ROOM_OWNER_PROMOTED',
	ROOM_OWNER_DEMOTED = 'ROOM_OWNER_DEMOTED',
	ROOM_PICTURE_CHANGED = 'ROOM_PICTURE_CHANGED',
	ROOM_PICTURE_DELETED = 'ROOM_PICTURE_DELETED',
	ROOM_MEMBER_ADDED = 'ROOM_MEMBER_ADDED',
	ROOM_MEMBER_REMOVED = 'ROOM_MEMBER_REMOVED',
	ROOM_MUTED = 'ROOM_MUTED',
	ROOM_UNMUTED = 'ROOM_UNMUTED',
	USER_PICTURE_CHANGED = 'USER_PICTURE_CHANGED',
	USER_PICTURE_DELETED = 'USER_PICTURE_DELETED',
	ROOM_HISTORY_CLEARED = 'ROOM_HISTORY_CLEARED',
	MEETING_CREATED = 'MEETING_CREATED',
	MEETING_STARTED = 'MEETING_STARTED',
	MEETING_JOINED = 'MEETING_PARTICIPANT_JOINED',
	MEETING_LEFT = 'MEETING_PARTICIPANT_LEFT',
	MEETING_STOPPED = 'MEETING_STOPPED',
	MEETING_DELETED = 'MEETING_DELETED',
	MEETING_MEDIA_STREAM_CHANGED = 'meetingMediaStreamChanged',
	MEETING_VIDEO_STREAM_OPENED = 'meetingParticipantVideoStreamOpened',
	MEETING_VIDEO_STREAM_CLOSED = 'meetingParticipantVideoStreamClosed',
	MEETING_AUDIO_STREAM_ENABLED = 'meetingAudioStreamEnabled',
	MEETING_AUDIO_STREAM_CLOSED = 'meetingParticipantAudioStreamClosed',
	MEETING_SCREEN_STREAM_OPENED = 'meetingParticipantScreenStreamOpened',
	MEETING_SCREEN_STREAM_CLOSED = 'meetingParticipantScreenStreamClosed'
}

export type WsEvent = InitializationEvent | PongEvent | WsConversationEvent | WsMeetingEvent;

export type InitializationEvent = {
	type: WsEventType.INITIALIZATION;
	sessionId: string;
};

export type PongEvent = {
	type: WsEventType.PONG;
};
