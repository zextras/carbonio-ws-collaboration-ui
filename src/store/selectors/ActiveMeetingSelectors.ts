/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sample } from 'lodash';

import {
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE
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

export const getMeetingChatVisibility = (
	store: RootStore,
	meetingId: string
): MeetingChatVisibility => store.activeMeeting[meetingId]?.chatVisibility;

export const getMeetingViewSelected = (store: RootStore, meetingId: string): MeetingViewType =>
	store.activeMeeting[meetingId]?.meetingViewSelected;

export const getLocalVideoSteam = (store: RootStore, meetingId: string): MediaStream | undefined =>
	store.activeMeeting[meetingId]?.localStreams?.video;

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
	const subscriptionId = `${userId}-${streamType}`;
	return store.activeMeeting[meetingId]?.subscription[subscriptionId].stream;
};

export const getFirstStream = (store: RootStore, meetingId: string): MediaStream | undefined =>
	sample(store.activeMeeting[meetingId]?.subscription)?.stream;
