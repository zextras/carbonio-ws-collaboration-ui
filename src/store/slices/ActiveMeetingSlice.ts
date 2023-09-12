/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import BidirectionalConnectionAudioInOut from '../../network/webRTC/BidirectionalConnectionAudioInOut';
import VideoInConnection from '../../network/webRTC/VideoInConnection';
import VideoOutConnection from '../../network/webRTC/VideoOutConnection';
import {
	MeetingChatVisibility,
	MeetingViewType,
	STREAM_TYPE,
	StreamsSubscriptionMap
} from '../../types/store/ActiveMeetingTypes';
import { ActiveMeetingSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveMeetingSlice = (set: (...any: any) => void): ActiveMeetingSlice => ({
	activeMeeting: {},
	meetingConnection: (
		meetingId: string,
		audioStreamEnabled: boolean,
		selectedAudioDeviceId: string | undefined,
		videoStreamEnabled: boolean,
		selectedVideoDeviceId?: string | undefined
	): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId] = {
					// Default graphic values
					sidebarStatus: {
						sidebarIsOpened: true,
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: false
					},
					chatVisibility: MeetingChatVisibility.CLOSED,
					meetingViewSelected: MeetingViewType.CINEMA,
					// Peer connections
					localStreams: {
						selectedAudioDeviceId,
						selectedVideoDeviceId
					},
					bidirectionalAudioConn: new BidirectionalConnectionAudioInOut(
						meetingId,
						audioStreamEnabled,
						selectedAudioDeviceId
					),
					videoInConn: new VideoInConnection(meetingId),
					videoOutConn: videoStreamEnabled
						? new VideoOutConnection(meetingId, videoStreamEnabled, selectedVideoDeviceId)
						: undefined,
					subscription: {}
				};
			}),
			false,
			'AM/MEETING_CONNECTION'
		);
	},
	meetingDisconnection: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.bidirectionalAudioConn?.closePeerConnection();
				draft.activeMeeting[meetingId]?.videoInConn?.closePeerConnection();
				draft.activeMeeting[meetingId]?.videoOutConn?.closePeerConnection();
				delete draft.activeMeeting[meetingId];
			}),
			false,
			'AM/MEETING_DISCONNECTION'
		);
	},

	setMeetingSidebarStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.sidebarIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_SIDEBAR_STATUS'
		);
	},
	setMeetingActionsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.actionsAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_ACTIONS_ACCORDION_STATUS'
		);
	},
	setMeetingParticipantsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].sidebarStatus.participantsAccordionIsOpened = status;
				}
			}),
			false,
			'AM/SET_MEETING_PARTICIPANTS_ACCORDION_STATUS'
		);
	},
	setMeetingChatVisibility: (meetingId: string, visibilityStatus: MeetingChatVisibility): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].chatVisibility = visibilityStatus;
				}
			}),
			false,
			'AM/SET_CHAT_VIEW'
		);
	},
	setMeetingViewSelected: (meetingId: string, viewType: MeetingViewType): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId].meetingViewSelected = viewType;
				}
			}),
			false,
			'AM/SET_VIEW_TYPE'
		);
	},

	createVideoOutConn: (
		meetingId: string,
		videoStreamEnabled: boolean,
		selectedVideoDeviceId?: string
	): void => {
		set(
			produce((draft: RootStore) => {
				const videoOutConn = new VideoOutConnection(
					meetingId,
					videoStreamEnabled,
					selectedVideoDeviceId
				);
				draft.activeMeeting[meetingId].videoOutConn = videoOutConn;
			}),
			false,
			'AM/SET_VIDEO_OUT_CONN'
		);
	},
	closeVideoOutConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.activeMeeting[meetingId].videoOutConn) {
					draft.activeMeeting[meetingId].videoOutConn?.closePeerConnection();
					delete draft.activeMeeting[meetingId].videoOutConn;
				}
			}),
			false,
			'AM/CLOSE_VIDEO_OUT_CONN'
		);
	},
	createShareOutConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				// TODO IMPLEMENT
				const shareOutConn = new VideoInConnection(meetingId);
				if (!draft.activeMeeting[meetingId].shareOutConn) {
					draft.activeMeeting[meetingId].shareOutConn = shareOutConn;
				}
			}),
			false,
			'AM/SET_SHARE_OUT_CONN'
		);
	},
	closeShareOutConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.shareOutConn?.closePeerConnection();
			}),
			false,
			'AM/CLOSE_SHARE_OUT_CONN'
		);
	},

	setLocalStreams: (meetingId: string, streamType: STREAM_TYPE, stream: MediaStream): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]?.localStreams?.[streamType]) {
					draft.activeMeeting[meetingId].localStreams = {
						...draft.activeMeeting[meetingId].localStreams,
						[streamType]: stream
					};
				} else {
					draft.activeMeeting[meetingId].localStreams = {
						[streamType]: stream
					};
				}
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	removeLocalStreams: (meetingId: string, streamType: STREAM_TYPE): void => {
		set(
			produce((draft: RootStore) => {
				delete draft.activeMeeting[meetingId].localStreams![streamType];
			}),
			false,
			'AM/SET_LOCAL_STREAM'
		);
	},
	setSelectedDeviceId: (meetingId: string, streamType: STREAM_TYPE, deviceId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]?.localStreams) {
					if (streamType === STREAM_TYPE.AUDIO) {
						draft.activeMeeting[meetingId].localStreams = {
							...draft.activeMeeting[meetingId].localStreams,
							selectedAudioDeviceId: deviceId
						};
					} else {
						draft.activeMeeting[meetingId].localStreams = {
							...draft.activeMeeting[meetingId].localStreams,
							selectedVideoDeviceId: deviceId
						};
					}
				} else {
					draft.activeMeeting[meetingId].localStreams = {
						[streamType === STREAM_TYPE.AUDIO ? 'selectedAudioDeviceId' : 'selectedVideoDeviceId']:
							deviceId
					};
				}
			}),
			false,
			'AM/SET_SELECTED_DEVICE_ID'
		);
	},
	setSubscribedTracks: (meetingId: string, streams: StreamsSubscriptionMap): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId].subscription = streams;
			}),
			false,
			'AM/SET_SUBSCRIPTION'
		);
	}
});
