/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MeetingType } from '../network/models/meetingBeTypes';

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
	waitingList?: string[];
	startedAt?: string;
	recStartedAt?: string;
	recUserId?: string;
};

export type MeetingParticipantMap = {
	[userId: string]: MeetingParticipant;
};

export type MeetingParticipant = {
	userId: string;
	audioStreamOn?: boolean;
	videoStreamOn?: boolean;
	screenStreamOn?: boolean;
	joinedAt: string;
	dateScreenOn?: string;
};
