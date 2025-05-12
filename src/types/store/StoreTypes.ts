/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ActiveConversationsSlice } from './ActiveConversationTypes';
import { ActiveMeetingSlice, STREAM_TYPE } from './ActiveMeetingTypes';
import { ChatsRegistryStoreSlice } from './ChatsRegistryTypes';
import { ConnectionsStoreSlice } from './ConnectionsTypes';
import { MeetingParticipant, MeetingsMap } from './MeetingTypes';
import { RoomsStoreSlice } from './RoomTypes';
import { SessionStoreSlice } from './SessionTypes';
import { UsersStoreSlice } from './UserTypes';
import { MeetingBe } from '../network/models/meetingBeTypes';

export type MeetingsSlice = {
	meetings: MeetingsMap;
	setMeetings: (meetings: MeetingBe[]) => void;
	addMeeting: (meeting: MeetingBe) => void;
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

export type RootStore = UsersStoreSlice &
	RoomsStoreSlice &
	SessionStoreSlice &
	ActiveConversationsSlice &
	ChatsRegistryStoreSlice &
	ConnectionsStoreSlice &
	MeetingsSlice &
	ActiveMeetingSlice;
