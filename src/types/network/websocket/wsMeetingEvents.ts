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
	| MeetingDeletedEvent;

type BasicMeetingEvent = {
	id: string;
	from: string;
	sentDate: string;
	sessionId: string;
};

export type MeetingCreatedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_CREATED;
	meetingId: string;
	roomId: string;
};

export type MeetingJoinedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_JOINED;
	meetingId: string;
};

export type MeetingLeftEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_LEFT;
	meetingId: string;
};

export type MeetingDeletedEvent = BasicMeetingEvent & {
	type: WsEventType.MEETING_DELETED;
	meetingId: string;
};
