/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, size } from 'lodash';

import { Meeting, MeetingParticipantMap, MeetingViewType } from '../../types/store/MeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMeeting = (store: RootStore, roomId: string): Meeting | undefined =>
	store.meetings[roomId];

export const getMeetingActive = (store: RootStore, roomId: string): boolean =>
	store.meetings[roomId] !== undefined;
export const getMeetingByMeetingId = (store: RootStore, meetingId: string): Meeting | undefined =>
	find(store.meetings, (meeting) => meeting.id === meetingId);

export const getSidebarStatus = (store: RootStore, meetingId: string): boolean | undefined =>
	find(store.meetings, (meeting) => meeting.id === meetingId)?.sidebarStatus;

export const getMeetingParticipants = (
	store: RootStore,
	roomId: string
): MeetingParticipantMap | undefined => store.meetings[roomId]?.participants;

export const getMyMeetingParticipation = (store: RootStore, roomId: string): boolean => {
	if (store.meetings[roomId]?.participants && store.session.id != null) {
		const sessionMember = find(
			store.meetings[roomId].participants,
			(member) => member.userId === store.session.id
		);
		return sessionMember != null;
	}
	return false;
};

export const getNumberOfMeetingParticipants = (
	store: RootStore,
	roomId: string
): number | undefined => size(store.meetings[roomId]?.participants);

export const getMeetingViewSelected = (store: RootStore, meetingId: string): MeetingViewType =>
	find(store.meetings, (meeting) => meeting.id === meetingId)!.meetingViewSelected;
