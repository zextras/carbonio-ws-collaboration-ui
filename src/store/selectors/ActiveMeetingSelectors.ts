/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import {
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	TileData
} from '../../types/store/ActiveMeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMeetingSidebarStatus = (store: RootStore, meetingId: string): boolean =>
	store.activeMeeting[meetingId]?.sidebarStatus.sidebarIsOpened;

export const getMeetingActionsAccordionStatus = (store: RootStore, meetingId: string): boolean =>
	store.activeMeeting[meetingId]?.sidebarStatus.actionsAccordionIsOpened;

export const getMeetingParticipantsAccordionStatus = (
	store: RootStore,
	meetingId: string
): boolean => store.activeMeeting[meetingId]?.sidebarStatus.participantsAccordionIsOpened;

export const getWaitingListAccordionStatus = (store: RootStore, meetingId: string): boolean =>
	store.activeMeeting[meetingId]?.sidebarStatus.waitingListAccordionIsOpened;

export const getRecordingAccordionStatus = (store: RootStore, meetingId: string): boolean =>
	store.activeMeeting[meetingId]?.sidebarStatus.recordingAccordionIsOpened;

export const getMeetingChatVisibility = (
	store: RootStore,
	meetingId: string
): MeetingChatVisibility => store.activeMeeting[meetingId]?.chatVisibility;

export const getMeetingViewSelected = (store: RootStore, meetingId: string): MeetingViewType =>
	store.activeMeeting[meetingId]?.meetingViewSelected;

export const getSelectedAudioDeviceId = (store: RootStore, meetingId: string): string | undefined =>
	store.activeMeeting[meetingId]?.localStreams?.selectedAudioDeviceId;

export const getSelectedVideoDeviceId = (store: RootStore, meetingId: string): string | undefined =>
	store.activeMeeting[meetingId]?.localStreams?.selectedVideoDeviceId;

export const getStream = (
	store: RootStore,
	meetingId: string,
	userId: string,
	streamType: STREAM_TYPE
): MediaStream | undefined => {
	if (userId === store.session.id) {
		if (streamType === STREAM_TYPE.VIDEO)
			return store.activeMeeting[meetingId]?.localStreams?.video;
		if (streamType === STREAM_TYPE.SCREEN)
			return store.activeMeeting[meetingId]?.localStreams?.screen;
	}
	const subscriptionId = `${userId}-${streamType}`;
	return store.activeMeeting[meetingId]?.subscription[subscriptionId]?.stream;
};

export const getMeetingCarouselVisibility = (store: RootStore, meetingId: string): boolean =>
	store.activeMeeting[meetingId]?.isCarouselVisible;

export const getPinnedTile = (store: RootStore, meetingId: string): TileData | undefined =>
	store.activeMeeting[meetingId]?.pinnedTile;

export const getTalkingList = (store: RootStore, meetingId: string): string[] =>
	store.activeMeeting[meetingId]?.talkingUsers;

export const getUserIsTalking = (store: RootStore, meetingId: string, userId: string): boolean =>
	find(store.activeMeeting[meetingId]?.talkingUsers, (user) => user === userId) !== undefined;

export const getVideoScreenIn = (
	store: RootStore,
	meetingId: string
): IVideoScreenInConnection | undefined => store.activeMeeting[meetingId]?.videoScreenIn;
