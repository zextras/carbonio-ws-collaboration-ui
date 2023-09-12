/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	IBidirectionalConnectionAudioInOut,
	IVideoInConnection,
	IVideoOutConnection
} from '../network/webRTC/webRTC';

export type ActiveMeeting = {
	sidebarStatus: SidebarStatus;
	chatVisibility: MeetingChatVisibility;
	meetingViewSelected: MeetingViewType;
	bidirectionalAudioConn?: IBidirectionalConnectionAudioInOut;
	videoInConn?: IVideoInConnection;
	videoOutConn?: IVideoOutConnection;
	shareOutConn?: any;
	localStreams?: LocalStreams;
	subscription: StreamsSubscriptionMap;
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

export type StreamSubscription = {
	type: STREAM_TYPE;
	stream: MediaStream;
	userId: string;
};

export type StreamsSubscriptionMap = {
	[id: string]: StreamSubscription;
};
