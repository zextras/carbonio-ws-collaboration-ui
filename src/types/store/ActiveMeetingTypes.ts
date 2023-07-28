/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IBidirectionalConnectionAudioInOut, IVideoOutConnection } from '../network/webRTC/webRTC';

export type ActiveMeeting = {
	sidebarStatus: SidebarStatus;
	chatVisibility: MeetingChatVisibility;
	meetingViewSelected: MeetingViewType;
	bidirectionalAudioConn?: IBidirectionalConnectionAudioInOut;
	videoInConn?: any;
	videoOutConn?: IVideoOutConnection;
	shareOutConn?: any;
	localStreams?: LocalStreams;
	streamsSubscription?: StreamsSubscriptionMap;
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
	GRID = 'grid',
	WAITING = 'waiting'
}

export enum MeetingChatVisibility {
	CLOSED = 'closed',
	OPEN = 'open',
	EXPANDED = 'expanded'
}

export type LocalStreams = {
	audio?: MediaStream;
	video?: MediaStream;
	share?: MediaStream;
};

export enum STREAM_TYPE {
	SHARE = 'share',
	VIDEO = 'video',
	AUDIO = 'audio'
}

export type StreamSubscription = {
	type: STREAM_TYPE;
	stream: MediaStream;
	userId: string; // TODO DECIDE HOW TO HANDLE USER WITH VIDEO AND SHARE ACTIVE WITH SAME SESSION_ID
};

export type StreamsSubscriptionMap = {
	[id: string]: StreamSubscription;
};
