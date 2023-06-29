/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import { ActiveMeetingSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveMeetingSlice = (set: (...any: any) => void): ActiveMeetingSlice => ({
	activeMeeting: {},
	setMeetingActionsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]) draft.activeMeeting[meetingId] = {};
				if (!draft.activeMeeting[meetingId].sidebarStatus) {
					draft.activeMeeting[meetingId].sidebarStatus = {
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: false
					};
				}
				draft.activeMeeting[meetingId].sidebarStatus!.actionsAccordionIsOpened = status;
			}),
			false,
			'MC/SET_MEETING_ACTIONS_ACCORDION_STATUS'
		);
	},
	setMeetingParticipantsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]) draft.activeMeeting[meetingId] = {};
				if (!draft.activeMeeting[meetingId].sidebarStatus) {
					draft.activeMeeting[meetingId].sidebarStatus = {
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: false
					};
				}
				draft.activeMeeting[meetingId].sidebarStatus!.participantsAccordionIsOpened = status;
			}),
			false,
			'MC/SET_MEETING_PARTICIPANTS_ACCORDION_STATUS'
		);
	}
});
