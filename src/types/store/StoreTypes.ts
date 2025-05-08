/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ActiveConversationsSlice } from './ActiveConversationTypes';
import {
	ActiveMeetingMap,
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	StreamsSubscriptionMap,
	Subscription,
	TileData,
	VirtualBackgroundType
} from './ActiveMeetingTypes';
import { ChatsRegistryStoreSlice } from './ChatsRegistryTypes';
import { ConnectionsStoreSlice } from './ConnectionsTypes';
import { MeetingParticipant, MeetingsMap } from './MeetingTypes';
import { RoomsStoreSlice } from './RoomTypes';
import { SessionStoreSlice } from './SessionTypes';
import { UsersStoreSlice } from './UserTypes';
import { MeetingBe } from '../network/models/meetingBeTypes';

export type MeetingsSlice = {
	meetings: MeetingsMap;
	addMeetings: (meetings: MeetingBe[]) => void;
	deleteMeeting: (meetingId: string) => void;
	startMeeting: (meetingId: string, startedAt: string) => void;
	stopMeeting: (meetingId: string) => void;
	addParticipant: (meetingId: string, participant: MeetingParticipant) => void;
	removeParticipant: (meetingId: string, userId: string) => void;
	changeStreamStatus: (
		meetingId: string,
		userId: string,
		stream: STREAM_TYPE,
		status: boolean
	) => void;
	setWaitingList: (meetingId: string, waitingList: string[]) => void;
	addUserToWaitingList: (meetingId: string, userId: string) => void;
	removeUserFromWaitingList: (meetingId: string, userId: string) => void;
	startRecording: (
		meetingId: string,
		startRecordingTimestamp: string,
		startRecordingUserId: string
	) => void;
	stopRecording: (meetingId: string) => void;
};

export type ActiveMeetingSlice = {
	activeMeeting: ActiveMeetingMap;
	setWaitingListAccordionStatus: (roomId: string, status: boolean) => void;
	setRecordingAccordionStatus: (roomId: string, status: boolean) => void;
	setMeetingParticipantsAccordionStatus: (roomId: string, status: boolean) => void;
	setVisualEffectsAccordionStatus: (meetingId: string, status: boolean) => void;
	setRaiseHandAccordionStatus: (meetingId: string, status: boolean) => void;
	setMeetingChatVisibility: (meetingId: string, visibilityStatus: MeetingChatVisibility) => void;
	setMeetingViewSelected: (meetingId: string, viewType: MeetingViewType) => void;
	meetingConnection: (
		meetingId: string,
		audioStreamEnabled: boolean,
		selectedAudioDeviceId: string | undefined,
		videoStreamEnabled: boolean,
		selectedVideoDeviceId: string | undefined
	) => void;
	meetingDisconnection: (meetingId: string) => void;
	setLocalStreams: (meetingId: string, streamType: STREAM_TYPE, stream: MediaStream) => void;
	removeLocalStreams: (meetingId: string, streamType: STREAM_TYPE) => void;
	setMeetingSidebarStatus: (meetingId: string, status: boolean) => void;
	setSelectedDeviceId: (meetingId: string, streamType: STREAM_TYPE, deviceId: string) => void;
	setSubscribedTracks: (meetingId: string, streams: StreamsSubscriptionMap) => void;
	setIsCarouseVisible: (meetingId: string, status: boolean) => void;
	setPinnedTile: (meetingId: string, tile: TileData | undefined) => void;
	setTalkingUser: (meetingId: string, userId: string, isTalking: boolean) => void;
	setRemoveSubscription: (meetingId: string, subToRemove: Subscription) => void;
	setAddSubscription: (meetingId: string, subToAdd: Subscription) => void;
	setUpdateSubscription: (meetingId: string, subsToRequest: Subscription[]) => void;
	setDeleteSubscription: (
		meetingId: string,
		subIdToDelete: string,
		streamType: STREAM_TYPE[]
	) => void;
	setBackgroundStream: (meetingId: string, stream: MediaStream) => void;
	removeBackgroundStream: (meetingId: string) => void;
	setBackgroundImage: (meetingId: string, image: VirtualBackgroundType) => void;
	setUserWithHandRaised: (meetingId: string, userId: string, isRaised: boolean) => void;
};

export type RootStore = UsersStoreSlice &
	RoomsStoreSlice &
	SessionStoreSlice &
	ActiveConversationsSlice &
	ChatsRegistryStoreSlice &
	ConnectionsStoreSlice &
	MeetingsSlice &
	ActiveMeetingSlice;
