/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoScreenInConnection,
	IVideoOutConnection
} from '../network/webRTC/webRTC';

export type ActiveMeetingSlice = {
	activeMeeting: ActiveMeeting | undefined;
	meetingConnection: (
		meetingId: string,
		audioStream?: {
			enabled: boolean;
			deviceId?: string;
		},
		videoStream?: {
			enabled: boolean;
			deviceId?: string;
		}
	) => void;
	meetingDisconnection: (meetingId: string) => void;
	setLocalStreams: (meetingId: string, streamType: STREAM_TYPE, stream: MediaStream) => void;
	removeLocalStreams: (meetingId: string, streamType: STREAM_TYPE) => void;
	setMeetingChatVisibility: (visibilityStatus: MeetingChatVisibility) => void;
	setMeetingViewSelected: (viewType: MeetingViewType) => void;
	setMeetingSidebarStatus: (sidebarType: MeetingAccordionType, status: boolean) => void;
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

export type ActiveMeeting = {
	meetingId: string;
	bidirectionalAudioConn: IBidirectionalConnectionAudioInOut;
	videoScreenIn: IVideoScreenInConnection;
	videoOutConn: IVideoOutConnection;
	screenOutConn: IScreenOutConnection;
	localStreams: LocalStreams;
	subscription: StreamsSubscriptionMap;
	sidebarStatus: SidebarStatus;
	chatVisibility: MeetingChatVisibility;
	meetingViewSelected: MeetingViewType;
	isCarouselVisible: boolean;
	pinnedTile?: PinnedTile;
	virtualBackground: VirtualBackground;
	talkingUsers: string[];
	usersWithHandRaised: string[];
};

export enum MeetingAccordionType {
	GENERAL = 'general',
	PARTICIPANTS = 'participants',
	WAITING_LIST = 'waitingList',
	RECORDING = 'recording',
	VISUAL_EFFECTS = 'visualEffects',
	RAISE_HAND = 'raiseHand'
}

export type SidebarStatus = {
	[MeetingAccordionType.GENERAL]: boolean;
	[MeetingAccordionType.PARTICIPANTS]: boolean;
	[MeetingAccordionType.WAITING_LIST]: boolean;
	[MeetingAccordionType.RECORDING]: boolean;
	[MeetingAccordionType.VISUAL_EFFECTS]: boolean;
	[MeetingAccordionType.RAISE_HAND]: boolean;
};

export enum MeetingViewType {
	CINEMA = 'cinema',
	GRID = 'grid'
}

export enum MeetingChatVisibility {
	CLOSED = 'closed',
	OPEN = 'open',
	EXPANDED = 'expanded'
}

export type LocalStreams = {
	audio?: MediaStream;
	video?: MediaStream;
	screen?: MediaStream;
	selectedAudioDeviceId?: string;
	selectedVideoDeviceId?: string;
};

export enum STREAM_TYPE {
	SCREEN = 'screen',
	VIDEO = 'video',
	AUDIO = 'audio'
}

export type Subscription = {
	userId: string;
	type: STREAM_TYPE;
};

export type SubscriptionMap = {
	[subscriptionId: string]: Subscription;
};

export type StreamSubscription = {
	type: STREAM_TYPE;
	stream: MediaStream;
	userId: string;
};

export type StreamsSubscriptionMap = {
	[id: string]: StreamSubscription;
};

export type TileData = {
	userId: string;
	type: STREAM_TYPE;
	creationDate?: string;
};

export type PinnedTile = TileData & { previousViewType?: MeetingViewType };

export type VirtualBackground = {
	backgroundImage: VirtualBackgroundType;
	updatedStream?: MediaStream;
};

export enum VirtualBackgroundType {
	'NONE' = 'None',
	'BLUR' = 'Blur',
	'HOME' = 'Home',
	'JAL_MAHAL' = 'JalMahal',
	'LIVING_ROOM' = 'LivingRoom',
	'MOUNTAINS' = 'Mountains',
	'OFFICE' = 'Office',
	'COWORKING' = 'Coworking',
	'IVY' = 'Ivy'
}
