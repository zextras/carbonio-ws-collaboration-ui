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
	users: MeetingUser[];
	roomId: string;
	meetingType: MeetingType;
	expiration?: number;
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
	user_id: string;
	type: STREAM_TYPE;
	mid: string;
};
