/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { STREAM_TYPE } from './ActiveMeetingTypes';
import { MeetingBe, MeetingType } from '../network/models/meetingBeTypes';

export type MeetingsSlice = {
	meetings: { [meetingId: string]: Meeting };
	addMeetings: (meetings: MeetingBe[]) => void;
	deleteMeeting: (meetingId: string) => void;
	startMeeting: (meetingId: string, startedAt: string) => void;
	stopMeeting: (meetingId: string) => void;
	addParticipant: (meetingId: string, participant: MeetingParticipant) => void;
	removeParticipant: (meetingId: string, userId: string) => void;
	changeStreamStatus: (
		meetingId: string,
		userId: string,
		stream: STREAM_TYPE,
		status: boolean
	) => void;
	setWaitingList: (meetingId: string, waitingList: string[]) => void;
	addUserToWaitingList: (meetingId: string, userId: string) => void;
	removeUserFromWaitingList: (meetingId: string, userId: string) => void;
	startRecording: (
		meetingId: string,
		startRecordingTimestamp: string,
		startRecordingUserId: string
	) => void;
	stopRecording: (meetingId: string) => void;
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
	handRaisedAt?: string;
};
