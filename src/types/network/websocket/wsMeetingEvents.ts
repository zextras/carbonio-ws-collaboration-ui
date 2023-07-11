/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WsEventType } from './wsEvents';

export type WsMeetingEvent =
	| MeetingCreatedEvent
	| MeetingStartedEvent
	| MeetingJoinedEvent
	| MeetingLeftEvent
	| MeetingStoppedEvent
	| MeetingDeletedEvent
	| MeetingVideoStreamOpenedEvent
	| MeetingVideoStreamClosedEvent
	| MeetingAudioStreamOpenedEvent
	| MeetingAudioStreamClosedEvent
	| MeetingScreenStreamOpenedEvent
	| MeetingScreenStreamClosedEvent;

type BasicMeetingEvent = {
	// id: event id
	id: string;
	// from: userId of sender
	from: string;
	sentDate: string;
	// sessionId: identifier of sender's session
	sessionId: string; // TODO for the moment, this sessionId is the userId
	meetingId: string;
};

export type MeetingCreatedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_CREATED;
	roomId: string;
};

export type MeetingStartedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_STARTED;
	roomId: string;
};

export type MeetingJoinedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_JOINED;
};

export type MeetingLeftEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_LEFT;
};

export type MeetingStoppedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_STOPPED;
	roomId: string;
};

export type MeetingDeletedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_DELETED;
};

export type MeetingVideoStreamOpenedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_VIDEO_STREAM_OPENED;
};

export type MeetingVideoStreamClosedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_VIDEO_STREAM_CLOSED;
};

export type MeetingAudioStreamOpenedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_AUDIO_STREAM_OPENED;
};

export type MeetingAudioStreamClosedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_AUDIO_STREAM_CLOSED;
};

export type MeetingScreenStreamOpenedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_SCREEN_STREAM_OPENED;
};

export type MeetingScreenStreamClosedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_SCREEN_STREAM_CLOSED;
};
