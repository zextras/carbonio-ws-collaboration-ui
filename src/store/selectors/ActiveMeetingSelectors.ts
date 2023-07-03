/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RootStore } from '../../types/store/StoreTypes';

export const getMeetingActionsAccordionStatus = (store: RootStore, meetingId: string): boolean => {
	if (store.activeMeeting[meetingId]?.sidebarStatus)
		return store.activeMeeting[meetingId].sidebarStatus!.actionsAccordionIsOpened;
	return true;
};

export const getMeetingParticipantsAccordionStatus = (
	store: RootStore,
	meetingId: string
): boolean => {
	if (store.activeMeeting[meetingId]?.sidebarStatus)
		return store.activeMeeting[meetingId].sidebarStatus!.participantsAccordionIsOpened;
	return false;
};
