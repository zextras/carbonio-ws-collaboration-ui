/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import BidirectionalConnectionAudioInOut from '../../network/webRTC/BidirectionalConnectionAudioInOut';
import { PeerConnConfig } from '../../network/webRTC/PeerConnConfig';
import VideoOutConnection from '../../network/webRTC/VideoOutConnection';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { ActiveMeetingSlice, RootStore } from '../../types/store/StoreTypes';

export const useActiveMeetingSlice = (set: (...any: any) => void): ActiveMeetingSlice => ({
	activeMeeting: {},
	setMeetingActionsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]) draft.activeMeeting[meetingId] = {};
				if (!draft.activeMeeting[meetingId].sidebarStatus) {
					draft.activeMeeting[meetingId].sidebarStatus = {
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: false
					};
				}
				draft.activeMeeting[meetingId].sidebarStatus!.actionsAccordionIsOpened = status;
			}),
			false,
			'AM/SET_MEETING_ACTIONS_ACCORDION_STATUS'
		);
	},
	setMeetingParticipantsAccordionStatus: (meetingId: string, status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId] = {};
				}
				if (!draft.activeMeeting[meetingId].sidebarStatus) {
					draft.activeMeeting[meetingId].sidebarStatus = {
						actionsAccordionIsOpened: true,
						participantsAccordionIsOpened: false
					};
				}
				draft.activeMeeting[meetingId].sidebarStatus!.participantsAccordionIsOpened = status;
			}),
			false,
			'AM/SET_MEETING_PARTICIPANTS_ACCORDION_STATUS'
		);
	},
	createBidirectionalAudioConn: (
		meetingId: string,
		audioStreamEnabled: boolean,
		peerConnectionConfig: PeerConnConfig
	): void => {
		set(
			produce((draft: RootStore) => {
				const bidirectionalAudioConn = new BidirectionalConnectionAudioInOut(
					peerConnectionConfig,
					audioStreamEnabled,
					meetingId
				);
				if (!draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId] = {};
				}
				if (!draft.activeMeeting[meetingId].bidirectionalAudioConn) {
					draft.activeMeeting[meetingId].bidirectionalAudioConn = bidirectionalAudioConn;
				}
			}),
			false,
			'AM/SET_AUDIO_CONN'
		);
	},
	createVideoOutConn: (meetingId: string, peerConnectionConfig: PeerConnConfig): void => {
		set(
			produce((draft: RootStore) => {
				const videoOutConn = new VideoOutConnection(peerConnectionConfig, meetingId);
				if (!draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId] = {};
				}
				if (!draft.activeMeeting[meetingId].videoOutConn) {
					draft.activeMeeting[meetingId].videoOutConn = videoOutConn;
				}
			}),
			false,
			'AM/SET_VIDEO_OUT_CONN'
		);
	},
	createVideoInConn: (meetingId: string, peerConnectionConfig: PeerConnConfig): void => {
		set(
			produce((draft: RootStore) => {
				const videoInConn = new VideoOutConnection(peerConnectionConfig, meetingId);
				if (!draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId] = {};
				}
				if (!draft.activeMeeting[meetingId].videoInConn) {
					draft.activeMeeting[meetingId].videoInConn = videoInConn;
				}
			}),
			false,
			'AM/SET_VIDEO_IN_CONN'
		);
	},
	createShareOutConn: (meetingId: string, peerConnectionConfig: PeerConnConfig): void => {
		set(
			produce((draft: RootStore) => {
				// TODO IMPLEMENT
				const shareOutConn = new VideoOutConnection(peerConnectionConfig, meetingId);
				if (!draft.activeMeeting[meetingId]) {
					draft.activeMeeting[meetingId] = {};
				}
				if (!draft.activeMeeting[meetingId].shareOutConn) {
					draft.activeMeeting[meetingId].shareOutConn = shareOutConn;
				}
			}),
			false,
			'AM/SET_SHARE_OUT_CONN'
		);
	},
	closeBidirectionalAudioConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.bidirectionalAudioConn?.closePeerConnection();
			}),
			false,
			'AM/CLOSE_AUDIO_CONN'
		);
	},
	closeVideoOutConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.videoOutConn?.closePeerConnection();
			}),
			false,
			'AM/CLOSE_VIDEO_OUT_CONN'
		);
	},
	closeVideoInConn: (meetingId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.activeMeeting[meetingId]?.videoInConn?.closePeerConnection();
			}),
			false,
			'AM/CLOSE_VIDEO_IN_CONN'
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
	}
});
