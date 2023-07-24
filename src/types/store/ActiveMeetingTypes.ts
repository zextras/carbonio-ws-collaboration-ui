/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ActiveMeeting = {
	sidebarStatus: SidebarStatus;
	chatVisibility: MeetingChatVisibility;
	meetingViewSelected: MeetingViewType;
};

export type ActiveMeetingMap = {
	[roomId: string]: ActiveMeeting;
};

type SidebarStatus = {
	sidebarIsOpened: boolean;
	participantsAccordionIsOpened: boolean;
	actionsAccordionIsOpened: boolean;
};

export enum MeetingViewType {
	CINEMA = 'cinema',
	GRID = 'grid',
	WAITING = 'waiting'
}

export enum MeetingChatVisibility {
	CLOSED = 'closed',
	OPEN = 'open',
	EXPANDED = 'expanded'
}
