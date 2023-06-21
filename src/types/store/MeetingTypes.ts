/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type MeetingsMap = {
	[roomId: string]: Meeting;
};

export type Meeting = {
	id: string;
	roomId: string;
	participants: MeetingParticipantMap;
	createdAt: string;
	sidebarStatus: boolean;
	chatVisibility: MeetingChatVisibility;
	meetingViewSelected: MeetingViewType;
};

export type MeetingParticipant = {
	userId: string;
	sessionId: string;
	hasAudioStreamOn: boolean;
	hasVideoStreamOn: boolean;
	hasScreenStreamOn: boolean;
};

export type MeetingParticipantMap = {
	[sessionId: string]: MeetingParticipant;
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
