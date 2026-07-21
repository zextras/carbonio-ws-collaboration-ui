/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	RoomOwnerDemotedEvent,
	RoomOwnerPromotedEvent
} from './network/websocket/wsConversationEvents';
import {
	MeetingAudioStreamChangedEvent,
	MeetingDeclinedEvent,
	MeetingJoinedEvent,
	MeetingParticipantClashedEvent,
	MeetingParticipantHandRaisedEvent,
	MeetingRecordingStartedEvent,
	MeetingRecordingStoppedEvent,
	MeetingStartedEvent,
	MeetingStoppedEvent,
	MeetingUserAcceptedEvent,
	MeetingUserRejectedEvent,
	MeetingWaitingParticipantClashed,
	MeetingWaitingParticipantJoinedEvent
} from './network/websocket/wsMeetingEvents';
import { Message } from './store/ChatsRegistryTypes';

export enum EventName {
	NEW_MESSAGE = 'newMessage',
	INCOMING_MEETING = 'incomingMeeting',
	REMOVED_MEETING_NOTIFICATION = 'removedMeetingNotification',
	MEMBER_MUTED = 'memberMuted',
	MEETING_PARTICIPANT_CLASHED = 'meetingParticipantClashed',
	NEW_WAITING_USER = 'newWaitingUser',
	MEETING_WAITING_PARTICIPANT_ACCEPTED = 'meetingUserAccepted',
	MEETING_WAITING_PARTICIPANT_REJECTED = 'meetingUserRejected',
	MEETING_WAITING_PARTICIPANT_CLASHED = 'meetingWaitingParticipantClashed',
	MEETING_STOPPED = 'meetingStopped',
	MEETING_RECORDING_STARTED = 'meetingRecordingStarted',
	MEETING_RECORDING_STOPPED = 'meetingRecordingStopped',
	MEMBER_PROMOTED = 'memberPromoted',
	MEMBER_DEMOTED = 'memberDemoted',
	ROUTE_REDIRECT = 'routeRedirect',
	MEETING_PARTICIPANT_RAISE_HAND = 'meetingParticipantRaiseHand',
	MEETING_DECLINED = 'meetingDeclined',
	QUOTA_CHANGED = 'carbonio-ws-collaboration-ui:quota-changed'
}

export type EventPayloads = {
	[EventName.NEW_MESSAGE]: Message;
	[EventName.INCOMING_MEETING]: MeetingStartedEvent;
	[EventName.REMOVED_MEETING_NOTIFICATION]:
		| MeetingJoinedEvent
		| MeetingStoppedEvent
		| MeetingDeclinedEvent;
	[EventName.MEMBER_MUTED]: MeetingAudioStreamChangedEvent;
	[EventName.MEETING_PARTICIPANT_CLASHED]: MeetingParticipantClashedEvent;
	[EventName.NEW_WAITING_USER]: MeetingWaitingParticipantJoinedEvent;
	[EventName.MEETING_WAITING_PARTICIPANT_ACCEPTED]: MeetingUserAcceptedEvent;
	[EventName.MEETING_WAITING_PARTICIPANT_REJECTED]: MeetingUserRejectedEvent;
	[EventName.MEETING_WAITING_PARTICIPANT_CLASHED]: MeetingWaitingParticipantClashed;
	[EventName.MEETING_STOPPED]: MeetingStoppedEvent;
	[EventName.MEETING_RECORDING_STARTED]: MeetingRecordingStartedEvent;
	[EventName.MEETING_RECORDING_STOPPED]: MeetingRecordingStoppedEvent;
	[EventName.MEMBER_PROMOTED]: RoomOwnerPromotedEvent;
	[EventName.MEMBER_DEMOTED]: RoomOwnerDemotedEvent;
	[EventName.ROUTE_REDIRECT]: { path: string };
	[EventName.MEETING_PARTICIPANT_RAISE_HAND]: MeetingParticipantHandRaisedEvent;
	[EventName.MEETING_DECLINED]: MeetingDeclinedEvent;
	[EventName.QUOTA_CHANGED]: undefined;
};
