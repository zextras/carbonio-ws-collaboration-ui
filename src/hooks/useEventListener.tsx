/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import {
	RoomOwnerDemotedEvent,
	RoomOwnerPromotedEvent
} from '../types/network/websocket/wsConversationEvents';
import {
	MeetingAudioStreamChangedEvent,
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
} from '../types/network/websocket/wsMeetingEvents';
import { Message } from '../types/store/ChatsRegistryTypes';

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
	MEETING_PARTICIPANT_RAISE_HAND = 'meetingParticipantRaiseHand'
}

export type NewMessageEvent = {
	name: EventName.NEW_MESSAGE;
	data: Message;
};

export type IncomingMeetingEvent = {
	name: EventName.INCOMING_MEETING;
	data: MeetingStartedEvent;
};

export type RemovedMeetingNotificationEvent = {
	name: EventName.REMOVED_MEETING_NOTIFICATION;
	data: MeetingJoinedEvent | MeetingStoppedEvent;
};

export type ParticipantClashedEvent = {
	name: EventName.MEETING_PARTICIPANT_CLASHED;
	data: MeetingParticipantClashedEvent;
};

export type MemberMutedEvent = {
	name: EventName.MEMBER_MUTED;
	data: MeetingAudioStreamChangedEvent;
};

export type NewWaitingUserEvent = {
	name: EventName.NEW_WAITING_USER;
	data: MeetingWaitingParticipantJoinedEvent;
};

export type MeetingAcceptedEvent = {
	name: EventName.MEETING_WAITING_PARTICIPANT_ACCEPTED;
	data: MeetingUserAcceptedEvent;
};

export type MeetingRejectedEvent = {
	name: EventName.MEETING_WAITING_PARTICIPANT_REJECTED;
	data: MeetingUserRejectedEvent;
};

export type MeetingWaitingParticipantClashedEvent = {
	name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED;
	data: MeetingWaitingParticipantClashed;
};

export type MeetingStoppedUseEvent = {
	name: EventName.MEETING_STOPPED;
	data: MeetingStoppedEvent;
};

export type RecordingStartedEvent = {
	name: EventName.MEETING_RECORDING_STARTED;
	data: MeetingRecordingStartedEvent;
};

export type RecordingStoppedEvent = {
	name: EventName.MEETING_RECORDING_STOPPED;
	data: MeetingRecordingStoppedEvent;
};

export type MemberPromotedEvent = {
	name: EventName.MEMBER_PROMOTED;
	data: RoomOwnerPromotedEvent;
};

export type MemberDemotedEvent = {
	name: EventName.MEMBER_DEMOTED;
	data: RoomOwnerDemotedEvent;
};

export type RouteRedirectEvent = {
	name: EventName.ROUTE_REDIRECT;
	data: { path: string };
};

export type MeetingParticipantRaiseHandEvent = {
	name: EventName.MEETING_PARTICIPANT_RAISE_HAND;
	data: MeetingParticipantHandRaisedEvent;
};

type AppCustomEvent =
	| NewMessageEvent
	| IncomingMeetingEvent
	| RemovedMeetingNotificationEvent
	| MemberMutedEvent
	| ParticipantClashedEvent
	| NewWaitingUserEvent
	| MeetingAcceptedEvent
	| MeetingRejectedEvent
	| MeetingWaitingParticipantClashedEvent
	| RecordingStartedEvent
	| RecordingStoppedEvent
	| MeetingStoppedUseEvent
	| MemberPromotedEvent
	| MemberDemotedEvent
	| RouteRedirectEvent
	| MeetingParticipantRaiseHandEvent;

export const sendCustomEvent = (event: AppCustomEvent): void => {
	window.dispatchEvent(new CustomEvent(event.name, { detail: event.data }));
};

const useEventListener = <T = unknown,>(
	eventName: EventName,
	handler: (event?: CustomEvent<T>) => void,
	element = window
): void => {
	const savedHandler = useRef(handler);

	useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(() => {
		const eventListener = (event: Event): void => {
			if (event instanceof CustomEvent) {
				savedHandler.current(event as CustomEvent<T>);
			}
		};
		element.addEventListener(eventName, eventListener);
		return (): void => {
			element.removeEventListener(eventName, eventListener);
		};
	}, [eventName, element]);
};

export default useEventListener;
