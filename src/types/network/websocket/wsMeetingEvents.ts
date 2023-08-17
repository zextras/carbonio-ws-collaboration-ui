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
	| MeetingAudioStreamEnabledEvent
	| MeetingAudioStreamClosedEvent
	| MeetingScreenStreamOpenedEvent
	| MeetingScreenStreamClosedEvent
	| MeetingMediaStreamChangedEvent;

type BasicMeetingEvent = {
	sentDate: string;
	meetingId: string;
};

export type MeetingCreatedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_CREATED;
	roomId: string;
};

export type MeetingStartedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_STARTED;
	starterUser: string;
};

export type MeetingJoinedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_JOINED;
	userId: string;
};

export type MeetingLeftEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_LEFT;
	userId: string;
};

export type MeetingStoppedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_STOPPED;
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

export type MeetingAudioStreamEnabledEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_AUDIO_STREAM_ENABLED;
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

export type MeetingMediaStreamChangedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_MEDIA_STREAM_CHANGED;
};
