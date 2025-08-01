/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WsConversationEvent } from './wsConversationEvents';
import { WsMeetingEvent } from './wsMeetingEvents';

export enum WsEventType {
	INITIALIZATION = 'WebsocketConnected',
	PONG = 'Pong',
	ROOM_CREATED = 'RoomCreated',
	ROOM_UPDATED = 'RoomUpdated',
	ROOM_DELETED = 'RoomDeleted',
	ROOM_OWNER_PROMOTED = 'RoomOwnerPromoted',
	ROOM_OWNER_DEMOTED = 'RoomOwnerDemoted',
	ROOM_PICTURE_CHANGED = 'RoomPictureChanged',
	ROOM_PICTURE_DELETED = 'RoomPictureDeleted',
	ROOM_MEMBER_ADDED = 'RoomMemberAdded',
	ROOM_MEMBER_REMOVED = 'RoomMemberRemoved',
	ROOM_MUTED = 'RoomMuted',
	ROOM_UNMUTED = 'RoomUnmuted',
	ROOM_HISTORY_CLEARED = 'RoomHistoryCleared',
	MEETING_CREATED = 'MeetingCreated',
	MEETING_STARTED = 'MeetingStarted',
	MEETING_PARTICIPANT_JOINED = 'MeetingParticipantJoined',
	MEETING_PARTICIPANT_LEFT = 'MeetingParticipantLeft',
	MEETING_STOPPED = 'MeetingStopped',
	MEETING_DELETED = 'MeetingDeleted',
	MEETING_AUDIO_STREAM_CHANGED = 'MeetingAudioStreamChanged',
	MEETING_MEDIA_STREAM_CHANGED = 'MeetingMediaStreamChanged',
	MEETING_AUDIO_ANSWERED = 'MeetingAudioAnswered',
	MEETING_SDP_OFFERED = 'MeetingSdpOffered',
	MEETING_SDP_ANSWERED = 'MeetingSdpAnswered',
	MEETING_PARTICIPANT_SUBSCRIBED = 'MeetingParticipantSubscribed',
	MEETING_PARTICIPANT_TALKING = 'MeetingParticipantTalking',
	MEETING_PARTICIPANT_CLASHED = 'MeetingParticipantClashed',
	MEETING_WAITING_PARTICIPANT_JOINED = 'MeetingWaitingParticipantJoined',
	MEETING_WAITING_PARTICIPANT_ACCEPTED = 'MeetingWaitingParticipantAccepted',
	MEETING_WAITING_PARTICIPANT_REJECTED = 'MeetingWaitingParticipantRejected',
	MEETING_WAITING_PARTICIPANT_CLASHED = 'MeetingWaitingParticipantClashed',
	MEETING_RECORDING_STARTED = 'MeetingRecordingStarted',
	MEETING_RECORDING_STOPPED = 'MeetingRecordingStopped',
	MEETING_PARTICIPANT_HAND_RAISED = 'MeetingParticipantHandRaised',
	MEETING_PARTICIPANT_HAND_RAISED_LIST = 'MeetingParticipantHandRaisedList'
}

export type WsEvent = InitializationEvent | PongEvent | WsConversationEvent | WsMeetingEvent;

export type InitializationEvent = {
	type: WsEventType.INITIALIZATION;
	queueId: string;
};

export type PongEvent = {
	type: WsEventType.PONG;
};
