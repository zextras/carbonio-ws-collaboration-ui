/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import {
	MeetingAudioStreamChangedEvent,
	MeetingJoinedEvent,
	MeetingParticipantClashedEvent,
	MeetingStartedEvent,
	MeetingUserAcceptedEvent,
	MeetingUserRejectedEvent,
	MeetingUserWaitingListRejoinedEvent
} from '../types/network/websocket/wsMeetingEvents';
import { Message } from '../types/store/MessageTypes';

export enum EventName {
	NEW_MESSAGE = 'newMessage',
	INCOMING_MEETING = 'incomingMeeting',
	REMOVED_MEETING_NOTIFICATION = 'removedMeetingNotification',
	MEMBER_MUTED = 'memberMuted',
	MEETING_PARTICIPANT_CLASHED = 'meetingParticipantClashed',
	MEETING_USER_ACCEPTED = 'meetingUserAccepted',
	MEETING_USER_REJECTED = 'meetingUserRejected',
	MEETING_REJOINED_WAITING_ROOM = 'meetingRejoinedWaitingRoom'
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
	data: MeetingJoinedEvent;
};

export type ParticipantClashedEvent = {
	name: EventName.MEETING_PARTICIPANT_CLASHED;
	data: MeetingParticipantClashedEvent;
};

export type MemberMutedEvent = {
	name: EventName.MEMBER_MUTED;
	data: MeetingAudioStreamChangedEvent;
};

export type MeetingAcceptedEvent = {
	name: EventName.MEETING_USER_ACCEPTED;
	data: MeetingUserAcceptedEvent;
};

export type MeetingRejectedEvent = {
	name: EventName.MEETING_USER_REJECTED;
	data: MeetingUserRejectedEvent;
};

export type MeetingRejoinedWaitingRoomEvent = {
	name: EventName.MEETING_REJOINED_WAITING_ROOM;
	data: MeetingUserWaitingListRejoinedEvent;
};

type CustomEvent =
	| NewMessageEvent
	| IncomingMeetingEvent
	| RemovedMeetingNotificationEvent
	| MemberMutedEvent
	| ParticipantClashedEvent
	| MeetingAcceptedEvent
	| MeetingRejectedEvent
	| MeetingRejoinedWaitingRoomEvent;

export const sendCustomEvent = (event: CustomEvent): void => {
	window.dispatchEvent(new CustomEvent(event.name, { detail: event.data }));
};

const useEventListener = (
	eventName: EventName,
	handler: (event?: Event) => void,
	element = window
): void => {
	const savedHandler = useRef(handler);

	useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(() => {
		const eventListener = (event: Event): void => savedHandler.current(event);
		element.addEventListener(eventName, eventListener);
		return () => {
			element.removeEventListener(eventName, eventListener);
		};
	}, [eventName, element]);
};

export default useEventListener;
