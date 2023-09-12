/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WsEventType } from './wsEvents';
import { STREAM_TYPE } from '../../store/ActiveMeetingTypes';

export type WsMeetingEvent =
	| MeetingCreatedEvent
	| MeetingStartedEvent
	| MeetingJoinedEvent
	| MeetingLeftEvent
	| MeetingStoppedEvent
	| MeetingDeletedEvent
	| MeetingAudioStreamChangedEvent
	| MeetingMediaStreamChangedEvent
	| MeetingAudioAnsweredEvent
	| MeetingSDPOfferedEvent
	| MeetingSDPAnsweredEvent
	| MeetingParticipantStreamsEvent
	| MeetingParticipantTalkingEvent
	| MeetingParticipantClashedEvent;

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

export type MeetingAudioStreamChangedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_AUDIO_STREAM_CHANGED;
	active: boolean;
	userId: string; // ora è sessionId
};

export type MeetingMediaStreamChangedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_MEDIA_STREAM_CHANGED;
	userId: string;
	mediaType: STREAM_TYPE.VIDEO | STREAM_TYPE.SCREEN;
	active: boolean;
};

export type MeetingAudioAnsweredEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_AUDIO_ANSWERED;
	userId: string;
	sdp: string;
};

export type MeetingSDPOfferedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_SDP_OFFERED;
	userId: string;
	sdp: string;
	mediaType: STREAM_TYPE.VIDEO | STREAM_TYPE.SCREEN;
};

export type MeetingSDPAnsweredEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_SDP_ANSWERED;
	userId: string;
	sdp: string;
	mediaType: STREAM_TYPE.VIDEO | STREAM_TYPE.SCREEN;
};

export type MeetingParticipantStreamsEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_PARTICIPANT_STREAMS;
	userId: string;
	streams: { user_id: string; type: STREAM_TYPE }[];
};

export type MeetingParticipantTalkingEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_PARTICIPANT_TALKING;
	userId: string;
	isTalking: boolean;
};

export type MeetingParticipantClashedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_PARTICIPANT_CLASHED;
	userId: string;
	isTalking: boolean;
};
