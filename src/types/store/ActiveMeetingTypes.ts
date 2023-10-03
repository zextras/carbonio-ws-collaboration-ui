/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoInConnection,
	IVideoOutConnection
} from '../network/webRTC/webRTC';

export type ActiveMeeting = {
	bidirectionalAudioConn?: IBidirectionalConnectionAudioInOut;
	videoInConn?: IVideoInConnection;
	videoOutConn?: IVideoOutConnection;
	screenOutConn?: IScreenOutConnection;
	localStreams?: LocalStreams;
	subscription: StreamsSubscriptionMap;
	sidebarStatus: SidebarStatus;
	chatVisibility: MeetingChatVisibility;
	meetingViewSelected: MeetingViewType;
	isCarouselVisible: boolean;
	pinnedTile?: TileData;
};

export type ActiveMeetingMap = {
	[roomId: string]: ActiveMeeting;
};

export type SidebarStatus = {
	sidebarIsOpened: boolean;
	participantsAccordionIsOpened: boolean;
	actionsAccordionIsOpened: boolean;
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
	date?: string;
};
