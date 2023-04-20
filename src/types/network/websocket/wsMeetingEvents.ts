/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WsEventType } from './wsEvents';

export type WsMeetingEvent =
	| MeetingCreatedEvent
	| MeetingJoinedEvent
	| MeetingLeftEvent
	| MeetingDeletedEvent
	| MeetingVideoStreamOpenedEvent
	| MeetingVideoStreamClosedEvent
	| MeetingAudioStreamOpenedEvent
	| MeetingAudioStreamClosedEvent
	| MeetingScreenStreamOpenedEvent
	| MeetingScreenStreamClosedEvent;

type BasicMeetingEvent = {
	id: string;
	from: string;
	sentDate: string;
	sessionId: string;
	meetingId: string;
};

export type MeetingCreatedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_CREATED;
	roomId: string;
};

export type MeetingJoinedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_JOINED;
};

export type MeetingLeftEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_LEFT;
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
