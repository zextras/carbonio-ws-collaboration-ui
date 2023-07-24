/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import produce from 'immer';
import { find, forEach } from 'lodash';

import { UsersApi } from '../../network';
import { MeetingBe, MeetingParticipant } from '../../types/network/models/meetingBeTypes';
import { MeetingParticipantMap } from '../../types/store/MeetingTypes';
import { MeetingsSlice, RootStore } from '../../types/store/StoreTypes';

export const useMeetingsStoreSlice = (set: (...any: any) => void): MeetingsSlice => ({
	meetings: {},
	setMeetings: (meetings: MeetingBe[]): void => {
		set(
			produce((draft: RootStore) => {
				forEach(meetings, (meeting) => {
					// Create a map of participants instead of an array
					const participantsMap: MeetingParticipantMap = meeting.participants.reduce(
						(acc: MeetingParticipantMap, participant: MeetingParticipant) => {
							acc[participant.userId] = {
								userId: participant.userId,
								userType: participant.userType,
								audioStreamOn: participant.audioStreamOn || false,
								videoStreamOn: participant.videoStreamOn || false,
								screenStreamOn: participant.screenStreamOn || false
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
						sidebarStatus: true
					};

					// Retrieve participants information if they are unknown
					forEach(meeting.participants, (participant) => {
						if (!find(draft.users, (user) => user.id === participant.userId)) {
							UsersApi.getDebouncedUser(participant.userId);
						}
					});
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
					(acc: MeetingParticipantMap, participant: MeetingParticipant) => {
						acc[participant.userId] = {
							userId: participant.userId,
							userType: participant.userType,
							audioStreamOn: participant.audioStreamOn || false,
							videoStreamOn: participant.videoStreamOn || false,
							screenStreamOn: participant.screenStreamOn || false
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
					sidebarStatus: true
				};

				// Retrieve participants information if they are unknown
				forEach(meeting.participants, (participant) => {
					if (!find(draft.users, (user) => user.id === participant.userId)) {
						UsersApi.getDebouncedUser(participant.userId);
					}
				});
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
	startMeeting: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					draft.meetings[meeting.roomId].active = true;
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
						userType: participant.userType,
						audioStreamOn: participant.audioStreamOn || false,
						videoStreamOn: participant.videoStreamOn || false,
						screenStreamOn: participant.screenStreamOn || false
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
		stream: 'audio' | 'video' | 'screen',
		status: boolean
	): void => {
		set(
			produce((draft: RootStore) => {
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					switch (stream) {
						case 'audio':
							draft.meetings[meeting.roomId].participants[userId].audioStreamOn = status;
							break;
						case 'video':
							draft.meetings[meeting.roomId].participants[userId].videoStreamOn = status;
							break;
						case 'screen':
							draft.meetings[meeting.roomId].participants[userId].screenStreamOn = status;
							break;
						default:
							break;
					}
				}
			}),
			false,
			'MEETINGS/CHANGE_STREAM_STATUS'
		);
	}
});
