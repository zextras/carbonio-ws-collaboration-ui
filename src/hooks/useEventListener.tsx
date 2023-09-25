/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import {
	MeetingJoinedEvent,
	MeetingStartedEvent
} from '../types/network/websocket/wsMeetingEvents';
import { Message } from '../types/store/MessageTypes';

export enum EventName {
	NEW_MESSAGE = 'newMessage',
	INCOMING_MEETING = 'incomingMeeting',
	REMOVED_MEETING_NOTIFICATION = 'removedMeetingNotification'
}

type CustomEvent =
	| {
			name: EventName.NEW_MESSAGE;
			data: Message;
	  }
	| {
			name: EventName.INCOMING_MEETING;
			data: MeetingStartedEvent;
	  }
	| {
			name: EventName.REMOVED_MEETING_NOTIFICATION;
			data: MeetingJoinedEvent;
	  };

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
