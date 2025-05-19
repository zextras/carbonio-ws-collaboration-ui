/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import { produce } from 'immer';
import { forEach, includes, remove } from 'lodash';
import { StateCreator } from 'zustand';

import { MeetingBe, MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import {
	MeetingParticipant,
	MeetingParticipantMap,
	MeetingsSlice
} from '../../types/store/MeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { dateToISODate } from '../../utils/dateUtils';

const mapParticipants = (participants: MeetingParticipantBe[]): MeetingParticipantMap =>
	participants.reduce((acc: MeetingParticipantMap, participant: MeetingParticipantBe) => {
		acc[participant.userId] = {
			userId: participant.userId,
			audioStreamOn: participant.audioStreamEnabled || false,
			videoStreamOn: participant.videoStreamEnabled || false,
			screenStreamOn: participant.screenStreamEnabled || false,
			joinedAt: participant.joinedAt
		};
		return acc;
	}, {});

export const useMeetingsStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	MeetingsSlice
> = (set, get) => ({
	meetings: {},
	addMeetings: (meetings: MeetingBe[]): void => {
		set(
			produce((draft: RootStore) => {
				forEach(meetings, (meeting) => {
					draft.meetings[meeting.id] = {
						id: meeting.id,
						name: meeting.name,
						roomId: meeting.roomId,
						active: meeting.active,
						participants: mapParticipants(meeting.participants),
						createdAt: meeting.createdAt,
						meetingType: meeting.meetingType,
						startedAt: meeting.startedAt,
						recStartedAt: meeting.recStartedAt,
						recUserId: meeting.recUserId
					};

					// Set meetingId on room data
					draft.rooms[meeting.roomId] = {
						...draft.rooms[meeting.roomId],
						meetingId: meeting.id
					};
				});
			}),
			false,
			'MEETINGS/ADD_MEETINGS'
		);
	},
	deleteMeeting: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				delete draft.meetings[meetingId];
			}),
			false,
			'MEETINGS/DELETE'
		);
	},
	startMeeting: (meetingId: string, startedAt: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					meeting.active = true;
					meeting.startedAt = startedAt;
				}
			}),
			false,
			'MEETINGS/START'
		);
	},
	stopMeeting: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					meeting.active = false;
					meeting.startedAt = undefined;
				}
			}),
			false,
			'MEETINGS/STOP'
		);
	},
	addParticipant: (meetingId: string, participant: MeetingParticipant): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					meeting.participants[participant.userId] = {
						userId: participant.userId,
						audioStreamOn: participant.audioStreamOn || false,
						videoStreamOn: participant.videoStreamOn || false,
						screenStreamOn: participant.screenStreamOn || false,
						joinedAt: participant.joinedAt
					};
				}
			}),
			false,
			'MEETINGS/ADD_PARTICIPANT'
		);
	},
	removeParticipant: (meetingId: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					delete meeting.participants[userId];
				}
			}),
			false,
			'MEETINGS/REMOVE_PARTICIPANT'
		);
	},
	changeStreamStatus: (
		meetingId: string,
		userId: string,
		streamType: STREAM_TYPE,
		status: boolean
	): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					switch (streamType) {
						case STREAM_TYPE.AUDIO:
							meeting.participants[userId].audioStreamOn = status;
							break;
						case STREAM_TYPE.VIDEO:
							meeting.participants[userId].videoStreamOn = status;
							break;
						case STREAM_TYPE.SCREEN:
							meeting.participants[userId].screenStreamOn = status;
							if (status) {
								meeting.participants[userId].dateScreenOn = dateToISODate(Date.now());
							}
							break;
						default:
							break;
					}
				}
			}),
			false,
			'MEETINGS/CHANGE_STREAM_STATUS'
		);
		// Auto pin new screen share
		if (streamType === STREAM_TYPE.SCREEN && status) {
			get().setPinnedTile({ userId, type: streamType });
		}
	},
	setWaitingList: (meetingId: string, waitingList: string[]): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					meeting.waitingList = waitingList;
				}
			}),
			false,
			'MEETINGS/SET_WAITING_LIST'
		);
	},
	addUserToWaitingList: (meetingId: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				meeting.waitingList ??= [];
				if (meeting && !includes(meeting.waitingList, userId)) {
					draft.meetings[meeting.id].waitingList?.push(userId);
				}
			}),
			false,
			'MEETINGS/ADD_TO_WAITING_LIST'
		);
	},
	removeUserFromWaitingList: (meetingId: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					remove(meeting.waitingList || [], (user) => user === userId);
				}
			}),
			false,
			'MEETINGS/REMOVE_FROM_WAITING_LIST'
		);
	},
	startRecording: (
		meetingId: string,
		startRecordingTimestamp: string,
		startRecordingUserId: string
	): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					meeting.recStartedAt = startRecordingTimestamp;
					meeting.recUserId = startRecordingUserId;
				}
			}),
			false,
			'MEETINGS/START_RECORDING'
		);
	},
	stopRecording: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = draft.meetings[meetingId];
				if (meeting) {
					meeting.recStartedAt = undefined;
					meeting.recUserId = undefined;
				}
			}),
			false,
			'MEETINGS/STOP_RECORDING'
		);
	}
});
