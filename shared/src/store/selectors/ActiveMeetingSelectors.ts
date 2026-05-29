/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import {
	ActiveMeeting,
	MeetingAccordionType,
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	TileData,
	VirtualBackgroundType
} from '../../types/store/ActiveMeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getActiveMeeting = (
	store: RootStore,
	meetingId: string
): ActiveMeeting | undefined => {
	if (store.activeMeeting?.meetingId === meetingId) return store.activeMeeting;
	return undefined;
};

export const getMeetingSidebarStatus = (store: RootStore): boolean =>
	!!store.activeMeeting?.sidebarStatus[MeetingAccordionType.GENERAL];

export const getMeetingParticipantsAccordionStatus = (store: RootStore): boolean =>
	!!store.activeMeeting?.sidebarStatus[MeetingAccordionType.PARTICIPANTS];

export const getWaitingListAccordionStatus = (store: RootStore): boolean =>
	!!store.activeMeeting?.sidebarStatus[MeetingAccordionType.WAITING_LIST];

export const getRecordingAccordionStatus = (store: RootStore): boolean =>
	!!store.activeMeeting?.sidebarStatus[MeetingAccordionType.RECORDING];

export const getVisualEffectsAccordionStatus = (store: RootStore): boolean =>
	!!store.activeMeeting?.sidebarStatus[MeetingAccordionType.VISUAL_EFFECTS];

export const getRaiseHandAccordionStatus = (store: RootStore): boolean =>
	!!store.activeMeeting?.sidebarStatus[MeetingAccordionType.RAISE_HAND];

export const getMeetingChatVisibility = (store: RootStore): MeetingChatVisibility =>
	store.activeMeeting?.chatVisibility ?? MeetingChatVisibility.CLOSED;

export const getMeetingViewSelected = (store: RootStore): MeetingViewType =>
	store.activeMeeting?.meetingViewSelected ?? MeetingViewType.GRID;

export const getSelectedAudioDeviceId = (store: RootStore): string | undefined =>
	store.activeMeeting?.localStreams?.selectedAudioDeviceId;

export const getSelectedVideoDeviceId = (store: RootStore): string | undefined =>
	store.activeMeeting?.localStreams?.selectedVideoDeviceId;

export const getStream = (
	store: RootStore,
	meetingId: string,
	userId: string,
	streamType: STREAM_TYPE
): MediaStream | undefined => {
	if (userId === store.session.id) {
		if (
			store.activeMeeting?.meetingId === meetingId &&
			store.activeMeeting?.virtualBackground.backgroundImage !== VirtualBackgroundType.NONE &&
			streamType !== STREAM_TYPE.SCREEN
		) {
			return store.activeMeeting.virtualBackground.updatedStream;
		}
		if (streamType === STREAM_TYPE.VIDEO) {
			return store.activeMeeting?.localStreams?.video;
		}
		if (streamType === STREAM_TYPE.SCREEN) {
			return store.activeMeeting?.localStreams?.screen;
		}
	}
	const subscriptionId = `${userId}-${streamType}`;
	return store.activeMeeting?.subscription[subscriptionId]?.stream;
};

export const getLocalStreamVideo = (store: RootStore): MediaStream | undefined =>
	store.activeMeeting?.localStreams?.video;

export const getMeetingCarouselVisibility = (store: RootStore): boolean =>
	!!store.activeMeeting?.isCarouselVisible;

export const getPinnedTile = (store: RootStore): TileData | undefined =>
	store.activeMeeting?.pinnedTile;

const FALLBACK_ARRAY: string[] = [];

export const getTalkingList = (store: RootStore): string[] =>
	store.activeMeeting?.talkingUsers || FALLBACK_ARRAY;

export const getNameOfFirstTalkingUser = (store: RootStore): string | undefined => {
	const id = store.activeMeeting?.talkingUsers ? store.activeMeeting?.talkingUsers[0] : undefined;
	if (id) {
		return store.users[id]?.name || store.users[id]?.email || '';
	}
	return undefined;
};

export const getUserIsTalking = (store: RootStore, userId: string): boolean =>
	find(store.activeMeeting?.talkingUsers, (user) => user === userId) !== undefined;

export const getBackgroundImage = (store: RootStore): VirtualBackgroundType =>
	store.activeMeeting?.virtualBackground.backgroundImage ?? VirtualBackgroundType.NONE;

export const getUpdatedStream = (store: RootStore): MediaStream | undefined =>
	store.activeMeeting?.virtualBackground?.updatedStream;

export const getUserHasHandRaised = (store: RootStore, userId: string): boolean =>
	find(store.activeMeeting?.usersWithHandRaised, (user) => user === userId) !== undefined;

// 0 means that the user is not found in the array
export const getUserHandRank = (store: RootStore, userId: string): number => {
	const index = store.activeMeeting?.usersWithHandRaised.indexOf(userId) ?? -1;
	return index >= 0 ? index + 1 : 0;
};

export const getHandRaisedList = (store: RootStore): string[] | undefined =>
	store.activeMeeting?.usersWithHandRaised;
