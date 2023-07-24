/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import { MeetingChatVisibility, MeetingViewType } from '../../types/store/ActiveMeetingTypes';
import { ActiveMeetingSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveMeetingSlice = (set: (...any: any) => void): ActiveMeetingSlice => ({
	activeMeeting: {},
	setActiveMeeting: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId] = {
						sidebarStatus: {
							sidebarIsOpened: true,
							actionsAccordionIsOpened: true,
							participantsAccordionIsOpened: false
						},
						chatVisibility: MeetingChatVisibility.CLOSED,
						meetingViewSelected: MeetingViewType.WAITING
					};
				}
			}),
			false,
			'AM/SET_ACTIVE_MEETING'
		);
	},
	removeActiveMeeting: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				delete draft.activeMeeting[meetingId];
			}),
			false,
			'AM/REMOVE_ACTIVE_MEETING'
		);
	},
	setMeetingSidebarStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.sidebarIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_SIDEBAR_STATUS'
		);
	},
	setMeetingActionsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.actionsAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_ACTIONS_ACCORDION_STATUS'
		);
	},
	setMeetingParticipantsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.participantsAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_PARTICIPANTS_ACCORDION_STATUS'
		);
	},
	setMeetingViewSelected: (meetingId: string, viewType: MeetingViewType): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].meetingViewSelected = viewType;
				}
			}),
			false,
			'AM/SET_VIEW_TYPE'
		);
	},
	toggleMeetingChatVisibility: (
		meetingId: string,
		visibilityStatus: MeetingChatVisibility
	): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].chatVisibility = visibilityStatus;
				}
			}),
			false,
			'AM/SET_CHAT_VIEW'
		);
	}
});
