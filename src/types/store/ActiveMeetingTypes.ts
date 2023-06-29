/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ActiveMeeting = {
	sidebarStatus?: SidebarStatus;
};

export type ActiveMeetingMap = {
	[roomId: string]: ActiveMeeting;
};

type SidebarStatus = {
	participantsAccordionIsOpened: boolean;
	actionsAccordionIsOpened: boolean;
};
