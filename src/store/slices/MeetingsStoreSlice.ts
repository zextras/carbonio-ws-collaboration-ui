/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import { produce } from 'immer';
import { find, forEach, includes } from 'lodash';
import { StateCreator } from 'zustand';

import { UsersApi } from '../../network';
import { MeetingBe, MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { MeetingParticipant, MeetingParticipantMap } from '../../types/store/MeetingTypes';
import { MeetingsSlice, RootStore } from '../../types/store/StoreTypes';
import { dateToISODate } from '../../utils/dateUtils';

export const useMeetingsStoreSlice: StateCreator<MeetingsSlice> = (set: (...any: any) => void) => ({
	meetings: {},
	setMeetings: (meetings: MeetingBe[]): void => {
		set(
			produce((draft: RootStore) => {
				forEach(meetings, (meeting) => {
					// Create a map of participants instead of an array
					const participantsMap: MeetingParticipantMap = meeting.participants.reduce(
						(acc: MeetingParticipantMap, participant: MeetingParticipantBe) => {
							acc[participant.userId] = {
								userId: participant.userId,
								audioStreamOn: participant.audioStreamEnabled || false,
								videoStreamOn: participant.videoStreamEnabled || false,
								screenStreamOn: participant.screenStreamEnabled || false,
								joinedAt: participant.joinedAt
							};
							return acc;
						},
						{}
					);

					draft.meetings[meeting.roomId] = {
						id: meeting.id,
						name: meeting.name,
						roomId: meeting.roomId,
						active: meeting.active,
						participants: participantsMap,
						createdAt: meeting.createdAt,
						meetingType: meeting.meetingType,
						startedAt: meeting.startedAt,
						recStartedAt: meeting.recStartedAt,
						recUserId: meeting.recUserId
					};

					// Retrieve participants information if they are unknown
					forEach(meeting.participants, (participant) => {
						if (!find(draft.users, (user) => user.id === participant.userId)) {
							UsersApi.getDebouncedUser(participant.userId);
						}
					});

					// Set meetingId on room data
					draft.rooms[meeting.roomId] = {
						...draft.rooms[meeting.roomId],
						meetingId: meeting.id
					};
				});
			}),
			false,
			'MEETINGS/SET_MEETINGS'
		);
	},
	addMeeting: (meeting: MeetingBe): void => {
		set(
			produce((draft: RootStore) => {
				// Create a map of participants instead of an array
				const participantsMap: MeetingParticipantMap = meeting.participants.reduce(
					(acc: MeetingParticipantMap, participant: MeetingParticipantBe) => {
						acc[participant.userId] = {
							userId: participant.userId,
							audioStreamOn: participant.audioStreamEnabled || false,
							videoStreamOn: participant.videoStreamEnabled || false,
							screenStreamOn: participant.screenStreamEnabled || false,
							joinedAt: participant.joinedAt
						};
						return acc;
					},
					{}
				);
				draft.meetings[meeting.roomId] = {
					...draft.meetings[meeting.roomId],
					id: meeting.id,
					name: meeting.name,
					roomId: meeting.roomId,
					active: meeting.active,
					participants: participantsMap,
					createdAt: meeting.createdAt,
					meetingType: meeting.meetingType,
					startedAt: meeting.startedAt,
					recStartedAt: meeting.recStartedAt,
					recUserId: meeting.recUserId
				};

				// Retrieve participants information if they are unknown
				forEach(meeting.participants, (participant) => {
					if (!find(draft.users, (user) => user.id === participant.userId)) {
						UsersApi.getDebouncedUser(participant.userId);
					}
				});

				// Set meetingId on room data
				draft.rooms[meeting.roomId] = {
					...draft.rooms[meeting.roomId],
					meetingId: meeting.id
				};
			}),
			false,
			'MEETINGS/ADD'
		);
	},
	deleteMeeting: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					delete draft.meetings[meeting.roomId];
				}
			}),
			false,
			'MEETINGS/DELETE'
		);
	},
	startMeeting: (meetingId: string, startedAt: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					draft.meetings[meeting.roomId].active = true;
					draft.meetings[meeting.roomId].startedAt = startedAt;
				}
			}),
			false,
			'MEETINGS/START'
		);
	},
	stopMeeting: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					draft.meetings[meeting.roomId].active = false;
					draft.meetings[meeting.roomId].startedAt = undefined;
				}
			}),
			false,
			'MEETINGS/STOP'
		);
	},
	addParticipant: (meetingId: string, participant: MeetingParticipant): void => {
		set(
			produce((draft: RootStore) => {
				// Add participant only if components exists and sessionId isn't already on components
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					meeting.participants[participant.userId] = {
						userId: participant.userId,
						audioStreamOn: participant.audioStreamOn || false,
						videoStreamOn: participant.videoStreamOn || false,
						screenStreamOn: participant.screenStreamOn || false,
						joinedAt: participant.joinedAt
					};
					// Retrieve member information if he is unknown
					if (!find(draft.users, (user) => user.id === participant.userId)) {
						UsersApi.getDebouncedUser(participant.userId);
					}
				}
			}),
			false,
			'MEETINGS/ADD_PARTICIPANT'
		);
	},
	removeParticipant: (meetingId: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				// Add participant only if components exists and sessionId isn't already on components
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					delete draft.meetings[meeting.roomId].participants[userId];
				}
			}),
			false,
			'MEETINGS/REMOVE_PARTICIPANT'
		);
	},
	changeStreamStatus: (
		meetingId: string,
		userId: string,
		stream: STREAM_TYPE,
		status: boolean
	): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					switch (stream) {
						case STREAM_TYPE.AUDIO:
							draft.meetings[meeting.roomId].participants[userId].audioStreamOn = status;
							break;
						case STREAM_TYPE.VIDEO:
							draft.meetings[meeting.roomId].participants[userId].videoStreamOn = status;
							break;
						case STREAM_TYPE.SCREEN:
							draft.meetings[meeting.roomId].participants[userId].screenStreamOn = status;
							draft.meetings[meeting.roomId].participants[userId].dateScreenOn = status
								? dateToISODate(Date.now())
								: undefined;
							break;
						default:
							break;
					}
				}
			}),
			false,
			'MEETINGS/CHANGE_STREAM_STATUS'
		);
	},
	setWaitingList: (meetingId: string, waitingList: string[]): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					draft.meetings[meeting.roomId].waitingList = waitingList;
					// Retrieve waiting users information if they are unknown
					forEach(waitingList, (userId) => {
						if (!find(draft.users, (user) => user.id === userId)) {
							UsersApi.getDebouncedUser(userId);
						}
					});
				}
			}),
			false,
			'AM/SET_WAITING_LIST'
		);
	},
	addUserToWaitingList: (meetingId: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting && !includes(meeting.waitingList, userId)) {
					if (!meeting.waitingList) draft.meetings[meeting.roomId].waitingList = [];
					draft.meetings[meeting.roomId].waitingList?.push(userId);

					// Retrieve waiting user information if ut is unknown
					if (!find(draft.users, (user) => user.id === userId)) {
						UsersApi.getDebouncedUser(userId);
					}
				}
			}),
			false,
			'AM/ADD_USER_TO_WAITING_LIST'
		);
	},
	removeUserFromWaitingList: (meetingId: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					const index = draft.meetings[meeting.roomId].waitingList?.indexOf(userId);
					if (index !== undefined && index !== -1) {
						draft.meetings[meeting.roomId].waitingList?.splice(index, 1);
					}
				}
			}),
			false,
			'AM/REMOVE_USER_FROM_WAITING_LIST'
		);
	},
	startRecording: (
		meetingId: string,
		startRecordingTimestamp: string,
		startRecordingUserId: string
	): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					draft.meetings[meeting.roomId].recStartedAt = startRecordingTimestamp;
					draft.meetings[meeting.roomId].recUserId = startRecordingUserId;
				}
			}),
			false,
			'AM/START_RECORDING'
		);
	},
	stopRecording: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					draft.meetings[meeting.roomId].recStartedAt = undefined;
					draft.meetings[meeting.roomId].recUserId = undefined;
				}
			}),
			false,
			'AM/STOP_RECORDING'
		);
	}
});
