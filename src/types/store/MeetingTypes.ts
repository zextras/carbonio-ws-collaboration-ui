/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MeetingParticipant, MeetingType } from '../network/models/meetingBeTypes';

export type MeetingsMap = {
	[roomId: string]: Meeting;
};

export type Meeting = {
	id: string;
	name: string;
	roomId: string;
	active: boolean;
	participants: MeetingParticipantMap;
	createdAt: string;
	meetingType: MeetingType;
	chatVisibility: MeetingChatVisibility;
	meetingViewSelected: MeetingViewType;
	sidebarStatus: boolean;
};
export type MeetingParticipantMap = {
	[userId: string]: MeetingParticipant;
};

export enum MeetingViewType {
	CINEMA = 'cinema',
	GRID = 'grid',
	WAITING = 'waiting'
}

export enum MeetingChatVisibility {
	CLOSED = 'closed',
	OPEN = 'open',
	EXPANDED = 'expanded'
}
