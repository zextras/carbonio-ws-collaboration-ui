/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { STREAM_TYPE } from '../../store/ActiveMeetingTypes';

export type MeetingBe = {
	id: string;
	name: string;
	roomId: string;
	active: boolean;
	participants: MeetingParticipantBe[];
	createdAt: string;
	meetingType: MeetingType;
	startedAt?: string;
	recStartedAt?: string;
	recUserId?: string;
};

export type MeetingParticipantBe = {
	userId: string;
	audioStreamEnabled?: boolean;
	videoStreamEnabled?: boolean;
	screenStreamEnabled?: boolean;
	joinedAt: string;
};

export enum MeetingUserType {
	MODERATOR = 'moderator',
	REGISTERED = 'registered'
}

export enum MeetingType {
	PERMANENT = 'permanent',
	SCHEDULED = 'scheduled'
}

export type CreateMeetingData = {
	name: string;
	roomId: string;
	meetingType: MeetingType;
	expiration?: string;
};

export type MeetingUser = {
	userId: string;
	userType: MeetingUserType;
};

export type JoinSettings = {
	audioStreamEnabled: boolean;
	videoStreamEnabled: boolean;
};

export type StreamInfo = {
	userId: string;
	type: STREAM_TYPE;
	mid: string;
};

export type StreamMap = {
	[key: string]: {
		userId: string;
		type: STREAM_TYPE;
		stream: MediaStream;
	};
};
