/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import produce from 'immer';
import { find, forEach, remove } from 'lodash';

import { UsersApi } from '../../network';
import { MeetingBe, MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { MeetingsSlice, RootStore } from '../../types/store/StoreTypes';

export const useMeetingsStoreSlice = (set: (...any: any) => void): MeetingsSlice => ({
	meetings: {},
	setMeetings: (meetings: MeetingBe[]): void => {
		set(
			produce((draft: RootStore) => {
				forEach(meetings, (meeting) => {
					draft.meetings[meeting.roomId] = {
						id: meeting.id,
						roomId: meeting.roomId,
						participants: meeting.participants,
						createdAt: meeting.createdAt
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
				draft.meetings[meeting.roomId] = {
					id: meeting.id,
					roomId: meeting.roomId,
					participants: meeting.participants,
					createdAt: meeting.createdAt
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
	addParticipant: (meetingId: string, participant: MeetingParticipantBe): void => {
		set(
			produce((draft: RootStore) => {
				// Add participant only if components exists and sessionId isn't already on components
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					const sessionIdParticipant = find(
						meeting.participants,
						(meetingPart) => meetingPart.sessionId === participant.sessionId
					);
					if (!sessionIdParticipant) {
						draft.meetings[meeting.roomId].participants.push(participant);
					}

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
	removeParticipant: (meetingId: string, sessionId): void => {
		set(
			produce((draft: RootStore) => {
				// Add participant only if components exists and sessionId isn't already on components
				const meeting = find(draft.meetings, (meeting) => meeting.id === meetingId);
				if (meeting) {
					remove(draft.meetings[meeting.roomId].participants, { sessionId });
				}
			}),
			false,
			'MEETINGS/REMOVE_PARTICIPANT'
		);
	}
});
